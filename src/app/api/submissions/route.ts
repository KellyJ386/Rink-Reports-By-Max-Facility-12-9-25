import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for form submission
const submissionSchema = z.object({
  formTemplateId: z.string(),
  facilityId: z.string(),
  fieldResponses: z.array(z.object({
    fieldId: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
    numericValue: z.number().optional(),
    booleanValue: z.boolean().optional(),
    jsonValue: z.record(z.unknown()).optional(),
  })),
  weatherData: z.object({
    temp: z.number().optional(),
    humidity: z.number().optional(),
    conditions: z.string().optional(),
  }).optional(),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    platform: z.string().optional(),
  }).optional(),
});

// GET - List submissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const formTemplateId = searchParams.get('formId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Build query
    const where: Record<string, unknown> = {};

    if (facilityId) where.facilityId = facilityId;
    if (formTemplateId) where.formTemplateId = formTemplateId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) (where.submittedAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.submittedAt as Record<string, Date>).lte = new Date(endDate);
    }

    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where,
        include: {
          formTemplate: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          submittedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { fieldResponses: true, attachments: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.formSubmission.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: submissions,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// POST - Create a new submission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = submissionSchema.parse(body);

    // Verify form exists and is published
    const form = await prisma.formTemplate.findUnique({
      where: { id: validatedData.formTemplateId },
      include: {
        fields: true,
      },
    });

    if (!form || !form.isPublished) {
      return NextResponse.json(
        { error: 'Form not found or not available' },
        { status: 404 }
      );
    }

    // Validate required fields
    const requiredFields = form.fields.filter((f) => f.isRequired);
    const submittedFieldIds = validatedData.fieldResponses.map((r) => r.fieldId);

    for (const requiredField of requiredFields) {
      if (!submittedFieldIds.includes(requiredField.id)) {
        return NextResponse.json(
          { error: `Required field missing: ${requiredField.label}` },
          { status: 400 }
        );
      }
    }

    // Get IP address from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0] || 'unknown';

    // Create submission with responses
    const submission = await prisma.formSubmission.create({
      data: {
        formTemplateId: validatedData.formTemplateId,
        facilityId: validatedData.facilityId,
        submittedById: session.user.id,
        weatherData: validatedData.weatherData,
        deviceInfo: validatedData.deviceInfo,
        ipAddress,
        fieldResponses: {
          create: validatedData.fieldResponses.map((response) => ({
            formFieldId: response.fieldId,
            value: typeof response.value === 'string' ? response.value : null,
            numericValue: response.numericValue,
            booleanValue: response.booleanValue,
            jsonValue: response.jsonValue,
          })),
        },
      },
      include: {
        formTemplate: {
          select: { id: true, name: true, category: true },
        },
        fieldResponses: true,
        submittedBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'FormSubmission',
        entityId: submission.id,
        newValues: {
          formName: submission.formTemplate.name,
          responsesCount: submission.fieldResponses.length,
        },
      },
    });

    return NextResponse.json({ success: true, data: submission }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}

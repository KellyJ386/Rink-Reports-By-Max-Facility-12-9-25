import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for form submission
const submissionSchema = z.object({
  data: z.record(z.unknown()), // Field ID to value mapping
  weatherData: z.object({
    temperature: z.number().optional(),
    humidity: z.number().optional(),
    conditions: z.string().optional(),
  }).optional(),
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
});

// GET - Get submissions for a form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    // Build where clause
    const where: Record<string, unknown> = { formTemplateId: formId };

    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) (where.submittedAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.submittedAt as Record<string, Date>).lte = new Date(endDate);
    }

    if (userId) {
      where.submittedById = userId;
    }

    // Get total count
    const totalCount = await prisma.formSubmission.count({ where });

    // Get submissions with pagination
    const submissions = await prisma.formSubmission.findMany({
      where,
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
        facility: {
          select: { id: true, name: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: submissions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
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
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId } = await params;
    const body = await request.json();
    const validatedData = submissionSchema.parse(body);

    // Get the form template with fields
    const form = await prisma.formTemplate.findUnique({
      where: { id: formId },
      include: {
        fields: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!form.isPublished) {
      return NextResponse.json(
        { error: 'Form is not published' },
        { status: 400 }
      );
    }

    // Validate required fields
    const errors: Array<{ fieldId: string; message: string }> = [];

    for (const field of form.fields) {
      const value = validatedData.data[field.id];

      // Check required fields
      if (field.isRequired && (value === undefined || value === null || value === '')) {
        errors.push({
          fieldId: field.id,
          message: `${field.label} is required`,
        });
        continue;
      }

      // Skip validation if field is empty and not required
      if (value === undefined || value === null || value === '') continue;

      // Type-specific validation
      if (typeof value === 'number') {
        if (field.minValue !== null && value < field.minValue) {
          errors.push({
            fieldId: field.id,
            message: `${field.label} must be at least ${field.minValue}`,
          });
        }
        if (field.maxValue !== null && value > field.maxValue) {
          errors.push({
            fieldId: field.id,
            message: `${field.label} must be at most ${field.maxValue}`,
          });
        }
      }

      if (typeof value === 'string') {
        if (field.minLength !== null && value.length < field.minLength) {
          errors.push({
            fieldId: field.id,
            message: `${field.label} must be at least ${field.minLength} characters`,
          });
        }
        if (field.maxLength !== null && value.length > field.maxLength) {
          errors.push({
            fieldId: field.id,
            message: `${field.label} must be at most ${field.maxLength} characters`,
          });
        }
        if (field.pattern) {
          const regex = new RegExp(field.pattern);
          if (!regex.test(value)) {
            errors.push({
              fieldId: field.id,
              message: `${field.label} format is invalid`,
            });
          }
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Get user's facility
    const facilityUser = await prisma.facilityUser.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!facilityUser) {
      return NextResponse.json(
        { error: 'User is not associated with a facility' },
        { status: 400 }
      );
    }

    // Create the submission
    const submission = await prisma.formSubmission.create({
      data: {
        formTemplateId: formId,
        submittedById: session.user.id,
        facilityId: facilityUser.facilityId,
        formVersion: form.version,
        data: validatedData.data,
        weatherData: validatedData.weatherData,
        location: validatedData.location,
      },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
        facility: {
          select: { id: true, name: true },
        },
        formTemplate: {
          select: { id: true, name: true, category: true },
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
          formName: form.name,
          formCategory: form.category,
        },
      },
    });

    return NextResponse.json(
      { success: true, data: submission },
      { status: 201 }
    );
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

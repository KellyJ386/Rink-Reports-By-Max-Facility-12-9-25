import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateIncidentReportHTML, IncidentReportData } from '@/lib/pdf-generator';

// GET - Generate incident report
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get('incidentId');
    const format = searchParams.get('format') || 'html';

    if (!incidentId) {
      return NextResponse.json({ error: 'Incident ID required' }, { status: 400 });
    }

    // Get incident with related data
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        facility: {
          select: { name: true },
        },
        rink: {
          select: { name: true },
        },
        reportedBy: {
          select: { name: true },
        },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Parse injury details if stored as JSON
    const injuryDetails = incident.injuryDetails as IncidentReportData['incident']['injuryDetails'] | null;
    const witnesses = (incident.witnesses as string[]) || [];

    // Prepare report data
    const reportData: IncidentReportData = {
      facilityName: incident.facility.name,
      rinkName: incident.rink?.name || 'N/A',
      reportDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      incident: {
        id: incident.id.slice(0, 8).toUpperCase(),
        type: incident.incidentType,
        severity: incident.severity,
        occurredAt: incident.occurredAt.toISOString(),
        reportedBy: incident.reportedBy?.name || 'Unknown',
        location: incident.location || 'Not specified',
        description: incident.description,
        injuryDetails: injuryDetails || undefined,
        witnesses,
        immediateActions: incident.immediateActions || '',
        followUpRequired: incident.followUpRequired || false,
        status: incident.status,
      },
    };

    if (format === 'json') {
      return NextResponse.json({ success: true, data: reportData });
    }

    // Generate HTML report
    const html = generateIncidentReportHTML(reportData);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="incident-report-${incidentId.slice(0, 8)}-${Date.now()}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating incident report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// POST - Generate multiple incident reports or summary
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { facilityId, startDate, endDate, incidentTypes, severities } = await request.json();

    if (!facilityId) {
      return NextResponse.json({ error: 'Facility ID required' }, { status: 400 });
    }

    // Build query filters
    const where: Record<string, unknown> = { facilityId };

    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) (where.occurredAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.occurredAt as Record<string, Date>).lte = new Date(endDate);
    }

    if (incidentTypes && incidentTypes.length > 0) {
      where.incidentType = { in: incidentTypes };
    }

    if (severities && severities.length > 0) {
      where.severity = { in: severities };
    }

    // Get incidents
    const incidents = await prisma.incident.findMany({
      where,
      include: {
        facility: { select: { name: true } },
        rink: { select: { name: true } },
        reportedBy: { select: { name: true } },
      },
      orderBy: { occurredAt: 'desc' },
    });

    // Generate summary statistics
    const summary = {
      totalIncidents: incidents.length,
      bySeverity: {
        MINOR: incidents.filter((i) => i.severity === 'MINOR').length,
        MODERATE: incidents.filter((i) => i.severity === 'MODERATE').length,
        SERIOUS: incidents.filter((i) => i.severity === 'SERIOUS').length,
        CRITICAL: incidents.filter((i) => i.severity === 'CRITICAL').length,
      },
      byType: incidents.reduce((acc, i) => {
        acc[i.incidentType] = (acc[i.incidentType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: {
        REPORTED: incidents.filter((i) => i.status === 'REPORTED').length,
        INVESTIGATING: incidents.filter((i) => i.status === 'INVESTIGATING').length,
        RESOLVED: incidents.filter((i) => i.status === 'RESOLVED').length,
        CLOSED: incidents.filter((i) => i.status === 'CLOSED').length,
      },
      requireFollowUp: incidents.filter((i) => i.followUpRequired).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        incidents: incidents.map((i) => ({
          id: i.id,
          type: i.incidentType,
          severity: i.severity,
          status: i.status,
          occurredAt: i.occurredAt,
          location: i.location,
          rink: i.rink?.name,
          reportedBy: i.reportedBy?.name,
        })),
      },
    });
  } catch (error) {
    console.error('Error generating incident summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

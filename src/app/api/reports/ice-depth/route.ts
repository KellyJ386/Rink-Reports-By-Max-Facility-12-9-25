import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateIceDepthReportHTML, IceDepthReportData } from '@/lib/pdf-generator';

// GET - Generate ice depth report
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rinkId = searchParams.get('rinkId');
    const weeks = parseInt(searchParams.get('weeks') || '4');
    const format = searchParams.get('format') || 'html'; // html or json

    if (!rinkId) {
      return NextResponse.json({ error: 'Rink ID required' }, { status: 400 });
    }

    // Get rink and facility info
    const rink = await prisma.rink.findUnique({
      where: { id: rinkId },
      include: {
        facility: {
          select: { id: true, name: true },
        },
      },
    });

    if (!rink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 });
    }

    // Get readings for the specified period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const readings = await prisma.iceDepthReading.findMany({
      where: {
        rinkId,
        recordedAt: { gte: startDate },
      },
      include: {
        recordedBy: {
          select: { name: true },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });

    // Get the latest AI analysis if available
    const latestAnalyzed = readings.find((r) => r.aiAnalysis);
    const analysis = latestAnalyzed?.aiAnalysis as IceDepthReportData['analysis'] | null;

    // Calculate weekly comparison
    const weeklyComparison: IceDepthReportData['weeklyComparison'] = [];
    const weeklyGroups: Record<string, number[]> = {};

    readings.forEach((reading) => {
      const weekStart = getWeekStart(reading.recordedAt);
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!weeklyGroups[weekKey]) {
        weeklyGroups[weekKey] = [];
      }
      if (reading.averageDepth !== null) {
        weeklyGroups[weekKey].push(reading.averageDepth);
      }
    });

    const sortedWeeks = Object.keys(weeklyGroups).sort();
    sortedWeeks.forEach((weekStart, i) => {
      const depths = weeklyGroups[weekStart];
      const avg = depths.reduce((a, b) => a + b, 0) / depths.length;
      const prevAvg = i > 0
        ? weeklyGroups[sortedWeeks[i - 1]].reduce((a, b) => a + b, 0) / weeklyGroups[sortedWeeks[i - 1]].length
        : null;

      weeklyComparison.push({
        weekStart,
        averageDepth: avg,
        change: prevAvg !== null ? avg - prevAvg : null,
      });
    });

    // Prepare report data
    const reportData: IceDepthReportData = {
      facilityName: rink.facility.name,
      rinkName: rink.name,
      reportDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      generatedBy: session.user.name || session.user.email || 'Unknown',
      readings: readings.map((r) => ({
        recordedAt: r.recordedAt.toISOString(),
        recordedBy: r.recordedBy?.name || 'Unknown',
        averageDepth: r.averageDepth,
        minDepth: r.minDepth,
        maxDepth: r.maxDepth,
        variance: r.variance,
        ambientTemp: r.ambientTemp,
        iceTemp: r.iceTemp,
        humidity: r.humidity,
      })),
      analysis: analysis || undefined,
      weeklyComparison,
    };

    if (format === 'json') {
      return NextResponse.json({ success: true, data: reportData });
    }

    // Generate HTML report
    const html = generateIceDepthReportHTML(reportData);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="ice-depth-report-${rinkId}-${Date.now()}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating ice depth report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

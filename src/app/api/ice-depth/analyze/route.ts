import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Gemini AI configuration
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface ReadingPoint {
  pointId: string;
  x: number;
  y: number;
  depth: number | null;
}

interface IceDepthReading {
  id: string;
  recordedAt: Date;
  pointsConfig: number;
  readingPoints: ReadingPoint[];
  averageDepth: number | null;
  minDepth: number | null;
  maxDepth: number | null;
  variance: number | null;
  ambientTemp: number | null;
  iceTemp: number | null;
  humidity: number | null;
}

// POST - Analyze ice depth readings with Gemini AI
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { readingId, compareWithPrevious = true } = await request.json();

    if (!readingId) {
      return NextResponse.json({ error: 'Reading ID required' }, { status: 400 });
    }

    // Get the current reading
    const currentReading = await prisma.iceDepthReading.findUnique({
      where: { id: readingId },
      include: {
        rink: {
          select: { id: true, name: true, icePointsConfig: true },
        },
      },
    });

    if (!currentReading) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
    }

    // Get previous readings for comparison (last 4 weeks)
    let previousReadings: IceDepthReading[] = [];
    if (compareWithPrevious) {
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      previousReadings = await prisma.iceDepthReading.findMany({
        where: {
          rinkId: currentReading.rinkId,
          recordedAt: {
            gte: fourWeeksAgo,
            lt: currentReading.recordedAt,
          },
        },
        orderBy: { recordedAt: 'desc' },
        take: 10,
      }) as IceDepthReading[];
    }

    // Perform analysis
    const analysis = await analyzeIceDepth(currentReading as IceDepthReading, previousReadings);

    // Save analysis to database
    await prisma.iceDepthReading.update({
      where: { id: readingId },
      data: {
        aiAnalysis: analysis,
        aiAnalyzedAt: new Date(),
        status: 'ANALYZED',
      },
    });

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Error analyzing ice depth:', error);
    return NextResponse.json(
      { error: 'Failed to analyze ice depth' },
      { status: 500 }
    );
  }
}

// GET - Get analysis for a specific reading or comparison
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rinkId = searchParams.get('rinkId');
    const weeks = parseInt(searchParams.get('weeks') || '4');

    if (!rinkId) {
      return NextResponse.json({ error: 'Rink ID required' }, { status: 400 });
    }

    // Get readings for the specified period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const readings = await prisma.iceDepthReading.findMany({
      where: {
        rinkId,
        recordedAt: { gte: startDate },
      },
      orderBy: { recordedAt: 'asc' },
    });

    // Calculate week-over-week comparison
    const weeklyData = groupReadingsByWeek(readings as IceDepthReading[]);
    const comparison = calculateWeeklyComparison(weeklyData);
    const trends = analyzeTrends(readings as IceDepthReading[]);

    return NextResponse.json({
      success: true,
      data: {
        weeklyData,
        comparison,
        trends,
        totalReadings: readings.length,
      },
    });
  } catch (error) {
    console.error('Error fetching ice depth analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}

// Analyze ice depth using Gemini AI or fallback to rule-based analysis
async function analyzeIceDepth(
  current: IceDepthReading,
  previous: IceDepthReading[]
): Promise<{
  summary: string;
  patterns: string[];
  risks: string[];
  recommendations: string[];
  weekOverWeekChange: number | null;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  problemAreas: Array<{ pointId: string; issue: string; severity: string }>;
}> {
  // Calculate week-over-week change
  let weekOverWeekChange: number | null = null;
  let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';

  if (previous.length > 0 && current.averageDepth !== null) {
    const lastWeekReadings = previous.filter((r) => {
      const daysDiff = (current.recordedAt.getTime() - r.recordedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 6 && daysDiff <= 8;
    });

    if (lastWeekReadings.length > 0 && lastWeekReadings[0].averageDepth !== null) {
      weekOverWeekChange = current.averageDepth - lastWeekReadings[0].averageDepth;
      if (weekOverWeekChange > 0.05) trendDirection = 'increasing';
      else if (weekOverWeekChange < -0.05) trendDirection = 'decreasing';
    }
  }

  // Identify problem areas
  const problemAreas: Array<{ pointId: string; issue: string; severity: string }> = [];
  const points = current.readingPoints as ReadingPoint[];

  points.forEach((point) => {
    if (point.depth === null) return;

    if (point.depth < 0.5) {
      problemAreas.push({
        pointId: point.pointId,
        issue: 'Critical thin ice',
        severity: 'critical',
      });
    } else if (point.depth < 0.75) {
      problemAreas.push({
        pointId: point.pointId,
        issue: 'Below safe threshold',
        severity: 'warning',
      });
    } else if (point.depth > 1.5) {
      problemAreas.push({
        pointId: point.pointId,
        issue: 'Excessive thickness (energy waste)',
        severity: 'info',
      });
    }
  });

  // Check for high variance (uneven ice)
  const patterns: string[] = [];
  const risks: string[] = [];
  const recommendations: string[] = [];

  if (current.variance !== null && current.variance > 0.1) {
    patterns.push('High variance detected - ice surface is uneven');
    risks.push('Uneven ice can affect skating quality and safety');
    recommendations.push('Consider additional flooding to even out the surface');
  }

  // Check for thin ice
  if (current.minDepth !== null && current.minDepth < 0.75) {
    risks.push(`Thin ice detected: minimum ${current.minDepth}" at ${problemAreas.filter(p => p.severity === 'critical' || p.severity === 'warning').length} location(s)`);
    recommendations.push('Prioritize flooding in thin areas before next use');
  }

  // Check for rapid decrease
  if (weekOverWeekChange !== null && weekOverWeekChange < -0.15) {
    patterns.push('Rapid ice loss detected compared to last week');
    risks.push('Ice is melting faster than normal');
    recommendations.push('Check refrigeration system and building temperature');
  }

  // Check for excessive buildup
  if (current.maxDepth !== null && current.maxDepth > 1.5) {
    patterns.push('Excessive ice buildup in some areas');
    recommendations.push('Consider shaving ice to maintain optimal 1-1.25" thickness');
  }

  // Environmental factors
  if (current.humidity !== null && current.humidity > 60) {
    patterns.push('High humidity may affect ice quality');
    recommendations.push('Increase dehumidification to maintain ice hardness');
  }

  // Try Gemini AI for enhanced analysis
  if (GEMINI_API_KEY) {
    try {
      const aiAnalysis = await getGeminiAnalysis(current, previous, {
        patterns,
        risks,
        recommendations,
        problemAreas,
      });
      if (aiAnalysis) {
        return {
          ...aiAnalysis,
          weekOverWeekChange,
          trendDirection,
          problemAreas,
        };
      }
    } catch (error) {
      console.error('Gemini AI analysis failed, using rule-based:', error);
    }
  }

  // Generate summary
  const summary = generateSummary(current, weekOverWeekChange, trendDirection, problemAreas.length);

  return {
    summary,
    patterns,
    risks,
    recommendations,
    weekOverWeekChange,
    trendDirection,
    problemAreas,
  };
}

async function getGeminiAnalysis(
  current: IceDepthReading,
  previous: IceDepthReading[],
  ruleBasedAnalysis: {
    patterns: string[];
    risks: string[];
    recommendations: string[];
    problemAreas: Array<{ pointId: string; issue: string; severity: string }>;
  }
) {
  const prompt = `You are an ice rink maintenance expert. Analyze this ice depth data and provide insights.

Current Reading:
- Average depth: ${current.averageDepth}"
- Min depth: ${current.minDepth}"
- Max depth: ${current.maxDepth}"
- Variance: ${current.variance}
- Ambient temp: ${current.ambientTemp}°F
- Ice temp: ${current.iceTemp}°F
- Humidity: ${current.humidity}%
- Problem areas: ${ruleBasedAnalysis.problemAreas.length}

Previous ${previous.length} readings averages: ${previous.map(r => r.averageDepth).join(', ')}"

Initial analysis found:
- Patterns: ${ruleBasedAnalysis.patterns.join('; ') || 'None detected'}
- Risks: ${ruleBasedAnalysis.risks.join('; ') || 'None detected'}

Provide a JSON response with:
{
  "summary": "2-3 sentence summary of ice condition",
  "patterns": ["array of patterns observed"],
  "risks": ["array of safety/operational risks"],
  "recommendations": ["array of actionable maintenance recommendations"]
}

Focus on safety, energy efficiency, and skating quality. Be specific and actionable.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error('Could not parse Gemini response');
}

function generateSummary(
  current: IceDepthReading,
  weekOverWeekChange: number | null,
  trend: string,
  problemCount: number
): string {
  const parts: string[] = [];

  if (current.averageDepth !== null) {
    const condition =
      current.averageDepth < 0.75 ? 'below recommended' :
      current.averageDepth > 1.25 ? 'above optimal' : 'within optimal range';
    parts.push(`Average ice depth is ${current.averageDepth}" (${condition}).`);
  }

  if (weekOverWeekChange !== null) {
    const changeDesc = weekOverWeekChange > 0 ? 'increased' : 'decreased';
    parts.push(`Ice has ${changeDesc} by ${Math.abs(weekOverWeekChange).toFixed(2)}" since last week.`);
  }

  if (problemCount > 0) {
    parts.push(`${problemCount} area(s) require attention.`);
  } else {
    parts.push('No immediate concerns detected.');
  }

  return parts.join(' ');
}

function groupReadingsByWeek(readings: IceDepthReading[]) {
  const weeks: Record<string, IceDepthReading[]> = {};

  readings.forEach((reading) => {
    const weekStart = getWeekStart(reading.recordedAt);
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeks[weekKey]) {
      weeks[weekKey] = [];
    }
    weeks[weekKey].push(reading);
  });

  return Object.entries(weeks).map(([weekStart, weekReadings]) => ({
    weekStart,
    readings: weekReadings,
    averageDepth: calculateAverage(weekReadings.map((r) => r.averageDepth).filter((d) => d !== null) as number[]),
    minDepth: Math.min(...weekReadings.map((r) => r.minDepth).filter((d) => d !== null) as number[]),
    maxDepth: Math.max(...weekReadings.map((r) => r.maxDepth).filter((d) => d !== null) as number[]),
    readingsCount: weekReadings.length,
  }));
}

function calculateWeeklyComparison(weeklyData: ReturnType<typeof groupReadingsByWeek>) {
  if (weeklyData.length < 2) {
    return null;
  }

  const comparisons = [];
  for (let i = 1; i < weeklyData.length; i++) {
    const current = weeklyData[i];
    const previous = weeklyData[i - 1];

    comparisons.push({
      currentWeek: current.weekStart,
      previousWeek: previous.weekStart,
      depthChange: current.averageDepth - previous.averageDepth,
      percentChange: ((current.averageDepth - previous.averageDepth) / previous.averageDepth) * 100,
    });
  }

  return comparisons;
}

function analyzeTrends(readings: IceDepthReading[]) {
  if (readings.length < 3) {
    return { trend: 'insufficient_data', confidence: 0 };
  }

  const depths = readings
    .map((r) => r.averageDepth)
    .filter((d) => d !== null) as number[];

  // Simple linear regression
  const n = depths.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = depths.reduce((a, b) => a + b, 0);
  const sumXY = depths.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  let trend: string;
  let confidence: number;

  if (slope > 0.02) {
    trend = 'increasing';
    confidence = Math.min(slope * 10, 1);
  } else if (slope < -0.02) {
    trend = 'decreasing';
    confidence = Math.min(Math.abs(slope) * 10, 1);
  } else {
    trend = 'stable';
    confidence = 1 - Math.abs(slope) * 10;
  }

  return { trend, confidence: Math.round(confidence * 100) };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

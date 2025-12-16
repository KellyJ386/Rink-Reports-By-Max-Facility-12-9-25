import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CustomDiagramConfig } from '@/types';

// GET - List all custom diagrams for a facility
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const rinkId = searchParams.get('rinkId');

    // For now, return preset diagrams plus any custom ones stored
    // In production, these would be stored in the database
    const presetDiagrams: CustomDiagramConfig[] = [
      {
        id: 'preset_25',
        name: '25-Point Standard',
        description: 'Standard 5x5 grid pattern for most rinks',
        rinkType: 'standard',
        dimensions: { length: 200, width: 85 },
        points: generateGridPoints(5, 5),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isDefault: true,
      },
      {
        id: 'preset_35',
        name: '35-Point Extended',
        description: 'Extended 5x7 grid for detailed measurement',
        rinkType: 'standard',
        dimensions: { length: 200, width: 85 },
        points: generateGridPoints(5, 7),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isDefault: true,
      },
      {
        id: 'preset_47',
        name: '47-Point NHL',
        description: 'NHL-style with extra goal area points',
        rinkType: 'standard',
        dimensions: { length: 200, width: 85 },
        points: generateNHLPoints(),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isDefault: true,
      },
      {
        id: 'preset_olympic',
        name: 'Olympic Rink',
        description: 'Olympic size rink (200x100)',
        rinkType: 'olympic',
        dimensions: { length: 200, width: 100 },
        points: generateGridPoints(5, 7),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isDefault: true,
      },
      {
        id: 'preset_curling',
        name: 'Curling Sheet',
        description: 'Linear measurement for curling sheets',
        rinkType: 'curling',
        dimensions: { length: 150, width: 16 },
        points: generateCurlingPoints(),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isDefault: true,
      },
    ];

    // TODO: Fetch custom diagrams from database
    // const customDiagrams = await prisma.customDiagram.findMany({
    //   where: { facilityId, rinkId },
    //   orderBy: { updatedAt: 'desc' },
    // });

    return NextResponse.json({
      diagrams: presetDiagrams,
      // customDiagrams,
    });
  } catch (error) {
    console.error('Error fetching diagrams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diagrams' },
      { status: 500 }
    );
  }
}

// POST - Create a new custom diagram
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, rinkType, dimensions, points, facilityId, rinkId } = body;

    if (!name || !points || points.length === 0) {
      return NextResponse.json(
        { error: 'Name and points are required' },
        { status: 400 }
      );
    }

    // Validate points structure
    for (const point of points) {
      if (
        typeof point.pointId !== 'string' ||
        typeof point.x !== 'number' ||
        typeof point.y !== 'number' ||
        point.x < 0 || point.x > 100 ||
        point.y < 0 || point.y > 100
      ) {
        return NextResponse.json(
          { error: 'Invalid point structure' },
          { status: 400 }
        );
      }
    }

    const diagram: CustomDiagramConfig = {
      id: `custom_${Date.now()}`,
      name,
      description,
      rinkType: rinkType || 'custom',
      dimensions: dimensions || { length: 200, width: 85 },
      points,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // TODO: Save to database
    // const saved = await prisma.customDiagram.create({
    //   data: {
    //     ...diagram,
    //     facilityId,
    //     rinkId,
    //     createdById: session.user.id,
    //   },
    // });

    return NextResponse.json({ diagram }, { status: 201 });
  } catch (error) {
    console.error('Error creating diagram:', error);
    return NextResponse.json(
      { error: 'Failed to create diagram' },
      { status: 500 }
    );
  }
}

// Helper functions for generating preset points
function generateGridPoints(rows: number, cols: number) {
  const points = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const xPadding = 10;
      const yPadding = 10;
      const xSpacing = (100 - 2 * xPadding) / (cols - 1);
      const ySpacing = (100 - 2 * yPadding) / (rows - 1);
      points.push({
        pointId: `p${row * cols + col + 1}`,
        x: xPadding + col * xSpacing,
        y: yPadding + row * ySpacing,
        depth: null,
        label: `${String.fromCharCode(65 + row)}${col + 1}`,
      });
    }
  }
  return points;
}

function generateNHLPoints() {
  const points = [];
  let idx = 1;

  // Center line points
  for (let i = 0; i < 5; i++) {
    points.push({
      pointId: `center${i + 1}`,
      x: 50,
      y: 10 + i * 20,
      depth: null,
      label: `C${i + 1}`,
    });
    idx++;
  }

  // Goal crease areas
  ['L', 'R'].forEach((side, sideIdx) => {
    const x = sideIdx === 0 ? 15 : 85;
    for (let i = 0; i < 3; i++) {
      points.push({
        pointId: `goal${side}${i + 1}`,
        x,
        y: 35 + i * 15,
        depth: null,
        label: `G${side}${i + 1}`,
      });
      idx++;
    }
  });

  // Regular grid
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 7; col++) {
      if (col !== 3) {
        points.push({
          pointId: `p${idx}`,
          x: 7 + col * 14.3,
          y: 10 + row * 20,
          depth: null,
          label: `${String.fromCharCode(65 + row)}${col < 3 ? col + 1 : col}`,
        });
        idx++;
      }
    }
  }

  return points.slice(0, 47);
}

function generateCurlingPoints() {
  const points = [];
  for (let i = 0; i < 15; i++) {
    points.push({
      pointId: `c${i + 1}`,
      x: 5 + i * 6.4,
      y: 50,
      depth: null,
      label: `${i + 1}`,
    });
  }
  return points;
}

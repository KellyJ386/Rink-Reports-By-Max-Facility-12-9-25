import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Acknowledge an alert
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId } = await params;

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        isAcknowledged: true,
        acknowledgedById: session.user.id,
        acknowledgedAt: new Date(),
      },
      include: {
        facility: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: alert });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}

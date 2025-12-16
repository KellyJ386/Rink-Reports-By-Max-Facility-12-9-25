import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getNotification,
  markAsRead,
  dismissNotification,
  deleteNotification,
} from '@/lib/notifications/service';

interface RouteParams {
  params: { id: string };
}

// GET /api/notifications/[id] - Get a single notification
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notification = await getNotification(params.id, session.user.id);
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/[id] - Update notification (mark as read, dismiss)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'markAsRead') {
      const notification = await markAsRead(params.id, session.user.id);
      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ notification });
    }

    if (action === 'dismiss') {
      const success = await dismissNotification(params.id, session.user.id);
      if (!success) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await deleteNotification(params.id, session.user.id);
    if (!success) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

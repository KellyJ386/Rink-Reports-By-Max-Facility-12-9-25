import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Global Search API
 * Searches across multiple entities in the system
 */

interface SearchResult {
  id: string;
  type: 'incident' | 'equipment' | 'user' | 'form' | 'schedule' | 'rink' | 'reading';
  title: string;
  subtitle: string;
  url: string;
  icon: string;
  metadata?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    if (!query || query.length < 2) {
      return NextResponse.json({ data: [], message: 'Query must be at least 2 characters' });
    }

    const facilityId = session.user.facilityId;
    const results: SearchResult[] = [];

    // Search incidents
    const incidents = await prisma.incident.findMany({
      where: {
        facilityId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { reportNumber: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reportNumber: true,
        title: true,
        type: true,
        severity: true,
        status: true,
      },
    });

    incidents.forEach((incident) => {
      results.push({
        id: incident.id,
        type: 'incident',
        title: incident.title,
        subtitle: `${incident.reportNumber} • ${incident.type} • ${incident.severity}`,
        url: `/dashboard/incidents/${incident.id}`,
        icon: 'ExclamationTriangleIcon',
        metadata: { status: incident.status, severity: incident.severity },
      });
    });

    // Search equipment
    const equipment = await prisma.equipment.findMany({
      where: {
        facilityId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { model: { contains: query, mode: 'insensitive' } },
          { serialNumber: { contains: query, mode: 'insensitive' } },
          { manufacturer: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        model: true,
        status: true,
      },
    });

    equipment.forEach((eq) => {
      results.push({
        id: eq.id,
        type: 'equipment',
        title: eq.name,
        subtitle: `${eq.type} • ${eq.model || 'N/A'}`,
        url: `/dashboard/equipment/${eq.id}`,
        icon: 'WrenchScrewdriverIcon',
        metadata: { status: eq.status },
      });
    });

    // Search users (if manager or above)
    if (['ADMIN', 'OWNER', 'MANAGER'].includes(session.user.role)) {
      const users = await prisma.user.findMany({
        where: {
          facilityId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });

      users.forEach((user) => {
        results.push({
          id: user.id,
          type: 'user',
          title: user.name || user.email,
          subtitle: `${user.role} • ${user.email}`,
          url: `/dashboard/users/${user.id}`,
          icon: 'UserIcon',
          metadata: { role: user.role, status: user.status },
        });
      });
    }

    // Search forms
    const forms = await prisma.formTemplate.findMany({
      where: {
        facilityId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
      },
    });

    forms.forEach((form) => {
      results.push({
        id: form.id,
        type: 'form',
        title: form.name,
        subtitle: `${form.category || 'General'} Form`,
        url: `/dashboard/forms/${form.id}`,
        icon: 'DocumentTextIcon',
        metadata: { status: form.status },
      });
    });

    // Search rinks
    const rinks = await prisma.rink.findMany({
      where: {
        facilityId,
        OR: [{ name: { contains: query, mode: 'insensitive' } }],
      },
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
      },
    });

    rinks.forEach((rink) => {
      results.push({
        id: rink.id,
        type: 'rink',
        title: rink.name,
        subtitle: `${rink.type} Rink`,
        url: `/dashboard/ice-resurfacing?rink=${rink.id}`,
        icon: 'BuildingOfficeIcon',
        metadata: { status: rink.status },
      });
    });

    // Sort results by relevance (exact matches first)
    const lowerQuery = query.toLowerCase();
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(lowerQuery) ? 0 : 1;
      const bExact = b.title.toLowerCase().includes(lowerQuery) ? 0 : 1;
      return aExact - bExact;
    });

    return NextResponse.json({
      data: results.slice(0, limit),
      query,
      totalResults: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}

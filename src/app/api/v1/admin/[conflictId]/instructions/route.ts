import { NextRequest } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import {
  INSTALLATION_STATUSES,
  INSTALLATION_TYPES,
  KINETIC_STATUSES,
  KINETIC_TYPES,
  MAP_ACTOR_KEYS,
  MAP_PRIORITIES,
  STORY_ICON_NAMES,
  ZONE_TYPES,
} from '@/server/lib/admin-validate';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { getConflictDayRange, getConflictLocalNow, getConflictTimezone } from '@/server/lib/adeloopeye-time';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;

  const conflict = await prisma.conflict.findUnique({
    where: { id: conflictId },
    select: {
      id: true,
      name: true,
      escalation: true,
      timezone: true,
      status: true,
      threatLevel: true,
    },
  });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const timezone = getConflictTimezone(conflict);
  const localNow = getConflictLocalNow(timezone);
  const { today, dayDate } = getConflictDayRange(timezone);

  const [actors, eventCount, storyCount, todaySnapshot, lastEvent] = await Promise.all([
    prisma.actor.findMany({
      where: { conflictId },
      select: { id: true, name: true, mapKey: true },
      orderBy: { name: 'asc' },
    }),
    prisma.intelEvent.count({ where: { conflictId } }),
    prisma.mapStory.count({ where: { conflictId } }),
    prisma.conflictDaySnapshot.findFirst({
      where: { conflictId, day: dayDate },
      select: { escalation: true },
    }),
    prisma.intelEvent.findFirst({
      where: { conflictId },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    }),
  ]);

  const generatedAt = new Date().toISOString();
  const reqUrl = new URL(req.url);
  const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
  const adminBaseUrl = `${baseUrl}/api/v1/admin`;
  const dashboardUrl = 'https://www.conflicts.app/dashboard';

}

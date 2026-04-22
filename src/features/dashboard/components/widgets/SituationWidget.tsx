'use client';

import { useContext } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { CasChip } from '@/features/dashboard/components/CasChip';

import { getConflictForDay } from '@/shared/lib/day-filter';

import { DashCtx } from '../DashCtx';

export function SituationWidget() {
  const { day, snapshots, conflict } = useContext(DashCtx);
  const snap = getConflictForDay(snapshots, day);
  if (!snap) return null;
  return (
    <div className="h-full overflow-y-auto">
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="mb-2.5">
            <Badge variant="outline" className="text-[10px] font-mono">
              UNCLASSIFIED // ADELOOPEYE ANALYTICAL // {snap.dayLabel} — {day}
            </Badge>
          </div>
          <p className="text-sm text-foreground leading-relaxed mb-2.5">{snap.summary}</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2.5">
            <Card className="flex-1 border-l-4 border-l-primary">
              <CardContent className="p-3">
                <div className="text-[10px] font-bold tracking-wide mb-1 text-primary">US OBJECTIVE</div>
                <p className="text-xs text-muted-foreground leading-snug">{conflict?.objectives?.us}</p>
              </CardContent>
            </Card>
            <Card className="flex-1 border-l-4 border-l-blue-500">
              <CardContent className="p-3">
                <div className="text-[10px] font-bold tracking-wide mb-1 text-blue-500">ISRAELI OBJECTIVE</div>
                <p className="text-xs text-muted-foreground leading-snug">{conflict?.objectives?.il}</p>
              </CardContent>
            </Card>
          </div>
          <div className="flex gap-3 mt-3 flex-wrap">
            <CasChip label="US KIA"       val={String(snap.casualties.us.kia)}       color="var(--danger)"  />
            <CasChip label="IL Civilians" val={String(snap.casualties.israel.civilians)} color="var(--warning)" />
            <CasChip label="IR Killed"    val={String(snap.casualties.iran.killed)}   color="var(--t2)"      />
            <CasChip label="Regional"     val={String(Object.values(snap.casualties.regional).reduce((s, c) => s + c.killed, 0))} color="var(--t3)" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type RealTimeEventStreamProps = {
  data: any[];
};

export function RealTimeEventStream({ data }: RealTimeEventStreamProps) {
  return (
    <Card className="bg-zinc-900/40 border-zinc-800">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-widest">
          <Activity className="w-3 h-3 text-blue-500" />
          Real-Time Event Stream
          <Badge variant="outline" className="ml-2 text-[8px] bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
            LIVE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
          {data.map((event, idx) => {
            const severityColor =
              event.severity === 'CRITICAL' ? '#ef4444' : event.severity === 'HIGH' ? '#f59e0b' : '#3b82f6';

            return (
              <div
                key={event.id || idx}
                className="flex items-start gap-2 p-2 rounded bg-zinc-950/40 border border-zinc-800/50 hover:border-zinc-700 transition-all group"
              >
                <div className="w-1 h-full rounded-full shrink-0 mt-0.5" style={{ backgroundColor: severityColor }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className="text-[8px] shrink-0"
                      style={{
                        backgroundColor: `${severityColor}15`,
                        borderColor: `${severityColor}40`,
                        color: severityColor,
                      }}
                    >
                      {event.severity}
                    </Badge>
                    <span className="text-[9px] text-zinc-500 mono">{event.timeAgo}</span>
                    <span className="text-[9px] text-zinc-600">•</span>
                    <span className="text-[9px] text-zinc-500 truncate">{event.location}</span>
                  </div>
                  <p className="text-[10px] text-zinc-300 leading-tight line-clamp-2 group-hover:text-zinc-100 transition-colors">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[8px] bg-zinc-800/50 border-zinc-700 text-zinc-400">
                      {event.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

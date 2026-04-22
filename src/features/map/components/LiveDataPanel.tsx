'use client';

import { useState } from 'react';
import { Plane, Cloud, Activity, Ship, Satellite, Shield, ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type LiveDataType = 'flights' | 'weather' | 'seismic' | 'maritime' | 'space' | 'cyber';

type LiveDataToggle = {
  type: LiveDataType;
  icon: React.ReactNode;
  label: string;
  color: string;
  count?: number;
};

type Props = {
  toggles: Record<LiveDataType, boolean>;
  onToggle: (type: LiveDataType) => void;
  stats?: Record<LiveDataType, number>;
  defaultExpanded?: boolean;
};

const DATA_TYPES: LiveDataToggle[] = [
  { type: 'flights', icon: <Plane className="w-3.5 h-3.5" />, label: 'Live Flights', color: 'var(--blue)' },
  { type: 'weather', icon: <Cloud className="w-3.5 h-3.5" />, label: 'Weather Alerts', color: 'var(--warning)' },
  { type: 'seismic', icon: <Activity className="w-3.5 h-3.5" />, label: 'Seismic Activity', color: 'var(--danger)' },
  { type: 'maritime', icon: <Ship className="w-3.5 h-3.5" />, label: 'Maritime Traffic', color: 'var(--teal)' },
  { type: 'space', icon: <Satellite className="w-3.5 h-3.5" />, label: 'Space Weather', color: 'var(--cyber)' },
  { type: 'cyber', icon: <Shield className="w-3.5 h-3.5" />, label: 'Cyber Threats', color: 'var(--info)' },
];

export function LiveDataPanel({ toggles, onToggle, stats, defaultExpanded = true }: Props) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const activeCount = Object.values(toggles).filter(Boolean).length;

  return (
    <Card className="w-full max-w-md border-[var(--bd)]">
      <CardContent className="p-3">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-auto py-2 px-2 justify-between mb-2 hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold tracking-wide">LIVE DATA LAYERS</span>
            {activeCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {activeCount}
              </Badge>
            )}
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {/* Data Type Toggles */}
        {isExpanded && (
          <div className="space-y-1.5">
            {DATA_TYPES.map(({ type, icon, label, color }) => {
              const isActive = toggles[type];
              const count = stats?.[type] || 0;

              return (
                <button
                  key={type}
                  onClick={() => onToggle(type)}
                  className={`
                    w-full flex items-center justify-between p-2 rounded-md
                    transition-all duration-150
                    ${isActive 
                      ? 'bg-primary/10 border-2 border-primary/50' 
                      : 'bg-muted/30 border-2 border-transparent hover:border-muted-foreground/20'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className={`
                        flex items-center justify-center w-7 h-7 rounded
                        ${isActive ? 'bg-primary/20' : 'bg-muted'}
                      `}
                      style={{ color: isActive ? color : 'var(--muted-foreground)' }}
                    >
                      {icon}
                    </div>
                    <span className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {label}
                    </span>
                  </div>

                  {count > 0 && (
                    <Badge 
                      variant={isActive ? "default" : "secondary"}
                      className="h-5 px-2 text-[10px] font-bold"
                    >
                      {count}
                    </Badge>
                  )}
                </button>
              );
            })}

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => DATA_TYPES.forEach(({ type }) => !toggles[type] && onToggle(type))}
                className="flex-1 h-7 text-[10px] font-bold"
              >
                ALL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => DATA_TYPES.forEach(({ type }) => toggles[type] && onToggle(type))}
                className="flex-1 h-7 text-[10px] font-bold"
              >
                NONE
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

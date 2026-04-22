'use client';

import { MapPin, Copy, Check } from 'lucide-react';
import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Props = {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
};

export function CoordinateDisplay({ longitude, latitude, zoom, bearing = 0, pitch = 0 }: Props) {
  const [copied, setCopied] = useState(false);

  const copyCoordinates = () => {
    const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    navigator.clipboard.writeText(coords);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert to MGRS (simplified - just show format)
  const toMGRS = () => {
    // This is a placeholder - real MGRS conversion requires a library
    return '31S EA 12345 67890';
  };

  return (
    <Card className="p-2 bg-[var(--bg-panel)]/95 backdrop-blur-sm border-[var(--border-subtle)]">
      <div className="flex items-center gap-3">
        <MapPin className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        
        <div className="flex items-center gap-3 text-[10px] font-mono">
          {/* Lat/Lon */}
          <div className="flex items-center gap-1">
            <span className="text-[var(--text-tertiary)]">LAT</span>
            <span className="text-[var(--text-primary)]">{latitude.toFixed(6)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-[var(--text-tertiary)]">LON</span>
            <span className="text-[var(--text-primary)]">{longitude.toFixed(6)}</span>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <span className="text-[var(--text-tertiary)]">Z</span>
            <span className="text-[var(--text-primary)]">{zoom.toFixed(1)}</span>
          </div>
        </div>

        {/* Copy button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={copyCoordinates}
          className="h-5 w-5 p-0 ml-auto"
          title="Copy coordinates"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>
    </Card>
  );
}

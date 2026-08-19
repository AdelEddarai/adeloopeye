const LEGEND_ITEMS = [
  { color: 'var(--blue)', shape: 'rect', label: 'US STRIKE TRACK' },
  { color: 'var(--il-green)', shape: 'rect', label: 'IDF STRIKE TRACK' },
  { color: 'var(--teal)', shape: 'rect', label: 'NAVAL STRIKE' },
  { color: 'var(--danger)', shape: 'rect', label: 'HOSTILE MISSILE' },
  { color: 'var(--gold)', shape: 'rect', label: 'INTERCEPTED MISSILE' },
  { color: 'var(--danger)', shape: 'circle', label: 'DESTROYED TARGET' },
  { color: 'var(--warning)', shape: 'circle', label: 'DAMAGED TARGET' },
  { color: 'var(--gold)', shape: 'circle', label: 'TARGETED' },
  { color: 'var(--blue)', shape: 'circle', label: 'US ASSET' },
  { color: 'var(--teal)', shape: 'circle', label: 'IDF ASSET' },
  { color: 'var(--purple)', shape: 'airplane', label: 'LIVE FLIGHTS' },
  { color: 'var(--teal)', shape: 'ship', label: 'LIVE VESSELS / WARSHIPS' },
  { color: 'var(--danger)', shape: 'zone', label: 'CLOSURE ZONE' },
  { color: 'var(--warning)', shape: 'zone', label: 'PATROL ZONE' },
  { color: 'var(--warning)', shape: 'arc', label: 'REPORTED DISINFO CAMPAIGN' },
  { color: 'var(--info)', shape: 'arc', label: 'OBSERVED BOT TRAFFIC' },
  { color: 'var(--danger)', shape: 'arc', label: 'MILITARY CONFLICT / WAR ALERT' },
  { color: 'var(--gold)', shape: 'arc', label: 'TENSION / DEPLOY / LOGISTICS' },
  { color: 'var(--teal)', shape: 'arc', label: 'TRADE / ALLIANCE / AGREEMENT' },
] as const;

export function IntelMapLegend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 12,
        background: 'rgba(28,33,39,0.92)',
        border: '1px solid var(--bd)',
        borderRadius: 2,
        padding: '10px 12px',
        fontFamily: 'monospace',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: 'var(--text-tiny)', color: 'var(--t4)', marginBottom: 6 }}>LEGEND</div>
      {LEGEND_ITEMS.map(({ color, shape, label }) => (
        <div
          key={label}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, fontSize: 'var(--text-caption)', color: 'var(--t3)' }}
        >
          {shape === 'rect' ? (
            <div style={{ width: 12, height: 3, background: color, flexShrink: 0 }} />
          ) : shape === 'arc' ? (
            <svg width="12" height="6" viewBox="0 0 12 6" style={{ flexShrink: 0 }}>
              <path d="M0,5 Q6,-2 12,5" stroke={color} strokeWidth="1.5" fill="none" />
              <path d="M12,5 L10,4 M12,5 L10,6" stroke={color} strokeWidth="1.5" />
            </svg>
          ) : shape === 'zone' ? (
            <div style={{ width: 10, height: 8, background: color + '44', border: `1px solid ${color}`, flexShrink: 0 }} />
          ) : shape === 'airplane' ? (
            <div style={{ width: 10, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" style={{ fill: color }}>
                <path d="M21,16v-2l-8-5V3.5c0-0.83-0.67-1.5-1.5-1.5S10,2.67,10,3.5V9l-8,5v2l8-2.5V19l-2,1.5V22l3.5-1l3.5,1v-1.5L13,19v-5.5L21,16z" />
              </svg>
            </div>
          ) : shape === 'ship' ? (
            <div style={{ width: 10, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" style={{ fill: color }}>
                <path d="M12 2L4 7v10l8 4 8-4V7l-8-5zm0 2.2L18 8v7.6l-6 3-6-3V8l6-3.8z" />
              </svg>
            </div>
          ) : (
            <div
              style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}
            />
          )}
          {label}
        </div>
      ))}
      <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--bd-s)', fontSize: '8px', color: 'var(--t4)' }}>
        Flight data: <a href="https://adsb.fi/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple)', textDecoration: 'none', pointerEvents: 'auto' }}>adsb.fi</a>
      </div>
    </div>
  );
}

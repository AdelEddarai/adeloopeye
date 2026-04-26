/**
 * map-tooltip.ts
 * DeckGL tooltip HTML generator.
 *
 * CODEX §5.4 exception: DeckGL requires raw HTML strings for tooltips.
 * All colours reference CSS variables — zero hex literals allowed.
 */

import type { PickingInfo } from '@deck.gl/core';

import type { Asset, CyberThreat, MaritimeLane, MaritimeVessel, MissileTrack, StrikeArc, Target, ThreatZone } from '@/data/map-data';
import type { ActorMeta } from '@/data/map-tokens';
import { STATUS_META, type MarkerStatus } from '@/data/map-tokens';

const FALLBACK_STATUS = { label: 'Unknown', cssVar: 'var(--t4)' } as const;
function safeStatus(status: string | null | undefined) {
  if (!status) return FALLBACK_STATUS;
  return STATUS_META[status as MarkerStatus] ?? FALLBACK_STATUS;
}

// Inline timestamp formatter (no import to keep file pure .ts)

function fmtTs(ts: string | undefined): string {
  if (!ts) return '';
  const d = new Date(ts);
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const day = String(d.getUTCDate()).padStart(2, '0');
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
  return `${month} ${day} · ${time} UTC`;
}

const FALLBACK_META: ActorMeta = {
  label: '??', cssVar: 'var(--t3)', rgb: [143, 153, 168],
  affiliation: 'NEUTRAL', group: 'Unknown',
};

// Shared wrapper

function wrap(inner: string) {
  return {
    html: `<div style="background:var(--bg-app);border:1px solid var(--bd);padding:8px 10px;font-family:'SFMono-Regular',Menlo,monospace;max-width:260px;border-radius:2px">${inner}</div>`,
    style: { backgroundColor: 'transparent', border: 'none', padding: '0', pointerEvents: 'auto' },
  };
}

function pill(label: string, color: string) {
  return `<span style="background:color-mix(in srgb,${color} 14%,transparent);border:1px solid color-mix(in srgb,${color} 35%,transparent);color:${color};font-size:8px;padding:1px 5px;border-radius:2px;margin-right:3px">${label}</span>`;
}

// Factory

export function createBuildTooltip(am: Record<string, ActorMeta>) {
  const meta = (key: string) => am[key] ?? FALLBACK_META;

  function strikeTooltip(d: StrikeArc): string {
    const m = meta(d.actor);
    const sevColor = d.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)';
    const ts = fmtTs(d.timestamp);
    return `
      <div style="font-weight:700;font-size:11px;color:var(--t1);margin-bottom:5px">${d.label}</div>
      ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:5px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
      <div style="margin-bottom:4px">${pill(m.label, m.cssVar)}${pill(d.type.replace('_', ' '), m.cssVar)}${pill(d.severity, sevColor)}</div>
      <div style="font-size:10px;color:var(--t3)">STATUS: <span style="color:${safeStatus(d.status).cssVar}">${safeStatus(d.status).label}</span></div>
    `;
  }

  function missileTooltip(d: MissileTrack): string {
    const m = meta(d.actor);
    const statusColor = d.status === 'INTERCEPTED' ? 'var(--warning)' : 'var(--danger)';
    const sevColor = d.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)';
    const ts = fmtTs(d.timestamp);
    return `
      <div style="font-weight:700;font-size:11px;color:var(--danger);margin-bottom:5px">${d.label}</div>
      ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:5px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
      <div style="margin-bottom:4px">${pill(m.label, m.cssVar)}${pill(d.type, m.cssVar)}${pill(d.severity, sevColor)}</div>
      <div style="font-size:10px;color:${statusColor};font-weight:700">▶ ${d.status}</div>
    `;
  }

  function targetTooltip(d: Target): string {
    const m = meta(d.actor);
    const sm = safeStatus(d.status);
    const ts = fmtTs(d.timestamp);

    // Check if this is a critical event (fire, explosion, attack, etc.)
    const isCriticalEvent = ['FIRE', 'EXPLOSION', 'ATTACK', 'STRIKE', 'INCIDENT'].includes(d.type);

    // Check if this is Middle East infrastructure
    // @ts-ignore
    const isInfrastructure = d.type === 'INFRASTRUCTURE' || d.type === 'NAVAL_BASE' || d.type === 'OIL_TERMINAL';

    if (isInfrastructure) {
      // Infrastructure tooltip with special styling
      // @ts-ignore
      const infraIcon = d.type === 'NAVAL_BASE' ? '⚓' : d.type === 'OIL_TERMINAL' ? '🛢️' : '🏭';
      // @ts-ignore
      const infraColor = d.type === 'NAVAL_BASE' ? 'var(--info)' : d.type === 'OIL_TERMINAL' ? 'var(--warning)' : 'var(--teal)';

      return `
        <div style="font-weight:700;font-size:12px;color:${infraColor};margin-bottom:5px">${infraIcon} ${d.name}</div>
        <div style="margin-bottom:6px">${pill(d.type.replace('_', ' '), infraColor)}${pill(sm.label, sm.cssVar)}</div>
        <div style="color:var(--t2);font-size:10px;line-height:1.5">${d.description}</div>
        <div style="color:${infraColor};font-size:9px;margin-top:4px;font-weight:700">▶ STRATEGIC INFRASTRUCTURE</div>
      `;
    }

    if (isCriticalEvent) {
      // Critical event tooltip with special styling
      const eventColor = d.type === 'FIRE' ? 'var(--warning)' : d.type === 'EXPLOSION' ? 'var(--danger)' : 'var(--danger)';
      const eventIcon = d.type === 'FIRE' ? '🔥' : d.type === 'EXPLOSION' ? '💥' : d.type === 'ATTACK' ? '⚔️' : d.type === 'STRIKE' ? '🎯' : '⚠️';

      return `
        <div style="font-weight:700;font-size:12px;color:${eventColor};margin-bottom:5px">${eventIcon} ${d.name}</div>
        ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:5px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
        <div style="margin-bottom:6px">${pill(m.label, m.cssVar)}${pill(d.type, eventColor)}${pill('LIVE', 'var(--info)')}</div>
        <div style="color:var(--t2);font-size:10px;line-height:1.5">${d.description}</div>
        <div style="color:${eventColor};font-size:9px;margin-top:4px;font-weight:700">▶ REAL-TIME EVENT</div>
      `;
    }

    // Regular target tooltip
    return `
      <div style="font-weight:700;font-size:12px;color:var(--t1);margin-bottom:5px">${d.name}</div>
      ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:5px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
      <div style="margin-bottom:6px">${pill(m.label, m.cssVar)}${pill(d.type.replace('_', ' '), m.cssVar)}${pill(sm.label, sm.cssVar)}</div>
      <div style="color:var(--t2);font-size:10px;line-height:1.5">${d.description}</div>
    `;
  }

  function assetTooltip(d: Asset): string {
    const m = meta(d.actor);
    const sm = safeStatus(d.status);

    // Check if this is a flight (has properties from OpenSky)
    const isFlightData = d.name && (d.name.startsWith('flight-') || d.description?.includes('Alt:'));

    if (isFlightData) {
      // Flight-specific tooltip
      const ts = fmtTs(d.timestamp);
      return `
        <div style="font-weight:700;font-size:12px;color:var(--info);margin-bottom:5px">✈ ${d.name}</div>
        ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:5px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
        <div style="margin-bottom:4px">${pill(m.label, m.cssVar)}${pill('LIVE FLIGHT', 'var(--info)')}${pill(sm.label, sm.cssVar)}</div>
        ${d.description ? `<div style="color:var(--t2);font-size:10px;line-height:1.5;margin-top:4px">${d.description}</div>` : ''}
        <div style="color:var(--info);font-size:9px;margin-top:4px;font-weight:700">▶ REAL-TIME TRACKING</div>
      `;
    }

    // Regular asset tooltip
    const extra = d.type === 'CARRIER'
      ? `<div style="color:var(--warning);font-size:10px;margin-top:4px;font-weight:700">▶ CARRIER STRIKE GROUP</div>`
      : '';
    return `
      <div style="font-weight:700;font-size:12px;color:var(--t1);margin-bottom:6px">${d.name}</div>
      <div style="margin-bottom:4px">${pill(m.label, m.cssVar)}${pill(d.type.replace('_', ' '), 'var(--t3)')}${pill(sm.label, sm.cssVar)}</div>
      ${d.description ? `<div style="color:var(--t2);font-size:10px;line-height:1.5;margin-top:4px">${d.description}</div>` : ''}
      ${extra}
    `;
  }

  function zoneTooltip(d: ThreatZone): string {
    const m = meta(d.actor);

    // Enhanced tooltips for chokepoints and conflict zones
    const isChokepoint = d.name.includes('Strait') || d.name.includes('Canal') || d.name.includes('Chokepoint');
    // @ts-ignore
    const isConflict = d.type === 'CONFLICT';

    if (isChokepoint) {
      const chokepointIcon = '🚢';
      const chokepointColor = 'var(--danger)';
      return `
        <div style="font-weight:700;font-size:12px;color:${chokepointColor};margin-bottom:5px">${chokepointIcon} ${d.name}</div>
        <div style="margin-bottom:4px">${pill('CHOKEPOINT', chokepointColor)}${pill('HIGH RISK', 'var(--warning)')}</div>
        <div style="color:var(--t2);font-size:10px;line-height:1.5">Critical maritime passage - strategic vulnerability</div>
        <div style="color:${chokepointColor};font-size:9px;margin-top:4px;font-weight:700">▶ SHIPPING DISRUPTION RISK</div>
      `;
    }

    if (isConflict) {
      const conflictIcon = '⚔️';
      const conflictColor = 'var(--danger)';
      return `
        <div style="font-weight:700;font-size:12px;color:${conflictColor};margin-bottom:5px">${conflictIcon} ${d.name}</div>
        <div style="margin-bottom:4px">${pill('CONFLICT ZONE', conflictColor)}${pill('ACTIVE', 'var(--warning)')}</div>
        <div style="color:var(--t2);font-size:10px;line-height:1.5">Active military operations and hostilities</div>
        <div style="color:${conflictColor};font-size:9px;margin-top:4px;font-weight:700">▶ DANGER AREA</div>
      `;
    }

    return `
      <div style="font-weight:700;font-size:11px;color:var(--t1);margin-bottom:4px">${d.name}</div>
      <div>${pill(m.label, m.cssVar)}${pill(d.type.replace('_', ' '), 'var(--warning)')}</div>
    `;
  }

  function cyberThreatTooltip(d: CyberThreat): string {
    // Color based on threat type
    let typeColor: string;
    let typeIcon: string;
    switch (d.type) {
      case 'DDOS':
        typeColor = 'var(--danger)';
        typeIcon = '⚡';
        break;
      case 'MALWARE':
        typeColor = 'var(--warning)';
        typeIcon = '🦠';
        break;
      case 'RANSOMWARE':
        typeColor = '#c832c8';
        typeIcon = '🔒';
        break;
      case 'PHISHING':
        typeColor = 'var(--warning)';
        typeIcon = '🎣';
        break;
      case 'INTRUSION':
        typeColor = 'var(--info)';
        typeIcon = '🚪';
        break;
      default:
        typeColor = 'var(--t3)';
        typeIcon = '⚠️';
    }

    const sevColor = d.severity === 'CRITICAL' ? 'var(--danger)' : d.severity === 'HIGH' ? 'var(--warning)' : 'var(--info)';
    const ts = fmtTs(d.timestamp);

    return `
      <div style="font-weight:700;font-size:12px;color:${typeColor};margin-bottom:5px">${typeIcon} ${d.type} ATTACK</div>
      ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:5px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
      <div style="margin-bottom:6px">${pill(d.severity, sevColor)}${pill('CYBER THREAT', typeColor)}${pill('LIVE', 'var(--info)')}</div>
      
      ${d.targetCompany ? `
        <div style="background:var(--bg-2);border:1px solid var(--bd);padding:6px;margin-bottom:6px;border-radius:2px">
          <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:3px"><strong>🎯 Target:</strong> ${d.targetCompany}</div>
          ${d.targetSector ? `<div style="color:var(--t3);font-size:9px;line-height:1.4"><strong>Sector:</strong> ${d.targetSector} | <strong>Country:</strong> ${d.targetCountry}</div>` : ''}
        </div>
      ` : `<div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:4px"><strong>Target:</strong> ${d.target}</div>`}
      
      <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:4px"><strong>Source IP:</strong> ${d.source}</div>
      <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:4px"><strong>Location:</strong> ${d.location}</div>
      
      ${d.affectedSystems ? `<div style="color:var(--warning);font-size:10px;line-height:1.5;margin-bottom:4px"><strong>⚠️ Affected Systems:</strong> ${d.affectedSystems.toLocaleString()}</div>` : ''}
      ${d.estimatedImpact ? `<div style="color:var(--danger);font-size:10px;line-height:1.5;margin-bottom:6px"><strong>💥 Impact:</strong> ${d.estimatedImpact}</div>` : ''}
      
      ${d.description ? `<div style="color:var(--t3);font-size:9px;line-height:1.4;margin-top:6px;padding-top:6px;border-top:1px solid var(--bd-s)">${d.description.substring(0, 200)}${d.description.length > 200 ? '...' : ''}</div>` : ''}
      <div style="color:${typeColor};font-size:9px;margin-top:6px;font-weight:700">▶ REAL-TIME THREAT INTEL</div>
    `;
  }

  function conflictRelationshipTooltip(d: any): string {
    // Enhanced type mapping with icons and colors
    const typeConfig: Record<string, { color: string; icon: string; label: string }> = {
      'MILITARY_CONFLICT': { color: 'var(--danger)', icon: '⚔️', label: 'MILITARY CONFLICT' },
      'DIPLOMATIC_TENSION': { color: 'var(--warning)', icon: '🤝', label: 'DIPLOMATIC TENSION' },
      'TRADE_ROUTE': { color: 'var(--info)', icon: '🚢', label: 'TRADE ROUTE' },
      'ALLIANCE': { color: 'var(--success)', icon: '🛡️', label: 'ALLIANCE' },
      'SUPPLY_CHAIN': { color: 'var(--cyber)', icon: '📦', label: 'SUPPLY CHAIN' },
      'ENERGY_DEPENDENCY': { color: 'var(--gold)', icon: '⚡', label: 'ENERGY DEPENDENCY' },
      'MIGRATION_FLOW': { color: 'var(--info)', icon: '👥', label: 'MIGRATION FLOW' },
      'ECONOMIC_PARTNERSHIP': { color: 'var(--teal)', icon: '💼', label: 'ECONOMIC PARTNERSHIP' },
    };

    const config = typeConfig[d.type] || { color: 'var(--t3)', icon: '🔗', label: d.type };
    const ts = fmtTs(d.timestamp);
    const directionArrow = d.bidirectional ? '↔' : '→';

    return `
      <div style="font-weight:700;font-size:12px;color:${config.color};margin-bottom:5px">${config.icon} ${config.label}</div>
      ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:5px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
      <div style="margin-bottom:6px">${pill(d.type.replace(/_/g, ' '), config.color)}${pill(`INTENSITY: ${d.intensity}/10`, config.color)}</div>
      
      <div style="background:var(--bg-2);border:1px solid var(--bd);padding:6px;margin-bottom:6px;border-radius:2px">
        <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:3px"><strong>🔴 ${d.sourceCountry}</strong> ${directionArrow} <strong>🔵 ${d.targetCountry}</strong></div>
      </div>
      
      <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:4px">${d.description}</div>
      
      ${d.articles && d.articles.length > 0 ? `<div style="color:var(--t3);font-size:9px;margin-top:4px"><strong>Sources:</strong> ${d.articles.length} article(s)</div>` : ''}
      <div style="color:${config.color};font-size:9px;margin-top:6px;font-weight:700">▶ GEOPOLITICAL INTELLIGENCE</div>
    `;
  }

  function cityTooltip(d: any): string {
    return `
      <div style="font-weight:700;font-size:12px;color:var(--blue-l);margin-bottom:5px">🏙️ ${d.name}</div>
      <div style="margin-bottom:6px">${pill(d.type.replace('_', ' '), 'var(--blue)')}${pill(d.country, 'var(--t3)')}</div>
      <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:6px">Click to view weather forecast</div>
      <div style="color:var(--blue);font-size:9px;margin-top:6px;font-weight:700">▶ CLICK FOR WEATHER</div>
    `;
  }

  function moroccoEventTooltip(d: any): string {
    const typeColors: Record<string, string> = {
      'POLITICAL': 'var(--info)',
      'DIPLOMATIC': 'var(--cyber)',
      'ECONOMIC': 'var(--teal)',
      'INFRASTRUCTURE': 'var(--warning)',
      'WEATHER': 'var(--blue)',
      'FIRE': 'var(--danger)',
      'PROTEST': 'var(--warning)',
      'ACCIDENT': 'var(--danger)',
      'INVESTMENT': 'var(--success)',
      'TRADE': 'var(--info)',
      'TOURISM': 'var(--pink)',
      'AGRICULTURE': 'var(--green)',
      'ENERGY': 'var(--gold)',
      'SECURITY': 'var(--danger)',
      'TRANSPORT': 'var(--blue)',
      'HEALTH': 'var(--info)',
      'EDUCATION': 'var(--blue)',
    };

    const color = typeColors[d.type] || 'var(--t3)';
    const sevColor = d.severity === 'CRITICAL' ? 'var(--danger)' : d.severity === 'HIGH' ? 'var(--warning)' : 'var(--info)';
    const ts = fmtTs(d.timestamp);
    const sourceUrl = typeof d.source === 'string' && /^https?:\/\//.test(d.source) ? d.source : null;

    return `
      <div style="font-weight:700;font-size:12px;color:${color};margin-bottom:5px">🇲🇦 ${d.title}</div>
      ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:5px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
      
      ${d.image ? `
        <div style="margin-bottom:8px;border-radius:4px;overflow:hidden;border:1px solid var(--bd)">
          <img src="${d.image}" alt="Event" style="width:100%;height:120px;object-fit:cover;display:block" onerror="this.style.display='none'" />
        </div>
      ` : ''}
      
      <div style="margin-bottom:6px">${pill(d.type.replace(/_/g, ' '), color)}${pill(d.severity, sevColor)}${pill(d.status, color)}</div>
      
      <div style="background:var(--bg-2);border:1px solid var(--bd);padding:6px;margin-bottom:6px;border-radius:2px">
        <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:3px"><strong>📍 Location:</strong> ${d.location}</div>
        <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:3px"><strong>💥 Impact:</strong> ${d.impact}</div>
      </div>
      
      <div style="color:var(--t3);font-size:9px;line-height:1.4;margin-bottom:6px">${d.description.substring(0, 150)}${d.description.length > 150 ? '...' : ''}</div>
      
      ${sourceUrl ? `
        <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;color:${color};font-size:9px;font-weight:700;text-decoration:none;padding:4px 8px;background:color-mix(in srgb,${color} 15%,transparent);border-radius:2px;margin-top:4px;pointer-events:auto;cursor:pointer">
          🔗 READ FULL ARTICLE →
        </a>
      ` : `
        <div style="display:inline-block;color:var(--t4);font-size:9px;font-weight:700;padding:4px 8px;background:var(--bg-2);border:1px solid var(--bd);border-radius:2px;margin-top:4px">
          SOURCE LINK UNAVAILABLE
        </div>
      `}
    `;
  }

  function moroccoInfrastructureTooltip(d: any): string {
    const statusColors: Record<string, string> = {
      'OPERATIONAL': 'var(--success)',
      'DISRUPTED': 'var(--warning)',
      'CLOSED': 'var(--danger)',
      'UNDER_CONSTRUCTION': 'var(--info)',
    };

    const color = statusColors[d.status] || 'var(--t3)';

    return `
      <div style="font-weight:700;font-size:12px;color:${color};margin-bottom:5px">🏗️ ${d.name}</div>
      <div style="margin-bottom:6px">${pill(d.type.replace(/_/g, ' '), color)}${pill(d.status, color)}</div>
      
      ${d.capacity ? `<div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:4px"><strong>Capacity:</strong> ${d.capacity}</div>` : ''}
      <div style="color:var(--t3);font-size:9px;line-height:1.4;margin-bottom:6px">${d.description}</div>
      <div style="color:${color};font-size:9px;margin-top:6px;font-weight:700">▶ INFRASTRUCTURE STATUS</div>
    `;
  }

  function moroccoConnectionTooltip(d: any): string {
    const typeColors: Record<string, string> = {
      'TRADE_ROUTE': 'var(--info)',
      'DIPLOMATIC': 'var(--cyber)',
      'TRANSPORT': 'var(--warning)',
      'ENERGY': 'var(--gold)',
      'MIGRATION': 'var(--teal)',
    };

    const color = typeColors[d.type] || 'var(--t3)';
    const statusColor = d.status === 'ACTIVE' ? 'var(--success)' : d.status === 'DISRUPTED' ? 'var(--warning)' : 'var(--danger)';

    return `
      <div style="font-weight:700;font-size:12px;color:${color};margin-bottom:5px">🔗 ${d.type.replace(/_/g, ' ')}</div>
      <div style="margin-bottom:6px">${pill(d.type.replace(/_/g, ' '), color)}${pill(d.status, statusColor)}</div>
      
      <div style="background:var(--bg-2);border:1px solid var(--bd);padding:6px;margin-bottom:6px;border-radius:2px">
        <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:3px"><strong>🇲🇦 ${d.from}</strong> → <strong>${d.to}</strong></div>
        <div style="color:var(--t3);font-size:9px;line-height:1.4"><strong>Intensity:</strong> ${d.intensity}/10</div>
      </div>
      
      <div style="color:var(--t3);font-size:9px;line-height:1.4;margin-bottom:6px">${d.description}</div>
      <div style="color:${color};font-size:9px;margin-top:6px;font-weight:700">▶ MOROCCO CONNECTION</div>
    `;
  }

  function moroccoWeatherTooltip(d: any): string {
    const tempColor = d.temperature > 35 ? 'var(--danger)' : d.temperature > 25 ? 'var(--warning)' : 'var(--info)';

    return `
      <div style="font-weight:700;font-size:12px;color:${tempColor};margin-bottom:5px">🌤️ ${d.city} Weather</div>
      <div style="margin-bottom:6px">${pill(d.condition, tempColor)}${d.alert ? pill(d.alert.type, 'var(--danger)') : ''}</div>
      
      <div style="background:var(--bg-2);border:1px solid var(--bd);padding:6px;margin-bottom:6px;border-radius:2px">
        <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:3px"><strong>🌡️ Temperature:</strong> ${d.temperature}°C</div>
        <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:3px"><strong>💧 Humidity:</strong> ${d.humidity}%</div>
        <div style="color:var(--t2);font-size:10px;line-height:1.5"><strong>💨 Wind:</strong> ${d.windSpeed} m/s</div>
      </div>
      
      ${d.alert ? `
        <div style="background:color-mix(in srgb,var(--danger) 15%,transparent);border:1px solid var(--danger);padding:6px;margin-bottom:6px;border-radius:2px">
          <div style="color:var(--danger);font-size:10px;font-weight:700;margin-bottom:2px">⚠️ WEATHER ALERT</div>
          <div style="color:var(--t2);font-size:9px;line-height:1.4">${d.alert.description}</div>
        </div>
      ` : ''}
      
      <div style="color:var(--t3);font-size:9px;line-height:1.4;margin-bottom:6px">${d.description}</div>
      <div style="color:${tempColor};font-size:9px;margin-top:6px;font-weight:700">▶ LIVE WEATHER DATA</div>
    `;
  }

  function moroccoFireTooltip(d: any): string {
    const sevColor = d.severity === 'CRITICAL' ? 'var(--danger)' : d.severity === 'HIGH' ? 'var(--warning)' : 'var(--info)';
    const statusColor = d.status === 'ACTIVE' ? 'var(--danger)' : d.status === 'CONTAINED' ? 'var(--warning)' : 'var(--success)';
    const ts = fmtTs(d.timestamp);

    return `
      <div style="font-weight:700;font-size:12px;color:var(--danger);margin-bottom:5px">🔥 Fire in ${d.location}</div>
      ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:5px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
      
      ${d.image ? `
        <div style="margin-bottom:8px;border-radius:4px;overflow:hidden;border:1px solid var(--bd)">
          <img src="${d.image}" alt="Fire" style="width:100%;height:120px;object-fit:cover;display:block" onerror="this.style.display='none'" />
        </div>
      ` : ''}
      
      <div style="margin-bottom:6px">${pill(d.severity, sevColor)}${pill(d.status, statusColor)}${pill('FIRE', 'var(--danger)')}</div>
      
      <div style="background:var(--bg-2);border:1px solid var(--bd);padding:6px;margin-bottom:6px;border-radius:2px">
        <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:3px"><strong>📍 Location:</strong> ${d.location}</div>
        <div style="color:var(--t2);font-size:10px;line-height:1.5"><strong>🔥 Area:</strong> ${d.area} hectares</div>
      </div>
      
      <div style="color:var(--t3);font-size:9px;line-height:1.4;margin-bottom:6px">${d.description.substring(0, 150)}${d.description.length > 150 ? '...' : ''}</div>
      <div style="color:var(--danger);font-size:9px;margin-top:6px;font-weight:700">▶ ${d.status === 'ACTIVE' ? 'ACTIVE FIRE' : d.status === 'CONTAINED' ? 'FIRE CONTAINED' : 'FIRE EXTINGUISHED'}</div>
    `;
  }

  function moroccoTrafficTooltip(d: any): string {
    const typeColors: Record<string, string> = {
      'ROAD_CLOSED': 'var(--danger)',
      'ACCIDENT': 'var(--warning)',
      'CONGESTION': 'var(--warning)',
      'CONSTRUCTION': 'var(--info)',
      'INCIDENT': 'var(--warning)',
    };

    const color = typeColors[d.type] || 'var(--warning)';
    const sevColor = d.severity === 'CRITICAL' ? 'var(--danger)' : d.severity === 'HIGH' ? 'var(--warning)' : 'var(--info)';
    const ts = fmtTs(d.timestamp);

    return `
      <div style="font-weight:700;font-size:12px;color:${color};margin-bottom:5px">🚧 ${d.type.replace(/_/g, ' ')}</div>
      ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:5px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
      <div style="margin-bottom:6px">${pill(d.type.replace(/_/g, ' '), color)}${pill(d.severity, sevColor)}${pill(d.status, d.status === 'ACTIVE' ? 'var(--danger)' : 'var(--success)')}</div>
      
      <div style="background:var(--bg-2);border:1px solid var(--bd);padding:6px;margin-bottom:6px;border-radius:2px">
        <div style="color:var(--t2);font-size:10px;line-height:1.5"><strong>📍 Location:</strong> ${d.location}</div>
      </div>
      
      <div style="color:var(--t3);font-size:9px;line-height:1.4;margin-bottom:6px">${d.description}</div>
      <div style="color:${color};font-size:9px;margin-top:6px;font-weight:700">▶ TRAFFIC UPDATE</div>
    `;
  }

  function moroccoRouteTooltip(d: any): string {
    const statusColors: Record<string, string> = {
      'OPEN': 'var(--success)',
      'DISRUPTED': 'var(--warning)',
      'CLOSED': 'var(--danger)',
      'CONSTRUCTION': 'var(--info)',
    };

    const conditionColors: Record<string, string> = {
      'EXCELLENT': 'var(--success)',
      'GOOD': 'var(--info)',
      'FAIR': 'var(--warning)',
      'POOR': 'var(--danger)',
    };

    const statusColor = statusColors[d.status] || 'var(--t3)';
    const conditionColor = conditionColors[d.condition] || 'var(--t3)';
    const ts = fmtTs(d.lastUpdated);

    return `
      <div style="font-weight:700;font-size:12px;color:${statusColor};margin-bottom:5px">🛣️ ${d.name}</div>
      ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:5px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
      <div style="margin-bottom:6px">${pill(d.type.replace(/_/g, ' '), 'var(--info)')}${pill(d.status, statusColor)}${pill(d.condition, conditionColor)}</div>
      
      <div style="background:var(--bg-2);border:1px solid var(--bd);padding:6px;margin-bottom:6px;border-radius:2px">
        <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:3px"><strong>📏 Length:</strong> ${d.length} km</div>
        <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:3px"><strong>⚠️ Risk Score:</strong> ${d.riskScore ?? 0}/100</div>
        ${d.tollCost ? `<div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:3px"><strong>💰 Toll:</strong> ${d.tollCost} MAD</div>` : ''}
        <div style="color:var(--t3);font-size:9px;line-height:1.4">${d.description}</div>
      </div>
      
      ${d.incidents && d.incidents.length > 0 ? `
        <div style="background:color-mix(in srgb,var(--warning) 15%,transparent);border:1px solid var(--warning);padding:6px;margin-bottom:6px;border-radius:2px">
          <div style="color:var(--warning);font-size:10px;font-weight:700;margin-bottom:3px">⚠️ ${d.incidents.length} INCIDENT(S)</div>
          ${d.incidents.slice(0, 2).map((inc: any) => `
            <div style="color:var(--t2);font-size:9px;line-height:1.4;margin-bottom:2px">• ${inc.type}: ${inc.description.substring(0, 60)}${inc.description.length > 60 ? '...' : ''}</div>
          `).join('')}
          ${d.incidents.length > 2 ? `<div style="color:var(--t3);font-size:9px;margin-top:2px">+ ${d.incidents.length - 2} more...</div>` : ''}
        </div>
      ` : ''}
      
      <div style="color:${statusColor};font-size:9px;margin-top:6px;font-weight:700">▶ ${d.status === 'OPEN' ? 'ROUTE OPEN' : d.status === 'CLOSED' ? 'ROUTE CLOSED' : d.status === 'DISRUPTED' ? 'ROUTE DISRUPTED' : 'UNDER CONSTRUCTION'}</div>
    `;
  }

  function moroccoRouteIncidentTooltip(d: any): string {
    const typeColors: Record<string, string> = {
      'CLOSURE': 'var(--danger)',
      'ACCIDENT': 'var(--warning)',
      'CONSTRUCTION': 'var(--info)',
      'CONGESTION': 'var(--warning)',
      'WEATHER': 'var(--info)',
    };

    const color = typeColors[d.type] || 'var(--warning)';
    const sevColor = d.severity === 'CRITICAL' ? 'var(--danger)' : d.severity === 'HIGH' ? 'var(--warning)' : 'var(--info)';

    return `
      <div style="font-weight:700;font-size:12px;color:${color};margin-bottom:5px">🚨 Route Incident</div>
      <div style="margin-bottom:6px">${pill(d.type, color)}${pill(d.severity, sevColor)}</div>
      
      <div style="background:var(--bg-2);border:1px solid var(--bd);padding:6px;margin-bottom:6px;border-radius:2px">
        <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:3px"><strong>🛣️ Route:</strong> ${d.routeName}</div>
        <div style="color:var(--t2);font-size:10px;line-height:1.5;margin-bottom:3px"><strong>📍 Location:</strong> ${d.location}</div>
      </div>
      
      <div style="color:var(--t3);font-size:9px;line-height:1.4;margin-bottom:6px">${d.description.substring(0, 120)}${d.description.length > 120 ? '...' : ''}</div>
      <div style="color:${color};font-size:9px;margin-top:6px;font-weight:700">▶ ${d.type === 'CLOSURE' ? 'ROAD CLOSED' : d.type === 'ACCIDENT' ? 'ACCIDENT REPORTED' : d.type === 'CONSTRUCTION' ? 'CONSTRUCTION ZONE' : d.type === 'CONGESTION' ? 'HEAVY TRAFFIC' : 'WEATHER ALERT'}</div>
    `;
  }

  function maritimeLaneTooltip(d: MaritimeLane): string {
    // Enhanced tooltips for strategic routes
    const isHormuz = d.name.includes('Hormuz');
    const isTanker = d.kind === 'TANKER';
    const isChokepoint = d.kind === 'CHOKEPOINT';

    let extraInfo = '';
    let laneColor = 'var(--teal)';

    if (isHormuz) {
      laneColor = 'var(--warning)';
      extraInfo = '<div style="color:var(--warning);font-size:9px;margin-top:4px;font-weight:700">⚠️ 21M barrels/day - 30% of seaborne oil</div>';
    } else if (isTanker) {
      laneColor = 'var(--warning)';
      extraInfo = '<div style="color:var(--warning);font-size:9px;margin-top:4px;font-weight:700">🛢️ OIL TANKER ROUTE</div>';
    } else if (isChokepoint) {
      laneColor = 'var(--danger)';
      extraInfo = '<div style="color:var(--danger);font-size:9px;margin-top:4px;font-weight:700">⚠️ CRITICAL CHOKEPOINT</div>';
    }

    return `
      <div style="font-weight:700;font-size:11px;color:${laneColor};margin-bottom:4px">🛳 ${d.name}</div>
      <div style="margin-bottom:4px">${pill(d.kind.replace(/_/g, ' '), 'var(--info)')}${pill('SEA LANE', laneColor)}</div>
      <div style="color:var(--t3);font-size:9px;line-height:1.4">Approximate commercial corridor for situational awareness. Not a vessel position fix.</div>
      ${extraInfo}
    `;
  }

  function maritimeVesselTooltip(d: MaritimeVessel): string {
    const ts = fmtTs(d.timestamp);
    const sog = d.sog != null ? `${Math.round(d.sog)} kn` : '—';
    const cog = d.cog != null ? `${Math.round(d.cog)}°` : '—';
    return `
      <div style="font-weight:700;font-size:11px;color:var(--teal);margin-bottom:4px">⚓ ${d.name}</div>
      ${ts ? `<div style="font-size:9px;color:var(--blue-l);font-weight:700;margin-bottom:4px;letter-spacing:0.04em">⏱ ${ts}</div>` : ''}
      <div style="margin-bottom:4px">${pill(d.source, 'var(--info)')}${d.shipType ? pill(d.shipType, 'var(--teal)') : ''}</div>
      <div style="background:var(--bg-2);border:1px solid var(--bd);padding:6px;margin-bottom:6px;border-radius:2px">
        <div style="color:var(--t2);font-size:10px;line-height:1.5"><strong>SOG:</strong> ${sog}</div>
        <div style="color:var(--t2);font-size:10px;line-height:1.5"><strong>COG:</strong> ${cog}</div>
        ${d.mmsi ? `<div style="color:var(--t2);font-size:10px;line-height:1.5"><strong>MMSI:</strong> ${d.mmsi}</div>` : ''}
        ${d.flag ? `<div style="color:var(--t2);font-size:10px;line-height:1.5"><strong>Flag:</strong> ${d.flag}</div>` : ''}
      </div>
      <div style="color:var(--t3);font-size:9px">AIS snapshot — refresh cadence follows map data polling.</div>
    `;
  }

  return function buildTooltip(info: PickingInfo): ReturnType<typeof wrap> | null {
    const { object, layer } = info;
    if (!object || !layer) return null;

    const id = layer.id;
    if (id === 'strikes') return wrap(strikeTooltip(object as StrikeArc));
    if (id === 'missiles') return wrap(missileTooltip(object as MissileTrack));
    if (id === 'targets' || id === 'target-labels' || id === 'fire-icons') return wrap(targetTooltip(object as Target));
    if (id === 'assets' || id === 'asset-labels') return wrap(assetTooltip(object as Asset));
    if (id === 'zones') return wrap(zoneTooltip(object as ThreatZone));
    if (id === 'cyber-threats') return wrap(cyberThreatTooltip(object as CyberThreat));
    if (id === 'geopolitical-relationships' || id === 'relationship-country-labels') return wrap(conflictRelationshipTooltip(object));
    if (id === 'cities' || id === 'city-labels') return wrap(cityTooltip(object));
    if (id === 'maritime-lanes' || id === 'maritime-lanes-glow') return wrap(maritimeLaneTooltip(object as MaritimeLane));
    if (id === 'maritime-vessels') return wrap(maritimeVesselTooltip(object as MaritimeVessel));

    // Morocco intelligence tooltips
    if (id === 'morocco-events' || id === 'morocco-events-core' || id === 'morocco-events-ripple' || id === 'morocco-event-icons' || id === 'morocco-event-labels') return wrap(moroccoEventTooltip(object));
    if (id === 'morocco-infrastructure' || id === 'morocco-infrastructure-labels') return wrap(moroccoInfrastructureTooltip(object));
    if (id === 'morocco-connections') return wrap(moroccoConnectionTooltip(object));
    if (id === 'morocco-weather' || id === 'morocco-weather-labels' || id === 'morocco-weather-icons') return wrap(moroccoWeatherTooltip(object));
    if (id === 'morocco-fires' || id === 'morocco-fire-labels') return wrap(moroccoFireTooltip(object));
    if (id === 'morocco-traffic' || id === 'morocco-traffic-labels') return wrap(moroccoTrafficTooltip(object));
    if (id === 'morocco-routes' || id === 'morocco-routes-core' || id === 'morocco-routes-halo' || id === 'morocco-route-risk-segments' || id === 'morocco-route-labels') return wrap(moroccoRouteTooltip(object));
    if (id === 'morocco-route-incidents' || id === 'morocco-route-incident-labels') return wrap(moroccoRouteIncidentTooltip(object));

    return null;
  };
}

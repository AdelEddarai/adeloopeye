import type { PickingInfo } from '@deck.gl/core';

import type {
  Asset,
  MissileTrack,
  StrikeArc,
  Target,
  ThreatZone,
} from '@/data/map-data';

import type { TooltipObject } from './intel-map-layers';

function getRelationshipColor(type: string): [number, number, number, number] {
  switch (type) {
    case 'MILITARY_CONFLICT':  return [255, 60, 60, 255];
    case 'WAR_ALERT':          return [255, 40, 40, 255];
    case 'DIPLOMATIC_TENSION': return [255, 180, 0, 255];
    case 'MILITARY_DEPLOYMENT':return [255, 90, 90, 255];
    case 'BORDER_CLOSURE':     return [180, 50, 50, 255];
    case 'TRADE_ROUTE':        return [80, 160, 220, 255];
    case 'ALLIANCE':           return [80, 200, 120, 255];
    case 'SUPPLY_CHAIN':       return [160, 120, 200, 255];
    case 'ENERGY_DEPENDENCY':  return [220, 120, 40, 255];
    case 'MIGRATION_FLOW':     return [120, 120, 200, 255];
    case 'ECONOMIC_PARTNERSHIP': return [40, 160, 120, 255];
    case 'LOGISTICS_CRISIS':   return [255, 100, 0, 255];
    case 'LOGISTICS_PLAN':     return [50, 220, 180, 255];
    case 'CEASEFIRE':          return [80, 220, 80, 255];
    case 'DIPLOMATIC_AGREEMENT': return [140, 220, 120, 255];
    default:                   return [120, 120, 120, 255];
  }
}

export function getMapTooltip({ object, layer }: PickingInfo<TooltipObject>) {
  if (!object) return null;
  const layerId = layer?.id ?? '';
  let html = '';

  if (layerId === 'strikes') {
    const d = object as StrikeArc;
    const typeLabel = d.type === 'NAVAL_STRIKE' ? 'NAVAL STRIKE' : d.actor === 'ISRAEL' ? 'IDF STRIKE' : 'US STRIKE';
    const typeColor = d.type === 'NAVAL_STRIKE' ? 'var(--teal)' : d.actor === 'ISRAEL' ? 'var(--il-green)' : 'var(--blue-l)';
    html = `
      <div style="font-weight:700;font-size:11px;color:var(--t1);margin-bottom:6px">${d.label}</div>
      <div style="color:${typeColor};font-size:10px;margin-bottom:2px">TYPE: ${typeLabel}</div>
      <div style="color:${d.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)'};font-size:10px">SEVERITY: ${d.severity}</div>
    `;
  } else if (layerId === 'missiles') {
    const d = object as MissileTrack;
    html = `
      <div style="font-weight:700;font-size:11px;color:var(--danger);margin-bottom:6px">${d.label}</div>
      <div style="color:var(--danger);font-size:10px;margin-bottom:2px">TYPE: IRGC BALLISTIC MISSILE</div>
      <div style="color:${d.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)'};font-size:10px;margin-bottom:2px">SEVERITY: ${d.severity}</div>
      <div style="color:${d.status === 'INTERCEPTED' ? 'var(--gold)' : 'var(--danger)'};font-size:10px">STATUS: ${d.status === 'INTERCEPTED' ? '✓ INTERCEPTED' : '⚠ IMPACT CONFIRMED'}</div>
    `;
  } else if (layerId === 'targets') {
    const d = object as Target;
    const statusColor = d.status === 'DESTROYED' ? 'var(--danger)' : d.status === 'DAMAGED' ? 'var(--warning)' : 'var(--gold)';
    const typeColor = d.type === 'NUCLEAR_SITE' ? 'var(--cyber)' : d.type === 'COMMAND' ? 'var(--danger)' : d.type === 'NAVAL_BASE' ? 'var(--blue-l)' : 'var(--t3)';
    html = `
      <div style="font-weight:700;font-size:12px;color:var(--t1);margin-bottom:6px">${d.name}</div>
      <div style="display:flex;gap:4px;margin-bottom:6px">
        <span style="border:1px solid ${typeColor};color:${typeColor};font-size:8px;padding:1px 5px;border-radius:2px">${d.type}</span>
        <span style="border:1px solid ${statusColor};color:${statusColor};font-size:8px;padding:1px 5px;border-radius:2px">${d.status}</span>
      </div>
      <div style="color:var(--t2);font-size:10px;line-height:1.5">${d.description}</div>
    `;
  } else if (layerId === 'assets') {
    const d = object as Asset;
    const nationColor = d.actor === 'US' ? 'var(--blue-l)' : 'var(--teal)';
    let extraLine = '';
    if (d.type === 'CARRIER') {
      extraLine = `<div style="color:var(--gold);font-size:10px;margin-top:4px;font-weight:700">▶ CARRIER STRIKE GROUP</div>`;
    }
    html = `
      <div style="font-weight:700;font-size:12px;color:var(--t1);margin-bottom:6px">${d.name}</div>
      <div style="display:flex;gap:4px;margin-bottom:4px">
        <span style="border:1px solid ${nationColor};color:${nationColor};font-size:8px;padding:1px 5px;border-radius:2px">${d.actor}</span>
        <span style="background:var(--bg-2);border:1px solid var(--bd);color:var(--t3);font-size:8px;padding:1px 5px;border-radius:2px">${d.type}</span>
      </div>
      ${d.description ? `<div style="color:var(--t2);font-size:10px;line-height:1.5;margin-top:4px">${d.description}</div>` : ''}
      ${extraLine}
    `;
  } else if (layerId === 'zones') {
    const d = object as ThreatZone;
    const zoneColor = d.type === 'CLOSURE' ? 'var(--danger)' : d.type === 'PATROL' ? 'var(--warning)' : d.type === 'NFZ' ? 'var(--gold)' : 'var(--danger)';
    html = `
      <div style="font-weight:700;font-size:11px;color:var(--t1);margin-bottom:4px">${d.name}</div>
      <div style="color:${zoneColor};font-size:10px">TYPE: ${d.type}</div>
    `;
  } else if (layerId === 'geopolitical-relationships') {
    const d = object as any;
    const color = getRelationshipColor(d.type);
    const rgb = `${color[0]},${color[1]},${color[2]}`;
    const refs = (d.articles || []).slice(0, 3)
      .map((u: string) => `<a href="${u}" target="_blank" rel="noopener noreferrer" style="color:var(--blue-l);text-decoration:none;">source</a>`)
      .join(' · ');
    html = `
      <div style="font-weight:700;font-size:11px;color:var(--t1);margin-bottom:6px">${d.sourceCountry} → ${d.targetCountry}</div>
      <div style="color:rgb(${rgb});font-size:10px;margin-bottom:2px">TYPE: ${d.type.replace(/_/g, ' ')}</div>
      <div style="color:var(--t3);font-size:10px;margin-bottom:2px">INTENSITY: ${'█'.repeat(Math.max(1, Math.min(10, d.intensity || 0)))} ${d.intensity || 0}/10</div>
      ${d.description ? `<div style="color:var(--t2);font-size:10px;line-height:1.4;margin-top:4px">${d.description}</div>` : ''}
      ${refs ? `<div style="margin-top:6px;font-size:10px;">${refs}</div>` : ''}
    `;
  } else if (layerId === 'disinfo-arcs') {
    const d = object as any;
    const isCampaign = d.kind === 'CAMPAIGN';
    const color = isCampaign ? 'var(--warning)' : 'var(--info)';
    const kindLabel = isCampaign ? 'REPORTED DISINFO CAMPAIGN' : `OBSERVED BOT TRAFFIC${d.subKind ? ` · ${d.subKind}` : ''}`;
    const refs = (d.sources || [])
      .map(
        (s: any) =>
          `<div style="margin-top:4px;padding-top:4px;border-top:1px solid var(--bd);"><a href="${s.url}" target="_blank" style="color:var(--blue-l);text-decoration:none;">${s.title}</a><span style="color:var(--t4);"> · ${s.domain}</span></div>`
      )
      .join('');
    html = `
      <div style="font-weight:700;font-size:11px;color:var(--t1);margin-bottom:6px">${d.label || `${d.source} → ${d.target}`}</div>
      <div style="color:${color};font-size:10px;margin-bottom:2px">KIND: ${kindLabel}</div>
      <div style="color:var(--t3);font-size:10px;margin-bottom:2px">WEIGHT: ${d.weight}</div>
      ${refs}
    `;
  } else if (layerId === 'disinfo-nodes') {
    const d = object as any;
    const dominant = (d.campaignVolume || 0) >= (d.botVolume || 0) ? 'CAMPAIGN REFS' : 'BOT VOLUME';
    const color = dominant === 'CAMPAIGN REFS' ? 'var(--warning)' : 'var(--info)';
    html = `
      <div style="font-weight:700;font-size:11px;color:var(--t1);margin-bottom:6px">${d.name}</div>
      <div style="color:var(--warning);font-size:10px;margin-bottom:2px">CAMPAIGN REFS: ${d.campaignVolume || 0}</div>
      <div style="color:var(--info);font-size:10px;margin-bottom:2px">BOT VOLUME: ${d.botVolume || 0}</div>
      <div style="color:${color};font-size:10px">DOMINANT: ${dominant}</div>
    `;
  } else if (layerId === 'flights-icons' || layerId === 'flights-labels') {
    const d = object as Asset;
    const isMilitary = d.name && (d.name.includes('PYTHON') || d.name.includes('REAPER') || d.name.includes('SENTRY') || d.name.includes('IAF') || d.name.includes('CNA'));
    const badgeColor = isMilitary ? 'var(--danger)' : 'var(--info)';
    html = `
      <div style="font-weight:700;font-size:12px;color:${badgeColor};margin-bottom:4px">✈ ${d.name}</div>
      <div style="color:${badgeColor};font-size:9px;font-weight:700;margin-bottom:4px">${isMilitary ? 'MILITARY AIRCRAFT' : 'LIVE FLIGHT'} · 60 FPS REAL-TIME</div>
      ${d.description ? `<div style="color:var(--t2);font-size:10px;line-height:1.4">${d.description}</div>` : ''}
    `;
  } else if (layerId === 'maritime-vessels') {
    const d = object as any;
    const sog = d.sog != null ? `${Number(d.sog).toFixed(1)} kn` : '—';
    const cog = d.cog != null ? `${Math.round(d.cog)}°` : '—';
    const isMilitary = ['CARRIER', 'DESTROYER', 'FRIGATE', 'SUBMARINE', 'MILITARY'].includes(d.category || '');
    const titleColor = isMilitary ? 'var(--blue-l)' : d.category === 'TANKER' ? 'var(--warning)' : 'var(--teal)';
    const categoryLabel = d.category ? d.category.replace(/_/g, ' ') : 'VESSEL';

    html = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px">
        <div style="font-weight:800;font-size:12px;color:${titleColor}">⚓ ${d.name}</div>
        <span style="font-size:9px;font-weight:700;padding:1px 5px;border-radius:2px;background:rgba(255,255,255,0.08);color:${titleColor};border:1px solid ${titleColor}40">
          ${categoryLabel}
        </span>
      </div>
      ${d.militaryClass ? `<div style="font-size:10px;color:var(--t1);font-weight:600;margin-bottom:4px">${d.militaryClass}</div>` : ''}
      ${d.timestamp ? `<div style="font-size:9px;color:var(--t4);font-family:monospace;margin-bottom:6px">⏱ AIS FIX: ${d.timestamp.slice(11, 19)} UTC</div>` : ''}
      
      <div style="margin-bottom:6px;display:flex;gap:4px;flex-wrap:wrap">
        <span style="border:1px solid var(--info);color:var(--info);font-size:8px;padding:1px 5px;border-radius:2px">${d.source || 'LIVE AIS'}</span>
        ${d.shipType ? `<span style="border:1px solid ${titleColor};color:${titleColor};font-size:8px;padding:1px 5px;border-radius:2px">${d.shipType}</span>` : ''}
        ${d.flag ? `<span style="border:1px solid var(--t3);color:var(--t2);font-size:8px;padding:1px 5px;border-radius:2px">🚩 ${d.flag}</span>` : ''}
      </div>

      <div style="background:var(--bg-2);border:1px solid var(--bd);padding:6px 8px;margin-bottom:6px;border-radius:3px;display:grid;grid-template-columns:1fr 1fr;gap:4px 12px">
        <div style="color:var(--t3);font-size:10px">SPEED: <strong style="color:var(--t1);font-family:monospace">${sog}</strong></div>
        <div style="color:var(--t3);font-size:10px">COURSE: <strong style="color:var(--t1);font-family:monospace">${cog}</strong></div>
        ${d.callsign ? `<div style="color:var(--t3);font-size:10px">CALL: <strong style="color:var(--t1);font-family:monospace">${d.callsign}</strong></div>` : ''}
        ${d.mmsi ? `<div style="color:var(--t3);font-size:10px">MMSI: <strong style="color:var(--t1);font-family:monospace">${d.mmsi}</strong></div>` : ''}
        ${d.length ? `<div style="color:var(--t3);font-size:10px">LEN: <strong style="color:var(--t1);font-family:monospace">${d.length}m</strong></div>` : ''}
        ${d.draft ? `<div style="color:var(--t3);font-size:10px">DRAFT: <strong style="color:var(--t1);font-family:monospace">${d.draft}m</strong></div>` : ''}
      </div>

      ${d.destination ? `<div style="font-size:10px;color:var(--t2);margin-bottom:3px"><strong>DEST:</strong> ${d.destination}</div>` : ''}
      ${d.status ? `<div style="font-size:9px;color:var(--warning);font-weight:600;margin-bottom:3px">STATUS: ${d.status}</div>` : ''}
      <div style="color:var(--t4);font-size:9px;margin-top:4px;border-top:1px solid var(--bd);padding-top:3px">Real-time AIS Telemetry & Dead Reckoning</div>
    `;
  } else if (layerId.includes('morocco') || (object as any).severity || (object as any).location) {
    const d = object as any;
    const sevColor = d.severity === 'CRITICAL' ? 'var(--danger)' : d.severity === 'HIGH' ? 'var(--warning)' : d.severity === 'MEDIUM' ? 'var(--blue-l)' : 'var(--teal)';
    const typeIcon = d.type === 'POLITICAL' ? '🏛️' : d.type === 'DIPLOMATIC' ? '🤝' : d.type === 'ECONOMIC' ? '💼' : d.type === 'INFRASTRUCTURE' ? '🏗️' : d.type === 'WEATHER' ? '🌤️' : d.type === 'FIRE' ? '🔥' : d.type === 'SECURITY' ? '🛡️' : '📍';
    const title = d.title || d.name || d.label || 'Intel Event';
    const loc = d.location || d.city || 'Morocco';
    const coords = d.position ? `[${d.position[0].toFixed(4)}, ${d.position[1].toFixed(4)}]` : '';
    
    html = `
      <div style="font-weight:700;font-size:11px;color:var(--t1);margin-bottom:6px;line-height:1.3">${typeIcon} ${title}</div>
      <div style="display:flex;gap:4px;margin-bottom:6px;flex-wrap:wrap">
        <span style="border:1px solid var(--blue);color:var(--blue-l);font-size:8px;padding:1px 5px;border-radius:2px;font-weight:700">📍 ${loc}</span>
        <span style="border:1px solid ${sevColor};color:${sevColor};font-size:8px;padding:1px 5px;border-radius:2px;font-weight:700">${d.severity || 'INFO'}</span>
        ${coords ? `<span style="border:1px solid var(--bd);color:var(--t3);font-size:8px;padding:1px 5px;border-radius:2px">GPS: ${coords}</span>` : ''}
      </div>
      ${d.description ? `<div style="color:var(--t2);font-size:10px;line-height:1.4;margin-bottom:4px">${d.description}</div>` : ''}
      ${d.impact ? `<div style="color:var(--warning);font-size:9px;margin-top:4px;font-weight:600">IMPACT: ${d.impact}</div>` : ''}
    `;
  } else {
    const obj = object as unknown as Record<string, unknown>;
    const hasContent = obj.label || obj.name;
    if (!hasContent) return null;
    html = `<div style="font-size:11px;color:var(--t1)">${String(obj.label ?? obj.name ?? '')}</div>`;
  }

  const itemUrl = (object as any).url || (object as any).sourceUrl || (object as any).source;
  if (itemUrl && typeof itemUrl === 'string' && itemUrl.startsWith('http')) {
    html += `
      <div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--bd);text-align:right;">
        <a href="${itemUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--blue-l);text-decoration:none;font-size:10px;font-weight:700;display:inline-block;padding:2px 0;">
          VIEW SOURCE ↗
        </a>
      </div>
    `;
  }

  if (!html) return null;
  return {
    html: `<div style="background:var(--bg-app);border:1px solid var(--bd);padding:8px 10px;font-family:monospace;max-width:260px;border-radius:2px;pointer-events:auto;box-shadow:0 4px 12px rgba(0,0,0,0.5);">${html}</div>`,
    style: { backgroundColor: 'transparent', border: 'none', padding: '0', pointerEvents: 'auto' },
  };
}

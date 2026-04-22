import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { fetchCyberThreats, getSimulatedThreats } from '@/server/lib/api-clients/cyber-threat-client';

/**
 * Live Cyber Threats API
 * Returns real-time cyber threat data from multiple free sources:
 * - Shodan InternetDB (no auth required)
 * - GitHub Open-Source Threat Intel Feeds (no auth required)
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Cyber Threats API] Fetching threats...');
    const threats = await fetchCyberThreats();
    
    console.log(`[Cyber Threats API] Fetched ${threats.length} threats`);
    
    // If no threats fetched, use simulated data
    const finalThreats = threats.length > 0 ? threats : getSimulatedThreats();
    
    const stats = {
      total: finalThreats.length,
      ddos: finalThreats.filter(t => t.type === 'DDOS').length,
      malware: finalThreats.filter(t => t.type === 'MALWARE').length,
      intrusion: finalThreats.filter(t => t.type === 'INTRUSION').length,
      phishing: finalThreats.filter(t => t.type === 'PHISHING').length,
      ransomware: finalThreats.filter(t => t.type === 'RANSOMWARE').length,
    };

    console.log('[Cyber Threats API] Stats:', stats);

    return ok(
      {
        threats: finalThreats,
        stats,
        timestamp: new Date().toISOString(),
        sources: threats.length > 0 ? [
          { name: 'Shodan InternetDB', url: 'https://internetdb.shodan.io' },
          { name: 'GitHub Threat Feeds', url: 'https://github.com/drb-ra/C2IntelFeeds' },
          { name: 'IPsum Threat List', url: 'https://github.com/stamparm/ipsum' },
        ] : [
          { name: 'Simulated Data (Real feeds unavailable)', url: '#' },
        ],
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('[Cyber Threats API] Error:', error);
    const threats = getSimulatedThreats();
    
    const stats = {
      total: threats.length,
      ddos: threats.filter(t => t.type === 'DDOS').length,
      malware: threats.filter(t => t.type === 'MALWARE').length,
      intrusion: threats.filter(t => t.type === 'INTRUSION').length,
      phishing: threats.filter(t => t.type === 'PHISHING').length,
      ransomware: threats.filter(t => t.type === 'RANSOMWARE').length,
    };
    
    return ok(
      {
        threats,
        stats,
        timestamp: new Date().toISOString(),
        sources: [{ name: 'Simulated Data (Error occurred)', url: '#' }],
      },
      {
        headers: { 'Cache-Control': 'public, max-age=5' },
      }
    );
  }
}

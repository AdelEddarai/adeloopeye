/**
 * Morocco Logistics Client
 * Ports, airports, rail and border crossings with live operational status,
 * throughput figures and crisis indicators derived from news feeds.
 */

import type { NewsArticle } from './newsapi-client';

export type LogisticsEntry = {
  id: string;
  category: 'PORT' | 'AIRPORT' | 'RAIL' | 'BORDER_CROSSING' | 'TRADE_CORRIDOR';
  name: string;
  position: [number, number];
  status: 'OPERATIONAL' | 'DISRUPTED' | 'CLOSED' | 'UNDER_CONSTRUCTION';
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  capacity: string;
  description: string;
  crisis: boolean;
  incidents: string[];
  lastUpdated: string;
};

type LogisticsSeed = {
  id: string;
  category: LogisticsEntry['category'];
  name: string;
  position: [number, number];
  capacity: string;
  description: string;
};

// Major Moroccan logistics nodes with real-world capacity figures
const LOGISTICS_SEED: LogisticsSeed[] = [
  // Ports
  { id: 'port-tanger-med', category: 'PORT', name: 'Tanger Med Port', position: [-5.4167, 35.8667], capacity: '9M TEU/yr', description: 'Largest port in Africa & Mediterranean — key hub for EU trade' },
  { id: 'port-casablanca', category: 'PORT', name: 'Port of Casablanca', position: [-7.6167, 33.6000], capacity: '1.3M TEU/yr', description: 'Main commercial port for the economic capital' },
  { id: 'port-nador-west-med', category: 'PORT', name: 'Nador West Med', position: [-2.9333, 35.2833], capacity: '3M TEU/yr', description: 'New deep-water port in the Oriental region' },
  { id: 'port-agadir', category: 'PORT', name: 'Port of Agadir', position: [-9.6400, 30.4200], capacity: '5M tonnes/yr', description: 'Fishing & phosphate export hub on the Atlantic' },
  { id: 'port-safi', category: 'PORT', name: 'Port of Safi', position: [-9.2372, 32.2994], capacity: '4M tonnes/yr', description: 'Phosphate export & chemical port' },
  { id: 'port-jorf-lasfar', category: 'PORT', name: 'Jorf Lasfar Port', position: [-8.1167, 33.1000], capacity: '10M tonnes/yr', description: 'Bulk commodity & petrochemical terminal' },
  { id: 'port-dakhla', category: 'PORT', name: 'Port of Dakhla', position: [-15.9582, 23.7158], capacity: '2M tonnes/yr', description: 'Strategic Atlantic gateway to West Africa' },

  // Airports
  { id: 'airport-casablanca', category: 'AIRPORT', name: 'Mohammed V International', position: [-7.5898, 33.3675], capacity: '10M pax/yr', description: 'Primary international hub (CMN)' },
  { id: 'airport-marrakech', category: 'AIRPORT', name: 'Marrakech Menara', position: [-8.0363, 31.6069], capacity: '6M pax/yr', description: 'Main tourist gateway (RAK)' },
  { id: 'airport-rabat', category: 'AIRPORT', name: 'Rabat–Salé Airport', position: [-6.7515, 34.0515], capacity: '2M pax/yr', description: 'Capital city airport (RBA)' },
  { id: 'airport-tangier', category: 'AIRPORT', name: 'Tangier Ibn Battouta', position: [-5.9170, 35.7269], capacity: '1.5M pax/yr', description: 'Northern gateway near Tanger Med (TNG)' },
  { id: 'airport-agadir', category: 'AIRPORT', name: 'Agadir Al Massira', position: [-9.4131, 30.3250], capacity: '3M pax/yr', description: 'Southern tourist airport (AGA)' },

  // Rail
  { id: 'rail-tgv', category: 'RAIL', name: 'LGV Tanger–Kenitra', position: [-6.0000, 34.4000], capacity: '320 km/h', description: 'Africa first high-speed rail line' },
  { id: 'rail-oncf-network', category: 'RAIL', name: 'ONCF National Network', position: [-7.5898, 33.5731], capacity: '2,100 km', description: 'Casablanca–Fès–Oujda & phosphate lines' },

  // Border crossings
  { id: 'border-oujda', category: 'BORDER_CROSSING', name: 'Oujda–Algeria Crossing', position: [-2.0222, 34.6765], capacity: 'Closed since 1994', description: 'Land border with Algeria — road closure in effect' },
  { id: 'border-ceuta', category: 'BORDER_CROSSING', name: 'Ceuta Border (Tarajal)', position: [-5.3167, 35.8883], capacity: '30k pax/day', description: 'EU enclave crossing — high migration pressure' },
  { id: 'border-melilla', category: 'BORDER_CROSSING', name: 'Melilla Border (Beni Enzar)', position: [-2.9333, 35.2917], capacity: '25k pax/day', description: 'EU enclave crossing — frequent closures' },
  { id: 'border-guerguerat', category: 'BORDER_CROSSING', name: 'Guerguerat Crossing', position: [-15.9736, 21.4200], capacity: 'Road + ECOWAS trade', description: 'Strategic gate to Mauritania & West Africa' },
];

const CRISIS_KEYWORDS = [
  'strike', 'block', 'closed', 'closure', 'congestion', 'disrupt',
  'accident', 'delay', 'jam', 'shutdown', 'halt', 'suspend', 'protest',
  'attack', 'bomb', 'traffic', 'maritime', 'freight', 'shortage',
];

const STATUS_KEYWORDS: { keyword: string; status: LogisticsEntry['status'] }[] = [
  { keyword: 'closed', status: 'CLOSED' },
  { keyword: 'shutdown', status: 'CLOSED' },
  { keyword: 'blocked', status: 'CLOSED' },
  { keyword: 'disrupt', status: 'DISRUPTED' },
  { keyword: 'strike', status: 'DISRUPTED' },
  { keyword: 'delay', status: 'DISRUPTED' },
  { keyword: 'construction', status: 'UNDER_CONSTRUCTION' },
  { keyword: 'expansion', status: 'UNDER_CONSTRUCTION' },
];

/**
 * Build a logistics situational snapshot. Status and crisis flags are derived
 * from any Morocco logistics news in the current feed.
 */
export function fetchMoroccoLogistics(articles: NewsArticle[]): LogisticsEntry[] {
  return LOGISTICS_SEED.map(seed => {
    const incidents: string[] = [];
    let status: LogisticsEntry['status'] = 'OPERATIONAL';
    let crisis = false;

    for (const article of articles) {
      const content = `${article.title} ${article.description || ''}`.toLowerCase();
      const nameHits = content.includes(seed.name.toLowerCase());
      const cityHits = content.includes(seed.id.split('-').pop()!.toLowerCase());
      if (!nameHits && !cityHits) continue;

      for (const kw of CRISIS_KEYWORDS) {
        if (content.includes(kw)) {
          crisis = true;
          incidents.push(article.title);
          break;
        }
      }

      for (const s of STATUS_KEYWORDS) {
        if (content.includes(s.keyword)) {
          if (s.status === 'CLOSED' || status === 'OPERATIONAL') {
            status = s.status;
          }
          break;
        }
      }
    }

    const condition: LogisticsEntry['condition'] =
      status === 'CLOSED' ? 'POOR' : status === 'DISRUPTED' ? 'FAIR' : 'GOOD';

    return {
      ...seed,
      status,
      condition,
      crisis,
      incidents: incidents.slice(0, 3),
      lastUpdated: new Date().toISOString(),
    };
  });
}

/**
 * Morocco Routes Client
 * Fetches major highways, roads, and route conditions in Morocco
 */

export type MoroccoRoute = {
  id: string;
  name: string;
  type: 'HIGHWAY' | 'NATIONAL_ROAD' | 'REGIONAL_ROAD' | 'TOLL_ROAD';
  path: [number, number][]; // Array of coordinates forming the route
  status: 'OPEN' | 'CLOSED' | 'DISRUPTED' | 'CONSTRUCTION';
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  description: string;
  length: number; // km
  tollCost?: number; // MAD
  incidents: {
    type: 'ACCIDENT' | 'CONSTRUCTION' | 'CONGESTION' | 'WEATHER' | 'CLOSURE';
    location: string;
    position: [number, number];
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    durationHours?: number;
    weatherImpact?: number; // 0-1
  }[];
  riskScore: number; // 0-100 composite operational risk
  segments: {
    path: [number, number][];
    risk: number; // 0-100
  }[];
  lastUpdated: string;
};

// Major Moroccan cities coordinates
const CITIES = {
  'Tangier': [-5.8134, 35.7595],
  'Tetouan': [-5.3684, 35.5889],
  'Rabat': [-6.8498, 33.9716],
  'Casablanca': [-7.5898, 33.5731],
  'Kenitra': [-6.5802, 34.2610],
  'Fes': [-5.0003, 34.0181],
  'Meknes': [-5.5471, 33.8935],
  'Marrakech': [-7.9811, 31.6295],
  'Agadir': [-9.5981, 30.4278],
  'Essaouira': [-9.7695, 31.5085],
  'Safi': [-9.2372, 32.2994],
  'El Jadida': [-8.5007, 33.2316],
  'Oujda': [-1.9085, 34.6814],
  'Nador': [-2.9287, 35.1681],
  'Beni Mellal': [-6.3498, 32.3373],
  'Taza': [-4.0103, 34.2133],
  'Ouarzazate': [-6.9067, 30.9189],
  'Errachidia': [-4.4267, 31.9314],
  'Laayoune': [-13.1994, 27.1536],
} as const;

/**
 * Generate route path between two cities with realistic curves
 */
function generateRoutePath(from: [number, number], to: [number, number], waypoints: number = 5): [number, number][] {
  const path: [number, number][] = [from];
  
  for (let i = 1; i < waypoints; i++) {
    const t = i / waypoints;
    // Add slight curve variation
    const curveFactor = Math.sin(t * Math.PI) * 0.1;
    const lng = from[0] + (to[0] - from[0]) * t + curveFactor;
    const lat = from[1] + (to[1] - from[1]) * t + curveFactor * 0.5;
    path.push([lng, lat]);
  }
  
  path.push(to);
  return path;
}

/**
 * Fetch Morocco routes from news and traffic sources
 */
export async function fetchMoroccoRoutes(articles: any[]): Promise<MoroccoRoute[]> {
  console.log('[Morocco Routes] Analyzing routes from', articles.length, 'articles...');
  
  const routes: MoroccoRoute[] = [];
  
  // Define major routes in Morocco
  const majorRoutes = [
    // A1 - Tangier to Rabat (Toll Highway)
    {
      id: 'A1',
      name: 'A1 Tangier-Rabat Highway',
      type: 'HIGHWAY' as const,
      from: 'Tangier',
      to: 'Rabat',
      via: ['Kenitra'],
      length: 250,
      tollCost: 85,
    },
    
    // A3 - Rabat to Casablanca (Toll Highway)
    {
      id: 'A3',
      name: 'A3 Rabat-Casablanca Highway',
      type: 'HIGHWAY' as const,
      from: 'Rabat',
      to: 'Casablanca',
      via: [],
      length: 90,
      tollCost: 30,
    },
    
    // A7 - Casablanca to Marrakech (Toll Highway)
    {
      id: 'A7',
      name: 'A7 Casablanca-Marrakech Highway',
      type: 'HIGHWAY' as const,
      from: 'Casablanca',
      to: 'Marrakech',
      via: ['El Jadida', 'Safi'],
      length: 240,
      tollCost: 75,
    },
    
    // A2 - Rabat to Fes (Toll Highway)
    {
      id: 'A2',
      name: 'A2 Rabat-Fes Highway',
      type: 'HIGHWAY' as const,
      from: 'Rabat',
      to: 'Fes',
      via: ['Meknes'],
      length: 200,
      tollCost: 60,
    },
    
    // N1 - Tangier to Tetouan
    {
      id: 'N1',
      name: 'N1 Tangier-Tetouan Road',
      type: 'NATIONAL_ROAD' as const,
      from: 'Tangier',
      to: 'Tetouan',
      via: [],
      length: 60,
    },
    
    // N2 - Fes to Oujda
    {
      id: 'N2',
      name: 'N2 Fes-Oujda Road',
      type: 'NATIONAL_ROAD' as const,
      from: 'Fes',
      to: 'Oujda',
      via: ['Taza'],
      length: 320,
    },
    
    // N8 - Marrakech to Agadir
    {
      id: 'N8',
      name: 'N8 Marrakech-Agadir Road',
      type: 'NATIONAL_ROAD' as const,
      from: 'Marrakech',
      to: 'Agadir',
      via: [],
      length: 250,
    },
    
    // N9 - Marrakech to Ouarzazate (Atlas Mountains)
    {
      id: 'N9',
      name: 'N9 Marrakech-Ouarzazate Road',
      type: 'NATIONAL_ROAD' as const,
      from: 'Marrakech',
      to: 'Ouarzazate',
      via: [],
      length: 200,
    },
    
    // N10 - Agadir to Essaouira (Coastal)
    {
      id: 'N10',
      name: 'N10 Agadir-Essaouira Coastal Road',
      type: 'NATIONAL_ROAD' as const,
      from: 'Agadir',
      to: 'Essaouira',
      via: [],
      length: 175,
    },
    
    // N13 - Fes to Errachidia (Sahara Route)
    {
      id: 'N13',
      name: 'N13 Fes-Errachidia Road',
      type: 'NATIONAL_ROAD' as const,
      from: 'Fes',
      to: 'Errachidia',
      via: [],
      length: 380,
    },
    // A5 - Rabat bypass / regional logistics
    {
      id: 'A5',
      name: 'A5 Rabat Ring Highway',
      type: 'HIGHWAY' as const,
      from: 'Rabat',
      to: 'Kenitra',
      via: [],
      length: 45,
      tollCost: 15,
    },
    // A1 extension to Casablanca port corridors
    {
      id: 'A1-CORRIDOR',
      name: 'A1 Logistics Corridor Casablanca-Port',
      type: 'TOLL_ROAD' as const,
      from: 'Casablanca',
      to: 'El Jadida',
      via: [],
      length: 95,
      tollCost: 28,
    },
    // N6 strategic inland corridor
    {
      id: 'N6',
      name: 'N6 Rabat-Meknes Inland Corridor',
      type: 'NATIONAL_ROAD' as const,
      from: 'Rabat',
      to: 'Meknes',
      via: [],
      length: 150,
    },
    // N16 Mediterranean corridor
    {
      id: 'N16',
      name: 'N16 Tangier-Nador Mediterranean Corridor',
      type: 'NATIONAL_ROAD' as const,
      from: 'Tangier',
      to: 'Nador',
      via: ['Tetouan'],
      length: 420,
    },
  ];
  
  // Build routes with paths and detect incidents from news
  for (const routeConfig of majorRoutes) {
    const fromCoords = CITIES[routeConfig.from as keyof typeof CITIES];
    const toCoords = CITIES[routeConfig.to as keyof typeof CITIES];
    
    if (!fromCoords || !toCoords) continue;
    
    // Generate path
    let path: [number, number][] = [fromCoords];
    
    // Add waypoints if via cities exist
    if (routeConfig.via && routeConfig.via.length > 0) {
      for (const viaCity of routeConfig.via) {
        const viaCoords = CITIES[viaCity as keyof typeof CITIES];
        if (viaCoords) {
          const segment = generateRoutePath(path[path.length - 1], viaCoords, 3);
          path = [...path, ...segment.slice(1)];
        }
      }
      const finalSegment = generateRoutePath(path[path.length - 1], toCoords, 3);
      path = [...path, ...finalSegment.slice(1)];
    } else {
      path = generateRoutePath(fromCoords, toCoords, 8);
    }
    
    // Detect incidents from news articles
    const incidents: MoroccoRoute['incidents'] = [];
    const routeKeywords = [
      routeConfig.id.toLowerCase(),
      routeConfig.name.toLowerCase(),
      routeConfig.from.toLowerCase(),
      routeConfig.to.toLowerCase(),
      'highway',
      'autoroute',
      'route',
    ];
    
    articles.forEach(article => {
      const content = `${article.title} ${article.description || ''}`.toLowerCase();
      
      // Check if article mentions this route
      const mentionsRoute = routeKeywords.some(keyword => content.includes(keyword));
      
      if (mentionsRoute) {
        // Check for incident types
        if (content.includes('accident') || content.includes('crash') || content.includes('collision')) {
          incidents.push({
            type: 'ACCIDENT',
            location: routeConfig.from,
            position: fromCoords,
            description: article.title,
            severity: content.includes('fatal') || content.includes('serious') ? 'CRITICAL' : 'HIGH',
            durationHours: content.includes('ongoing') ? 6 : 2,
            weatherImpact: content.includes('rain') || content.includes('fog') ? 0.5 : 0.1,
          });
        }
        
        if (content.includes('construction') || content.includes('work') || content.includes('repair')) {
          incidents.push({
            type: 'CONSTRUCTION',
            location: routeConfig.from,
            position: fromCoords,
            description: article.title,
            severity: 'MEDIUM',
            durationHours: 24,
            weatherImpact: 0,
          });
        }
        
        if (content.includes('closed') || content.includes('blocked') || content.includes('fermé')) {
          incidents.push({
            type: 'CLOSURE',
            location: routeConfig.from,
            position: fromCoords,
            description: article.title,
            severity: 'CRITICAL',
            durationHours: 8,
            weatherImpact: 0.2,
          });
        }
        
        if (content.includes('traffic') || content.includes('congestion') || content.includes('jam')) {
          incidents.push({
            type: 'CONGESTION',
            location: routeConfig.from,
            position: fromCoords,
            description: article.title,
            severity: 'MEDIUM',
            durationHours: 3,
            weatherImpact: 0.15,
          });
        }
        
        if (content.includes('weather') || content.includes('snow') || content.includes('rain') || content.includes('fog')) {
          incidents.push({
            type: 'WEATHER',
            location: routeConfig.from,
            position: fromCoords,
            description: article.title,
            severity: content.includes('severe') ? 'HIGH' : 'MEDIUM',
            durationHours: content.includes('storm') ? 10 : 4,
            weatherImpact: content.includes('storm') || content.includes('flood') ? 0.9 : 0.45,
          });
        }
      }
    });

    // Determine route status and condition
    let status: MoroccoRoute['status'] = 'OPEN';
    let condition: MoroccoRoute['condition'] = 'GOOD';
    
    if (incidents.some(i => i.type === 'CLOSURE')) {
      status = 'CLOSED';
      condition = 'POOR';
    } else if (incidents.some(i => i.severity === 'CRITICAL')) {
      status = 'DISRUPTED';
      condition = 'POOR';
    } else if (incidents.length > 0) {
      status = 'DISRUPTED';
      condition = 'FAIR';
    } else if (routeConfig.type === 'HIGHWAY') {
      condition = 'EXCELLENT';
    }

    const severityWeight = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 } as const;
    const closurePenalty = status === 'CLOSED' ? 25 : status === 'DISRUPTED' ? 15 : 0;
    const density = routeConfig.length > 0 ? incidents.length / routeConfig.length : 0;
    const weightedImpact = incidents.reduce(
      (sum, incident) =>
        sum +
        severityWeight[incident.severity] * 8 +
        (incident.durationHours || 1) * 0.7 +
        (incident.weatherImpact || 0) * 15,
      0,
    );
    const riskScore = Math.min(100, Math.round(weightedImpact + closurePenalty + density * 1200));

    const segments: MoroccoRoute['segments'] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const midpoint: [number, number] = [
        (path[i][0] + path[i + 1][0]) / 2,
        (path[i][1] + path[i + 1][1]) / 2,
      ];
      const segmentIncidents = incidents.filter(incident => {
        const dist = Math.hypot(incident.position[0] - midpoint[0], incident.position[1] - midpoint[1]);
        return dist < 1.2;
      });
      const segmentRiskBase =
        segmentIncidents.reduce((sum, incident) => sum + severityWeight[incident.severity] * 10, 0) +
        (status === 'CLOSED' ? 20 : status === 'DISRUPTED' ? 10 : 0);
      const segmentRisk = Math.min(100, Math.round(segmentRiskBase + riskScore * 0.25));
      segments.push({ path: [path[i], path[i + 1]], risk: segmentRisk });
    }
    
    routes.push({
      id: routeConfig.id,
      name: routeConfig.name,
      type: routeConfig.type,
      path,
      status,
      condition,
      description: `${routeConfig.from} to ${routeConfig.to}${routeConfig.via && routeConfig.via.length > 0 ? ` via ${routeConfig.via.join(', ')}` : ''}`,
      length: routeConfig.length,
      tollCost: routeConfig.tollCost,
      incidents,
      riskScore,
      segments,
      lastUpdated: new Date().toISOString(),
    });
  }
  
  console.log('[Morocco Routes] Generated', routes.length, 'routes with', routes.reduce((sum, r) => sum + r.incidents.length, 0), 'total incidents');
  
  return routes;
}

/**
 * Get route condition color
 */
export function getRouteConditionColor(condition: MoroccoRoute['condition']): [number, number, number, number] {
  switch (condition) {
    case 'EXCELLENT':
      return [0, 255, 100, 255]; // Green
    case 'GOOD':
      return [100, 200, 255, 255]; // Blue
    case 'FAIR':
      return [255, 200, 0, 255]; // Yellow
    case 'POOR':
      return [255, 80, 0, 255]; // Red
    default:
      return [150, 150, 150, 255]; // Gray
  }
}

/**
 * Get route status color
 */
export function getRouteStatusColor(status: MoroccoRoute['status']): [number, number, number, number] {
  switch (status) {
    case 'OPEN':
      return [0, 255, 100, 255]; // Green
    case 'DISRUPTED':
      return [255, 180, 0, 255]; // Orange
    case 'CLOSED':
      return [255, 50, 50, 255]; // Red
    case 'CONSTRUCTION':
      return [100, 150, 255, 255]; // Blue
    default:
      return [150, 150, 150, 255]; // Gray
  }
}

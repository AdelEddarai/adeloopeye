import type { ThreatZone } from './map-data';

export const MOROCCO_FLASHPOINTS: Omit<ThreatZone, 'sourceEventId'>[] = [
  {
    id: 'zone-guerguerat',
    name: 'Guerguerat Trade Corridor',
    actor: 'NEUTRAL',
    priority: 'P1',
    category: 'ZONE',
    type: 'MILITARY', // Using existing ZoneType
    coordinates: [
      // Polygon around Guerguerat border crossing
      [-11.9667, 21.3167],
      [-11.9167, 21.3667],
      [-11.8833, 21.3167],
      [-11.9333, 21.2667]
    ],
    color: [255, 100, 0, 180], // Orange for trade disruption/tension
    description: 'Critical West Africa trade route and frequent site of geopolitical tension.'
  } as any,
  {
    id: 'zone-ceuta',
    name: 'Ceuta Border Flashpoint',
    actor: 'HOSTILE', // Just to give it a distinct color/priority in the UI
    priority: 'P1',
    category: 'ZONE',
    type: 'CONTESTED',
    coordinates: [
      // Polygon around Ceuta
      [-5.3684, 35.8889],
      [-5.2984, 35.9189],
      [-5.2784, 35.8889],
      [-5.3384, 35.8489]
    ],
    color: [255, 50, 50, 180], // Red for high security/migration pressure
    description: 'High-pressure border crossing. Frequent migration attempts and diplomatic tension.'
  } as any,
  {
    id: 'zone-melilla',
    name: 'Melilla Border Flashpoint',
    actor: 'HOSTILE',
    priority: 'P2',
    category: 'ZONE',
    type: 'CONTESTED',
    coordinates: [
      // Polygon around Melilla
      [-2.9887, 35.2981],
      [-2.9187, 35.3281],
      [-2.8987, 35.2781],
      [-2.9487, 35.2481]
    ],
    color: [255, 50, 50, 180], // Red
    description: 'High-security zone. Critical point for European-African migration flows.'
  } as any,
  {
    id: 'zone-strait-gibraltar',
    name: 'Strait of Gibraltar Maritime Chokepoint',
    actor: 'FRIENDLY',
    priority: 'P1',
    category: 'ZONE',
    type: 'ECONOMIC',
    coordinates: [
      // Polygon covering the strait
      [-6.0, 35.8],
      [-6.0, 36.1],
      [-5.2, 36.2],
      [-5.2, 35.8]
    ],
    color: [0, 150, 255, 120], // Blue for maritime
    description: 'One of the busiest shipping lanes in the world. Dense cargo traffic and naval monitoring.'
  } as any,
];

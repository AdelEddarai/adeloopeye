/**
 * Morocco Location Coordinates Mapping
 * For coordinated selection between Network Graph and Map
 */

export type LocationCoordinates = {
  lat: number;
  lng: number;
  zoom?: number; // Optional custom zoom level
};

/**
 * Major Morocco cities and locations with coordinates
 */
export const MOROCCO_LOCATIONS: Record<string, LocationCoordinates> = {
  // Major Cities
  'Casablanca': { lat: 33.5731, lng: -7.5898, zoom: 11 },
  'Rabat': { lat: 34.0209, lng: -6.8416, zoom: 11 },
  'Marrakech': { lat: 31.6295, lng: -7.9811, zoom: 11 },
  'Fes': { lat: 34.0181, lng: -5.0078, zoom: 11 },
  'Tangier': { lat: 35.7595, lng: -5.8340, zoom: 11 },
  'Agadir': { lat: 30.4278, lng: -9.5981, zoom: 11 },
  'Meknes': { lat: 33.8935, lng: -5.5473, zoom: 11 },
  'Oujda': { lat: 34.6867, lng: -1.9114, zoom: 11 },
  'Kenitra': { lat: 34.2610, lng: -6.5802, zoom: 11 },
  'Tetouan': { lat: 35.5889, lng: -5.3626, zoom: 11 },
  'Safi': { lat: 32.2994, lng: -9.2372, zoom: 11 },
  'El Jadida': { lat: 33.2316, lng: -8.5007, zoom: 11 },
  'Nador': { lat: 35.1681, lng: -2.9333, zoom: 11 },
  'Khouribga': { lat: 32.8811, lng: -6.9063, zoom: 11 },
  'Beni Mellal': { lat: 32.3373, lng: -6.3498, zoom: 11 },
  'Taza': { lat: 34.2133, lng: -4.0100, zoom: 11 },
  'Mohammedia': { lat: 33.6866, lng: -7.3833, zoom: 11 },
  'Ksar El Kebir': { lat: 35.0017, lng: -5.9008, zoom: 11 },
  'Larache': { lat: 35.1933, lng: -6.1561, zoom: 11 },
  'Guelmim': { lat: 28.9870, lng: -10.0574, zoom: 11 },
  'Berrechid': { lat: 33.2650, lng: -7.5833, zoom: 11 },
  'Khemisset': { lat: 33.8242, lng: -6.0661, zoom: 11 },
  'Errachidia': { lat: 31.9314, lng: -4.4244, zoom: 11 },
  'Ouarzazate': { lat: 30.9335, lng: -6.9370, zoom: 11 },
  'Essaouira': { lat: 31.5085, lng: -9.7595, zoom: 11 },
  
  // Regions
  'Souss-Massa': { lat: 30.4278, lng: -9.5981, zoom: 9 },
  'Marrakech-Safi': { lat: 31.6295, lng: -7.9811, zoom: 9 },
  'Casablanca-Settat': { lat: 33.5731, lng: -7.5898, zoom: 9 },
  'Rabat-Sale-Kenitra': { lat: 34.0209, lng: -6.8416, zoom: 9 },
  'Fes-Meknes': { lat: 34.0181, lng: -5.0078, zoom: 9 },
  'Tangier-Tetouan-Al Hoceima': { lat: 35.7595, lng: -5.8340, zoom: 9 },
  'Oriental': { lat: 34.6867, lng: -1.9114, zoom: 9 },
  'Draa-Tafilalet': { lat: 31.9314, lng: -4.4244, zoom: 9 },
  'Beni Mellal-Khenifra': { lat: 32.3373, lng: -6.3498, zoom: 9 },
  'Guelmim-Oued Noun': { lat: 28.9870, lng: -10.0574, zoom: 9 },
  'Laayoune-Sakia El Hamra': { lat: 27.1536, lng: -13.2033, zoom: 9 },
  'Dakhla-Oued Ed-Dahab': { lat: 23.7158, lng: -15.9582, zoom: 9 },
  
  // Strategic Locations
  'Strait of Gibraltar': { lat: 35.9667, lng: -5.6000, zoom: 10 },
  'Atlas Mountains': { lat: 31.0587, lng: -7.9213, zoom: 8 },
  'Sahara Desert': { lat: 27.0000, lng: -13.0000, zoom: 7 },
  'Mediterranean Coast': { lat: 35.5000, lng: -5.0000, zoom: 9 },
  'Atlantic Coast': { lat: 33.0000, lng: -8.5000, zoom: 8 },
  
  // Airports
  'Mohammed V Airport': { lat: 33.3675, lng: -7.5898, zoom: 13 },
  'Rabat-Sale Airport': { lat: 34.0515, lng: -6.7515, zoom: 13 },
  'Marrakech Menara Airport': { lat: 31.6069, lng: -8.0363, zoom: 13 },
  'Agadir Al Massira Airport': { lat: 30.3250, lng: -9.4131, zoom: 13 },
  'Fes-Saiss Airport': { lat: 33.9273, lng: -4.9780, zoom: 13 },
  'Tangier Ibn Battouta Airport': { lat: 35.7269, lng: -5.9169, zoom: 13 },
  
  // Ports
  'Port of Casablanca': { lat: 33.6000, lng: -7.6167, zoom: 13 },
  'Port of Tangier': { lat: 35.7833, lng: -5.8000, zoom: 13 },
  'Port of Agadir': { lat: 30.4167, lng: -9.6167, zoom: 13 },
  'Port of Mohammedia': { lat: 33.7000, lng: -7.3833, zoom: 13 },
  'Tanger-Med Port': { lat: 35.8833, lng: -5.4167, zoom: 13 },
};

/**
 * Get coordinates for a location name
 * Supports fuzzy matching (case-insensitive, partial matches)
 */
export function getCoordinatesForLocation(location: string): LocationCoordinates | null {
  if (!location) return null;
  
  const normalized = location.trim();
  
  // Exact match (case-insensitive)
  const exactMatch = Object.keys(MOROCCO_LOCATIONS).find(
    key => key.toLowerCase() === normalized.toLowerCase()
  );
  if (exactMatch) {
    return MOROCCO_LOCATIONS[exactMatch];
  }
  
  // Partial match (location contains the search term)
  const partialMatch = Object.keys(MOROCCO_LOCATIONS).find(
    key => key.toLowerCase().includes(normalized.toLowerCase()) ||
           normalized.toLowerCase().includes(key.toLowerCase())
  );
  if (partialMatch) {
    return MOROCCO_LOCATIONS[partialMatch];
  }
  
  // No match found
  console.warn(`⚠️ No coordinates found for location: "${location}"`);
  return null;
}

/**
 * Get all available location names
 */
export function getAllLocationNames(): string[] {
  return Object.keys(MOROCCO_LOCATIONS);
}

/**
 * Check if a location exists in the mapping
 */
export function hasLocation(location: string): boolean {
  return getCoordinatesForLocation(location) !== null;
}

/**
 * Get default Morocco view (centered on country)
 */
export function getDefaultMoroccoView(): LocationCoordinates {
  return {
    lat: 31.7917,
    lng: -7.0926,
    zoom: 6,
  };
}

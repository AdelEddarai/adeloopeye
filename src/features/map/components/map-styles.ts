import type { StyleSpecification } from 'maplibre-gl';

export const MAP_STYLE_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// NASA-level satellite style with 3D terrain and detailed roads
export const MAP_STYLE_SAT: StyleSpecification = {
  version: 8,
  sources: {
    // High-resolution satellite imagery
    esri: { 
      type: 'raster', 
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], 
      tileSize: 256, 
      maxzoom: 19, 
      attribution: '© Esri, Maxar' 
    },
    // 3D terrain elevation data (DEM tiles)
    'terrain-dem': {
      type: 'raster-dem',
      url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
      tileSize: 256,
      maxzoom: 14,
    },
    // OpenStreetMap vector tiles for roads
    'osm-roads': {
      type: 'vector',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.pbf'],
      minzoom: 0,
      maxzoom: 14,
      attribution: '© OpenStreetMap contributors',
    },
    // Dark overlay for contrast
    'dark-overlay-src': { 
      type: 'geojson', 
      data: { 
        type: 'Feature', 
        geometry: { 
          type: 'Polygon', 
          coordinates: [[[-180,-90],[180,-90],[180,90],[-180,90],[-180,-90]]] 
        }, 
        properties: {} 
      } 
    },
  },
  // Enable 3D terrain
  terrain: {
    source: 'terrain-dem',
    exaggeration: 1.5, // 1.5x elevation exaggeration for dramatic effect
  },
  layers: [
    // Base satellite imagery
    { 
      id: 'esri-satellite', 
      type: 'raster', 
      source: 'esri', 
      paint: { 
        'raster-brightness-max': 0.65, 
        'raster-saturation': -0.2 
      } 
    },
    // Hillshade for terrain depth perception
    {
      id: 'hillshade',
      type: 'hillshade',
      source: 'terrain-dem',
      paint: {
        'hillshade-exaggeration': 0.8,
        'hillshade-shadow-color': '#000000',
        'hillshade-highlight-color': '#ffffff',
        'hillshade-accent-color': '#5a5a5a',
        'hillshade-illumination-direction': 315, // Northwest light
      },
    },
    // Dark overlay for better contrast
    { 
      id: 'dark-overlay',   
      type: 'fill',   
      source: 'dark-overlay-src', 
      paint: { 
        'fill-color': '#000814', 
        'fill-opacity': 0.38 
      } 
    },
    // Morocco Motorways (Autoroutes A1, A2, A3, etc.)
    {
      id: 'morocco-motorways',
      type: 'line',
      source: 'osm-roads',
      'source-layer': 'transportation',
      filter: ['all',
        ['==', 'class', 'motorway'],
      ],
      paint: {
        'line-color': '#ff6b35', // Orange-red for highways
        'line-width': [
          'interpolate', ['exponential', 1.5], ['zoom'],
          5, 2,
          8, 4,
          12, 8,
          16, 16,
        ],
        'line-opacity': 0.9,
      },
      minzoom: 5,
    },
    // Morocco Motorway Links (ramps and interchanges)
    {
      id: 'morocco-motorway-links',
      type: 'line',
      source: 'osm-roads',
      'source-layer': 'transportation',
      filter: ['all',
        ['==', 'class', 'motorway'],
        ['==', 'ramp', 1],
      ],
      paint: {
        'line-color': '#ff8c5a',
        'line-width': [
          'interpolate', ['exponential', 1.5], ['zoom'],
          10, 1,
          14, 4,
          18, 8,
        ],
        'line-opacity': 0.8,
      },
      minzoom: 10,
    },
    // Expressways and Trunk Roads
    {
      id: 'morocco-expressways',
      type: 'line',
      source: 'osm-roads',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'trunk'],
      paint: {
        'line-color': '#ffd93d', // Yellow for expressways
        'line-width': [
          'interpolate', ['exponential', 1.5], ['zoom'],
          6, 1.5,
          10, 3,
          14, 6,
          18, 12,
        ],
        'line-opacity': 0.85,
      },
      minzoom: 6,
    },
    // National Roads (Primary)
    {
      id: 'morocco-national-roads',
      type: 'line',
      source: 'osm-roads',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'primary'],
      paint: {
        'line-color': '#ffb347', // Light orange
        'line-width': [
          'interpolate', ['exponential', 1.5], ['zoom'],
          7, 1,
          11, 2,
          15, 5,
          18, 10,
        ],
        'line-opacity': 0.8,
      },
      minzoom: 7,
    },
    // Regional Roads (Secondary)
    {
      id: 'morocco-regional-roads',
      type: 'line',
      source: 'osm-roads',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'secondary'],
      paint: {
        'line-color': '#ffe66d', // Pale yellow
        'line-width': [
          'interpolate', ['exponential', 1.5], ['zoom'],
          9, 0.5,
          12, 1.5,
          16, 4,
          18, 8,
        ],
        'line-opacity': 0.7,
      },
      minzoom: 9,
    },
    // Provincial Roads (Tertiary)
    {
      id: 'morocco-provincial-roads',
      type: 'line',
      source: 'osm-roads',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'tertiary'],
      paint: {
        'line-color': '#ffffff', // White
        'line-width': [
          'interpolate', ['exponential', 1.5], ['zoom'],
          11, 0.5,
          14, 1,
          17, 3,
          18, 6,
        ],
        'line-opacity': 0.6,
      },
      minzoom: 11,
    },
    // Road Labels (Highway numbers)
    {
      id: 'morocco-road-labels',
      type: 'symbol',
      source: 'osm-roads',
      'source-layer': 'transportation_name',
      filter: ['in', 'class', 'motorway', 'trunk', 'primary'],
      layout: {
        'text-field': ['get', 'ref'],
        'text-font': ['Noto Sans Bold'],
        'text-size': [
          'interpolate', ['linear'], ['zoom'],
          8, 9,
          12, 11,
          16, 14,
        ],
        'symbol-placement': 'line',
        'text-rotation-alignment': 'map',
        'text-pitch-alignment': 'viewport',
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 2,
        'text-halo-blur': 1,
      },
      minzoom: 8,
    },
  ],
};

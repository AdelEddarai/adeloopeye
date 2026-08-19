// Widget & layout types

export type WidgetKey =
  | 'latest' | 'signals' | 'map'
  | 'commanders' | 'predictions' | 'brief'
  | 'livenews' | 'liveflights' | 'livethreats' | 'livecrypto' | 'cyberthreats'
  | 'commodities' | 'aitech' | 'morocco' | 'moroccokpi'
  | 'markets' | 'moroccomap' | 'disinformation' | 'conflictnews';

export type Column = {
  id: string;
  widgets: WidgetKey[];
};

export const ALL_WIDGET_KEYS: WidgetKey[] = [
  'latest', 'signals', 'map',
  'commanders', 'predictions', 'brief',
  'livenews', 'liveflights', 'livethreats', 'livecrypto', 'cyberthreats',
  'commodities', 'aitech', 'morocco', 'moroccokpi',
  'markets', 'moroccomap', 'disinformation', 'conflictnews'
];

const HIDDEN_FROM_WIDGET_SELECT: WidgetKey[] = ['commanders', 'commodities'];

export const SELECTABLE_WIDGET_KEYS: WidgetKey[] = ALL_WIDGET_KEYS.filter(
  key => !HIDDEN_FROM_WIDGET_SELECT.includes(key),
);

export const WIDGET_LABELS: Record<WidgetKey, string> = {
  latest:      'Latest Events',
  signals:     'Field Signals',
  map:         'Intel Map',
  commanders:  'Commanders',
  predictions: 'Prediction Markets',
  brief:       'Daily Brief',
  livenews:    'Live News',
  liveflights: 'Live Flights',
  livethreats: 'Threat Intelligence',
  livecrypto:  'Crypto Markets',
  markets:     'Global & Morocco Markets',
  cyberthreats: 'Cyber Threats',
  commodities: 'Commodity Prices',
  aitech:      'AI & Tech News',
  morocco:     '🇲🇦 Morocco Intel',
  moroccokpi:  '🇲🇦 Morocco KPI Dashboard',
  moroccomap:  '🇲🇦 Morocco 3D Map',
  disinformation: 'Disinformation Radar',
  conflictnews: 'Conflict News + Timeline',
};

// Presets

export type PresetId = 'analyst' | 'commander' | 'executive' | 'live';

export type WorkspaceLayout = { columns: Column[] };

type PresetDefinition = {
  label: string;
  description: string;
  columns: Column[];
  columnSizes: Record<string, number>;
};

export const PRESETS: Record<PresetId, PresetDefinition> = {
  analyst: {
    label: 'DEFAULT',
    description: 'Intelligence map with conflict news and Morocco KPI dashboard',
    columns: [
      { id: 'col-a', widgets: ['map'] },
      { id: 'col-b', widgets: ['conflictnews', 'moroccokpi'] },
    ],
    columnSizes: { 'col-a': 50, 'col-b': 50 },
  },
  commander: {
    label: 'PRESET 2',
    description: 'Operational intelligence with conflict feeds and live data',
    columns: [
      { id: 'col-a', widgets: ['map'] },
      { id: 'col-b', widgets: ['conflictnews', 'liveflights'] },
      { id: 'col-c', widgets: ['livenews', 'cyberthreats'] },
    ],
    columnSizes: { 'col-a': 40, 'col-b': 30, 'col-c': 30 },
  },
  executive: {
    label: 'PRESET 3',
    description: 'Executive dashboard with conflict intelligence and live feeds',
    columns: [
      { id: 'col-a', widgets: ['brief', 'predictions'] },
      { id: 'col-b', widgets: ['conflictnews', 'livenews'] },
      { id: 'col-c', widgets: ['latest', 'disinformation'] },
    ],
    columnSizes: { 'col-a': 33.3, 'col-b': 33.3, 'col-c': 33.4 },
  },
  live: {
    label: 'LIVE DATA',
    description: 'Real-time streaming data from external APIs',
    columns: [
      { id: 'col-a', widgets: ['livenews', 'liveflights'] },
      { id: 'col-b', widgets: ['livethreats', 'cyberthreats'] },
      { id: 'col-c', widgets: ['markets', 'aitech'] },
    ],
    columnSizes: { 'col-a': 35, 'col-b': 35, 'col-c': 30 },
  },
};

// Widget & layout types

export type WidgetKey =
  | 'situation' | 'latest' | 'actors' | 'signals' | 'map'
  | 'keyfacts' | 'casualties' | 'commanders' | 'predictions' | 'brief'
  | 'livenews' | 'liveflights' | 'livethreats' | 'livecrypto' | 'cyberthreats'
  | 'commodities' | 'aitech' | 'morocco' | 'moroccokpi' | 'intelanalytics' | 'criticalnews'
  | 'markets' | 'moroccomap';

export type Column = {
  id: string;
  widgets: WidgetKey[];
};

export const ALL_WIDGET_KEYS: WidgetKey[] = [
  'situation', 'latest', 'actors', 'signals', 'map',
  'keyfacts', 'casualties', 'commanders', 'predictions', 'brief',
  'livenews', 'liveflights', 'livethreats', 'livecrypto', 'cyberthreats',
  'commodities', 'aitech', 'morocco', 'moroccokpi', 'intelanalytics', 'criticalnews',
  'markets', 'moroccomap'
];

const HIDDEN_FROM_WIDGET_SELECT: WidgetKey[] = ['commanders', 'commodities'];

export const SELECTABLE_WIDGET_KEYS: WidgetKey[] = ALL_WIDGET_KEYS.filter(
  key => !HIDDEN_FROM_WIDGET_SELECT.includes(key),
);

export const WIDGET_LABELS: Record<WidgetKey, string> = {
  situation:   'Situation Summary',
  latest:      'Latest Events',
  actors:      'Actor Positions',
  signals:     'Field Signals',
  map:         'Intel Map',
  keyfacts:    'Key Facts',
  casualties:  'Casualties',
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
  intelanalytics: 'Intelligence Analytics',
  criticalnews: 'Critical News Intel',
  moroccomap:  '🇲🇦 Morocco 3D Map',
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
    description: 'Live intelligence stream with data panels',
    columns: [
      { id: 'col-a', widgets: ['livenews', 'signals'] },
      { id: 'col-b', widgets: ['intelanalytics', 'criticalnews'] },
    ],
    columnSizes: { 'col-a': 50, 'col-b': 50 },
  },
  commander: {
    label: 'PRESET 2',
    description: 'Operational intelligence with analytics and critical news',
    columns: [
      { id: 'col-a', widgets: ['map'] },
      { id: 'col-b', widgets: ['intelanalytics', 'liveflights'] },
      { id: 'col-c', widgets: ['criticalnews', 'cyberthreats'] },
    ],
    columnSizes: { 'col-a': 40, 'col-b': 30, 'col-c': 30 },
  },
  executive: {
    label: 'PRESET 3',
    description: 'Executive dashboard with analytics and intelligence',
    columns: [
      { id: 'col-a', widgets: ['brief', 'predictions'] },
      { id: 'col-b', widgets: ['intelanalytics', 'criticalnews'] },
      { id: 'col-c', widgets: ['situation', 'keyfacts'] },
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

import { useQuery } from '@tanstack/react-query';

export type DisinfoArticle = {
  id: string;
  title: string;
  url: string;
  domain: string;
  date: string;
  countries: string[];
};

export type DisinfoEdge = {
  id: string;
  source: string;
  target: string;
  weight: number;
  kind: 'CAMPAIGN' | 'BOT_TRAFFIC';
  subKind?:
    | 'INFLUENCE_OP'
    | 'ATTRIBUTED_ATTACK'
    | 'CO_MENTION'
    | 'BOTNET'
    | 'C2'
    | 'SCANNING';
  sources: Array<{ title: string; url: string; domain: string }>;
  lastSeen: string;
};

export type DisinfoNode = {
  code: string;
  name: string;
  lat: number;
  lon: number;
  campaignVolume: number;
  botVolume: number;
};

export type DisinformationResponse = {
  focus: { code: string; name: string; lat: number; lon: number };
  edges: DisinfoEdge[];
  nodes: DisinfoNode[];
  articles: DisinfoArticle[];
  stats: {
    campaigns: number;
    botSources: number;
    botCountries: number;
    articleCount: number;
  };
  sources: Array<{ name: string; url: string }>;
  timestamp: string;
};

export function useLiveDisinformation(focus: string = 'MA', enabled: boolean = true) {
  const query = useQuery({
    queryKey: ['live-disinformation', focus],
    queryFn: async (): Promise<DisinformationResponse> => {
      const response = await fetch(`/api/v1/live/disinformation?focus=${focus}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) throw new Error('Failed to fetch disinformation intel');
      const json = await response.json();
      const data = json.ok ? json.data : json;
      return data;
    },
    enabled,
    staleTime: 0,
    refetchInterval: enabled ? 120_000 : false,
    refetchIntervalInBackground: enabled,
    refetchOnWindowFocus: enabled,
    retry: 2,
  });

  return {
    ...query,
    lastUpdate: query.data?.timestamp,
  };
}

const CAPABILITIES = [
  {
    title: 'Live Morocco Intelligence Map',
    description:
      'Real-time event tracking across 70+ Moroccan cities. World Monitor-inspired visualization with adaptive clustering, density heatmaps, and smart event positioning. Built with DeckGL and MapLibre.',
  },
  {
    title: 'Multi-Source News Aggregation',
    description:
      'RSS feeds from Moroccan sources (Hespress, Le360, MAP) + 3 news APIs (GNews, NewsData.io, NewsAPI) + Telegram channels. Automatic deduplication and 24h filtering for real-time monitoring.',
  },
  {
    title: 'Weather & Climate Monitoring',
    description:
      'Live weather data for 8 major cities via Open-Meteo API. Temperature, conditions, alerts. NASA FIRMS satellite fire detection for wildfire tracking across Morocco.',
  },
  {
    title: 'Traffic & Transport Intelligence',
    description:
      'Real-time traffic incidents, road closures, accidents, and congestion monitoring. Major routes status tracking with disruption alerts and alternative route suggestions.',
  },
  {
    title: 'Event Classification & Severity',
    description:
      '15 event types: Political, Diplomatic, Economic, Infrastructure, Weather, Fire, Protest, Accident, Investment, Trade, Tourism, Agriculture, Energy, Security, Transport. 4 severity levels with smart detection.',
  },
  {
    title: 'Intelligent Location Detection',
    description:
      'Priority-based city matching with 70+ locations. Context-aware extraction (in/near/at patterns). Exact coordinates for specific cities, smart spread for generic events. No stacking.',
  },
  {
    title: 'Morocco KPI Dashboard',
    description:
      'Live telemetry with event streams, Sankey flows, network graphs, timeline charts. Real-time sync with map. Event selection, location filtering, 24h/7d/30d views. Interactive correlation engine.',
  },
  {
    title: 'Infrastructure & Assets',
    description:
      'Ports (Tanger Med, Casablanca, Agadir), Airports (Mohammed V, Marrakech), Power plants (Noor Solar), Roads, Railways. Status monitoring: Operational, Disrupted, Closed, Under Construction.',
  },
] as const;

function CapabilityCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 border border-[var(--bd)] bg-[var(--bg-1)]">
      <h3 className="text-xs font-bold text-[var(--t1)] tracking-wide mb-2">
        {title}
      </h3>
      <p className="text-xs text-[var(--t2)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export function Capabilities() {
  return (
    <section className="px-5 py-12 max-w-3xl mx-auto">
      <h2 className="section-title mb-6">What you can track in Morocco</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CAPABILITIES.map((cap) => (
          <CapabilityCard
            key={cap.title}
            title={cap.title}
            description={cap.description}
          />
        ))}
      </div>
    </section>
  );
}

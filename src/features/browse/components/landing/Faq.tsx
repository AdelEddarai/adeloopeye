const FAQ_ITEMS = [
  {
    q: 'What is AdeloopEye?',
    a: 'AdeloopEye is a free, open-source OSINT intelligence platform for tracking real-time events across Morocco. Developed by Adeloop AI Lab, it combines an interactive map, AI-generated intelligence briefs, event tracking across 70+ cities, and multi-source aggregation into one comprehensive dashboard.',
  },
  {
    q: 'Is it free?',
    a: 'Yes. No paywall, no signup, no ads. The project is open source under AGPL-3.0.',
  },
  {
    q: 'Where does the data come from?',
    a: "AdeloopEye monitors multiple data sources including RSS feeds from Moroccan news outlets, news APIs, and Telegram channels. An AI agent pipeline processes incoming information, extracts structured events, and generates intelligence briefs. It's not just raw feeds, it's processed intelligence.",
  },
  {
    q: 'What types of events are tracked?',
    a: 'AdeloopEye tracks various event types across Morocco including news, weather conditions, traffic incidents, fires, and other significant events. Events are monitored in real-time with adaptive clustering and density heatmaps for visualization.',
  },
  {
    q: 'How often is it updated?',
    a: 'Events are logged as they happen with a 24-hour news window. Intelligence briefs and event data are updated continuously throughout the day as new information comes in from multiple sources.',
  },
  {
    q: 'Who built this?',
    a: 'AdeloopEye was built by Adeloop AI Lab as an open-source project. The goal was to create a comprehensive OSINT platform for Morocco that makes intelligence accessible to everyone.',
  },
  {
    q: 'What tech stack is it built with?',
    a: 'Next.js 16 with the App Router, TypeScript, DeckGL v9 and MapLibre for maps, Prisma 7 with Supabase (PostgreSQL), Redux Toolkit for state management, and deployed on Vercel.',
  },
] as const;

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-[var(--bd-s)] py-5">
      <h3 className="text-sm font-semibold text-[var(--t1)] mb-2">{q}</h3>
      <p className="text-xs text-[var(--t2)] leading-relaxed">{a}</p>
    </div>
  );
}

export function Faq() {
  return (
    <section className="px-5 py-12 max-w-3xl mx-auto">
      <h2 className="section-title mb-6">Frequently asked questions</h2>

      <div>
        {FAQ_ITEMS.map((item) => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </section>
  );
}

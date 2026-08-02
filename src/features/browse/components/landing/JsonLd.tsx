const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'AdeloopEye',
  alternateName: 'AdeloopEye',
  url: 'https://www.adeloopeye.com',
  description:
    'Free open-source OSINT platform tracking real-time events across Morocco. Interactive map, AI intelligence briefs, event tracking, and multi-source aggregation across 70+ Moroccan cities.',
  applicationCategory: 'NewsApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  license: 'https://www.gnu.org/licenses/agpl-3.0.html',
  featureList: [
    'Interactive event map',
    'AI intelligence briefs',
    'Real-time monitoring',
    'Multi-source aggregation',
    'Event clustering',
    'RSS monitor (multiple sources)',
    'Weather tracking',
    'Traffic monitoring',
  ],
  author: {
    '@type': 'Organization',
    name: 'Adeloop AI Lab',
  },
  sourceOrganization: {
    '@type': 'Organization',
    name: 'Adeloop AI Lab',
    url: 'https://www.adeloopeye.com',
  },
} as const;

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is AdeloopEye?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AdeloopEye is a free, open-source OSINT intelligence platform for tracking real-time events across Morocco. Developed by Adeloop AI Lab, it combines an interactive map, AI-generated intelligence briefs, event tracking across 70+ cities, and multi-source aggregation into one comprehensive dashboard.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is it free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. No paywall, no signup, no ads. The project is open source under AGPL-3.0.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where does the data come from?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "AdeloopEye monitors multiple data sources including RSS feeds from Moroccan news outlets, news APIs, and Telegram channels. An AI agent pipeline processes incoming information, extracts structured events, and generates intelligence briefs. It's not just raw feeds, it's processed intelligence.",
      },
    },
    {
      '@type': 'Question',
      name: 'What types of events are tracked?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AdeloopEye tracks various event types across Morocco including news, weather conditions, traffic incidents, fires, and other significant events. Events are monitored in real-time with adaptive clustering and density heatmaps for visualization.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often is it updated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Events are logged as they happen with a 24-hour news window. Intelligence briefs and event data are updated continuously throughout the day as new information comes in.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who built this?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AdeloopEye was built by Adeloop AI Lab as an open-source project. The goal was to create a comprehensive OSINT platform for Morocco that makes intelligence accessible to everyone.',
      },
    },
  ],
} as const;

export function JsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
    </>
  );
}

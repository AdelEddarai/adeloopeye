'use client';

import { RadioTower, FileText, Bot, Globe } from 'lucide-react';

type Props = {
  stats: {
    campaigns: number;
    botSources: number;
    botCountries: number;
    articleCount: number;
  };
};

export function DisinformationStats({ stats }: Props) {
  const items = [
    {
      label: 'REPORTED CAMPAIGNS',
      value: stats.campaigns,
      color: 'var(--warning)',
      icon: <RadioTower size={14} />,
    },
    {
      label: 'BOT SOURCES',
      value: stats.botSources,
      color: 'var(--info)',
      icon: <Bot size={14} />,
    },
    {
      label: 'BOT COUNTRIES',
      value: stats.botCountries,
      color: 'var(--blue)',
      icon: <Globe size={14} />,
    },
    {
      label: 'INTEL ARTICLES',
      value: stats.articleCount,
      color: 'var(--t3)',
      icon: <FileText size={14} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-4 py-3 border-b border-[var(--bd)] bg-[var(--bg-2)]">
      {items.map(item => (
        <div
          key={item.label}
          className="flex items-center gap-2.5 px-3 py-2 bg-[var(--bg-1)] border border-[var(--bd)] rounded-sm"
        >
          <span style={{ color: item.color }}>{item.icon}</span>
          <div className="min-w-0">
            <div
              className="mono text-[length:var(--text-micro)] text-[var(--t4)] leading-tight"
              style={{ whiteSpace: 'nowrap' }}
            >
              {item.label}
            </div>
            <div className="mono text-lg font-bold leading-none mt-0.5" style={{ color: item.color }}>
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

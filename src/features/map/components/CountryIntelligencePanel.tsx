'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, Users, Building2, ExternalLink } from 'lucide-react';
import { api } from '@/shared/lib/query/client';

type Props = {
  countryCode: string;
  countryName: string;
};

export function CountryIntelligencePanel({ countryCode, countryName }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['country-intelligence', countryCode],
    queryFn: () => api.get(`/live/country-intelligence?code=${countryCode}`),
    staleTime: 3600000, // 1 hour
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-[var(--t4)] text-xs mono">Loading intelligence...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <span className="text-[var(--t4)] text-xs mono">No data available</span>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    return value.toLocaleString();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Country Header */}
      <div>
        <h3 className="text-[var(--t1)] font-bold text-sm mono mb-1">{data.country.name}</h3>
        <div className="flex items-center gap-2 text-[10px] text-[var(--t4)]">
          {data.country.capital && <span>Capital: {data.country.capital}</span>}
          {data.country.region && (
            <>
              <span>•</span>
              <span>{data.country.region}</span>
            </>
          )}
        </div>
      </div>

      {/* Economic Indicators */}
      <div className="grid grid-cols-2 gap-2">
        {/* GDP */}
        {data.economy.gdp?.value && (
          <div className="bg-[var(--bg-1)] border border-[var(--bd)] p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-[var(--blue)]" />
              <span className="text-[9px] text-[var(--t4)] mono">GDP</span>
            </div>
            <div className="text-[var(--t1)] font-bold text-sm mono">
              {formatCurrency(data.economy.gdp.value)}
            </div>
            <div className="text-[8px] text-[var(--t4)] mono">{data.economy.gdp.year}</div>
          </div>
        )}

        {/* GDP Growth */}
        {data.economy.gdpGrowth?.value !== null && data.economy.gdpGrowth?.value !== undefined && (
          <div className="bg-[var(--bg-1)] border border-[var(--bd)] p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              {data.economy.gdpGrowth.value >= 0 ? (
                <TrendingUp className="w-3 h-3 text-[var(--success)]" />
              ) : (
                <TrendingDown className="w-3 h-3 text-[var(--danger)]" />
              )}
              <span className="text-[9px] text-[var(--t4)] mono">GROWTH</span>
            </div>
            <div 
              className="font-bold text-sm mono"
              style={{ 
                color: data.economy.gdpGrowth.value >= 0 ? 'var(--success)' : 'var(--danger)' 
              }}
            >
              {data.economy.gdpGrowth.value.toFixed(1)}%
            </div>
            <div className="text-[8px] text-[var(--t4)] mono">{data.economy.gdpGrowth.year}</div>
          </div>
        )}

        {/* Population */}
        {data.country.population && (
          <div className="bg-[var(--bg-1)] border border-[var(--bd)] p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Users className="w-3 h-3 text-[var(--info)]" />
              <span className="text-[9px] text-[var(--t4)] mono">POPULATION</span>
            </div>
            <div className="text-[var(--t1)] font-bold text-sm mono">
              {formatNumber(data.country.population)}
            </div>
          </div>
        )}

        {/* Unemployment */}
        {data.economy.unemployment?.value !== null && data.economy.unemployment?.value !== undefined && (
          <div className="bg-[var(--bg-1)] border border-[var(--bd)] p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Building2 className="w-3 h-3 text-[var(--warning)]" />
              <span className="text-[9px] text-[var(--t4)] mono">UNEMPLOYMENT</span>
            </div>
            <div className="text-[var(--t1)] font-bold text-sm mono">
              {data.economy.unemployment.value.toFixed(1)}%
            </div>
            <div className="text-[8px] text-[var(--t4)] mono">{data.economy.unemployment.year}</div>
          </div>
        )}
      </div>

      {/* Trade Balance */}
      {data.economy.tradeBalance !== undefined && data.economy.tradeBalance !== null && (
        <div className="bg-[var(--bg-2)] border border-[var(--bd)] p-3 rounded">
          <div className="text-[9px] text-[var(--t4)] mono mb-1">TRADE BALANCE</div>
          <div 
            className="font-bold text-lg mono"
            style={{ 
              color: data.economy.tradeBalance >= 0 ? 'var(--success)' : 'var(--danger)' 
            }}
          >
            {formatCurrency(Math.abs(data.economy.tradeBalance))}
          </div>
          <div className="text-[10px] text-[var(--t3)] mt-1">
            {data.economy.tradeBalance >= 0 ? 'Surplus' : 'Deficit'}
          </div>
        </div>
      )}

      {/* Recent News */}
      {data.news?.recent && data.news.recent.length > 0 && (
        <div>
          <div className="text-[9px] text-[var(--t4)] mono mb-2">RECENT NEWS ({data.news.total})</div>
          <div className="space-y-2">
            {data.news.recent.slice(0, 3).map((article: any, i: number) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 bg-[var(--bg-1)] border border-[var(--bd)] rounded hover:border-[var(--blue)] transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-[var(--t2)] group-hover:text-[var(--blue)] line-clamp-2 leading-snug mb-1">
                      {article.title}
                    </div>
                    <div className="text-[8px] text-[var(--t4)] mono">{article.source}</div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-[var(--t4)] shrink-0 mt-0.5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

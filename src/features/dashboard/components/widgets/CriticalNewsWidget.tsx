'use client';

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ExternalLink, Loader2, MapPin, RefreshCw, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { api } from '@/shared/lib/query/client';

type CityResult = {
  name: string;
  country: string;
  lat: number;
  lon: number;
  state?: string;
};

type CriticalNews = {
  article: {
    title: string;
    description: string;
    url: string;
    source: string;
    publishedAt: string;
  };
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  category: 'ATTACK' | 'CONFLICT' | 'DISASTER' | 'POLITICAL' | 'SECURITY';
  location?: { lat: number; lon: number };
  keywords: string[];
};

export function CriticalNewsWidget() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);

  // Search for cities
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['city-search', searchQuery],
    queryFn: () => api.get<CityResult[]>(`/live/city-search?q=${encodeURIComponent(searchQuery)}`),
    enabled: searchQuery.length >= 2,
    staleTime: 300000,
  });

  // Fetch critical news
  const { data: criticalNews, isLoading: newsLoading, refetch, isFetching } = useQuery({
    queryKey: ['city-critical-news', selectedCity?.name],
    queryFn: () => api.get<CriticalNews[]>(`/live/city-critical-news?city=${selectedCity?.name}&lat=${selectedCity?.lat}&lon=${selectedCity?.lon}`),
    enabled: !!selectedCity,
    staleTime: 180000,
  });

  // Calculate statistics
  const stats = criticalNews ? {
    total: criticalNews.length,
    critical: criticalNews.filter(n => n.severity === 'CRITICAL').length,
    high: criticalNews.filter(n => n.severity === 'HIGH').length,
    byCategory: criticalNews.reduce((acc, n) => {
      acc[n.category] = (acc[n.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  } : null;

  return (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="shrink-0 p-3 bg-[var(--bg-2)] border-b border-[var(--bd)]">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-[var(--blue)]" />
          <span className="mono text-[10px] text-[var(--t4)] tracking-wider">
            GLOBAL INTELLIGENCE SEARCH
          </span>
        </div>
        
        <div className="relative">
          <Input
            type="text"
            placeholder="Search any city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--t4)] hover:text-[var(--t2)]"
            >
              ×
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchQuery.length >= 2 && (
          <div className="absolute z-50 mt-1 left-3 right-3 bg-[var(--bg-1)] border border-[var(--bd)] rounded shadow-lg max-h-[200px] overflow-y-auto">
            {searchLoading ? (
              <div className="px-3 py-3 text-[var(--t4)] text-xs text-center">Searching...</div>
            ) : searchResults && searchResults.length > 0 ? (
              searchResults.map((city, idx) => (
                <button
                  key={`${city.name}-${city.country}-${idx}`}
                  onClick={() => {
                    setSelectedCity(city);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--bg-2)] transition-colors border-b border-[var(--bd-s)] last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-[var(--blue)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[var(--t2)] text-xs font-semibold truncate">
                        {city.name}{city.state && `, ${city.state}`}
                      </div>
                      <div className="text-[var(--t4)] text-[10px] truncate">{city.country}</div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-[var(--t4)] text-xs text-center">No cities found</div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {selectedCity ? (
        <div className="flex-1 overflow-y-auto">
          {/* City Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-3 bg-[var(--bg-1)] border-b border-[var(--bd)]">
            <div className="flex-1 min-w-0">
              <h3 className="text-[var(--t1)] font-bold text-sm mono truncate">{selectedCity.name}</h3>
              <p className="text-[var(--t4)] text-xs truncate">
                {selectedCity.state && `${selectedCity.state}, `}
                {selectedCity.country}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedCity(null)}
              >
                ×
              </Button>
            </div>
          </div>

          {newsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 size={24} className="animate-spin text-[var(--t4)]" />
            </div>
          ) : stats && criticalNews ? (
            <>
              {/* Statistics */}
              <div className="p-3 border-b border-[var(--bd)] bg-[var(--bg-2)]">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <div className="mono text-xl font-bold text-[var(--blue)] leading-none">{stats.total}</div>
                    <div className="mono text-[9px] text-[var(--t4)] mt-0.5">TOTAL</div>
                  </div>
                  <div className="text-center">
                    <div className="mono text-xl font-bold text-[var(--danger)] leading-none">{stats.critical}</div>
                    <div className="mono text-[9px] text-[var(--t4)] mt-0.5">CRITICAL</div>
                  </div>
                  <div className="text-center">
                    <div className="mono text-xl font-bold text-[var(--warning)] leading-none">{stats.high}</div>
                    <div className="mono text-[9px] text-[var(--t4)] mt-0.5">HIGH</div>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="space-y-1">
                  {Object.entries(stats.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, count]) => {
                      const percent = (count / stats.total) * 100;
                      const color = getCategoryColor(category);
                      return (
                        <div key={category} className="flex items-center gap-2">
                          <span className="mono text-[9px] text-[var(--t4)] w-16">{category}</span>
                          <div className="flex-1 h-1.5 bg-[var(--bg-3)] rounded-sm overflow-hidden">
                            <div 
                              className="h-full rounded-sm transition-all" 
                              style={{ width: `${percent}%`, background: color }} 
                            />
                          </div>
                          <span className="mono text-[9px] font-bold w-6 text-right" style={{ color }}>
                            {count}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* News List */}
              <div className="p-2.5 space-y-2">
                {criticalNews.map((news, i) => (
                  <a
                    key={i}
                    href={news.article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-[var(--bg-1)] border border-[var(--bd)] rounded p-2.5 hover:border-[var(--blue)] transition-colors"
                  >
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span 
                        className="text-[9px] font-bold mono px-1.5 py-0.5 rounded"
                        style={{
                          background: getSeverityColor(news.severity) + '20',
                          color: getSeverityColor(news.severity),
                        }}
                      >
                        {news.severity}
                      </span>
                      <span 
                        className="text-[9px] font-bold mono px-1.5 py-0.5 rounded"
                        style={{
                          background: getCategoryColor(news.category) + '20',
                          color: getCategoryColor(news.category),
                        }}
                      >
                        {news.category}
                      </span>
                      {news.location && (
                        <MapPin className="w-3 h-3 text-[var(--blue)] ml-auto" />
                      )}
                    </div>

                    {/* Title */}
                    <h5 className="text-[var(--t2)] text-xs font-semibold mb-1 line-clamp-2 leading-snug">
                      {news.article.title}
                    </h5>

                    {/* Keywords */}
                    {news.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {news.keywords.slice(0, 3).map((keyword, idx) => (
                          <span 
                            key={idx}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-2)] text-[var(--t4)] mono"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-2 text-[9px] text-[var(--t4)]">
                      <span className="mono">{news.article.source}</span>
                      <span>•</span>
                      <span>{new Date(news.article.publishedAt).toLocaleDateString()}</span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </div>
                  </a>
                ))}
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-[var(--t4)] text-xs">
              No critical intelligence for this location
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-[var(--t4)] mx-auto mb-3" />
            <p className="text-[var(--t3)] text-sm mb-1 font-semibold">Global Intelligence Search</p>
            <p className="text-[var(--t4)] text-xs leading-relaxed">
              Search any city worldwide to analyze<br />
              critical news and security intelligence
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    'CRITICAL': '#ef4444',
    'HIGH': '#f97316',
    'MEDIUM': '#f59e0b',
  };
  return colors[severity] || '#6b7280';
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'ATTACK': '#dc2626',
    'CONFLICT': '#ea580c',
    'DISASTER': '#d97706',
    'POLITICAL': '#2563eb',
    'SECURITY': '#7c3aed',
  };
  return colors[category] || '#6b7280';
}

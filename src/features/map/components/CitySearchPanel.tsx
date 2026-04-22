'use client';

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronDown, ChevronUp, MapPin, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import { WeatherPopup } from '@/features/map/components/WeatherPopup';

import { api } from '@/shared/lib/query/client';

import type { NewsArticle } from '@/server/lib/api-clients/newsapi-client';

type CityResult = {
  name: string;
  country: string;
  lat: number;
  lon: number;
  state?: string;
  countryCode?: string;
};

type CriticalNews = {
  article: NewsArticle;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  category: 'ATTACK' | 'CONFLICT' | 'DISASTER' | 'POLITICAL' | 'SECURITY';
  location?: { lat: number; lon: number };
  keywords: string[];
};

type Props = {
  onCitySelect?: (city: CityResult) => void;
  onNewsClick?: (news: CriticalNews) => void;
  selectedCountry?: { name: string; code: string } | null;
};

export function CitySearchPanel({ onCitySelect, onNewsClick }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [weatherExpanded, setWeatherExpanded] = useState(false);

  // Search for cities using geocoding API
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['city-search', searchQuery],
    queryFn: () => api.get<CityResult[]>(`/live/city-search?q=${encodeURIComponent(searchQuery)}`),
    enabled: searchQuery.length >= 2,
    staleTime: 300000,
  });

  // Fetch critical news for selected city
  const { data: criticalNews, isLoading: newsLoading } = useQuery({
    queryKey: ['city-critical-news', selectedCity?.name],
    queryFn: () => api.get<CriticalNews[]>(`/live/city-critical-news?city=${selectedCity?.name}&lat=${selectedCity?.lat}&lon=${selectedCity?.lon}`),
    enabled: !!selectedCity,
    staleTime: 180000, // 3 minutes
  });

  const handleCityClick = (city: CityResult) => {
    setSelectedCity(city);
    setSearchQuery('');
    setWeatherExpanded(false);
    onCitySelect?.(city);
  };

  const handleClear = () => {
    setSelectedCity(null);
    setSearchQuery('');
    setWeatherExpanded(false);
  };

  const handleNewsClick = (news: CriticalNews) => {
    onNewsClick?.(news);
  };

  return (
    <Card className="border-[var(--bd)]">
      <CardContent className="p-0">
        {/* Search Header */}
        <div className="p-3 bg-muted/30 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-primary" />
            <span className="text-primary font-bold text-xs tracking-wide">CITY INTELLIGENCE</span>
          </div>
          
          <div className="relative">
            <Input
              type="text"
              placeholder="Search any city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-8 h-8 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchQuery.length >= 2 && (
            <Card className="absolute z-50 mt-1 w-[calc(100%-24px)] max-h-[200px] overflow-y-auto border-[var(--bd)]">
              <CardContent className="p-0">
                {searchLoading ? (
                  <div className="px-3 py-3 text-muted-foreground text-xs text-center">Searching...</div>
                ) : searchResults && searchResults.length > 0 ? (
                  searchResults.map((city, idx) => (
                    <button
                      key={`${city.name}-${city.country}-${idx}`}
                      onClick={() => handleCityClick(city)}
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors border-b last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-foreground text-xs font-semibold truncate">
                            {city.name}{city.state && `, ${city.state}`}
                          </div>
                          <div className="text-muted-foreground text-[10px] truncate">{city.country}</div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-3 text-muted-foreground text-xs text-center">
                    No cities found
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Selected City Content */}
        {selectedCity ? (
          <div className="max-h-[500px] overflow-y-auto">
            {/* City Header */}
            <div className="flex items-center justify-between p-3 bg-muted/20 border-b">
              <div className="flex-1 min-w-0">
                <h3 className="text-foreground font-bold text-sm tracking-wide truncate">{selectedCity.name}</h3>
                <p className="text-muted-foreground text-xs truncate">
                  {selectedCity.state && `${selectedCity.state}, `}
                  {selectedCity.country}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-6 w-6 p-0">
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Weather Dropdown */}
            <div className="border-b">
              <button
                onClick={() => setWeatherExpanded(!weatherExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
              >
                <span className="text-foreground font-bold text-xs tracking-wide">WEATHER FORECAST</span>
                {weatherExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {weatherExpanded && (
                <div className="px-3 pb-3">
                  <WeatherPopup
                    cityName={selectedCity.name}
                    lat={selectedCity.lat}
                    lon={selectedCity.lon}
                  />
                </div>
              )}
            </div>

            {/* Critical News */}
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h4 className="text-foreground font-bold text-xs tracking-wide">
                  CRITICAL INTELLIGENCE ({criticalNews?.length || 0})
                </h4>
              </div>
              
              {newsLoading ? (
                <div className="text-muted-foreground text-xs">Analyzing intelligence...</div>
              ) : criticalNews && criticalNews.length > 0 ? (
                <div className="space-y-2">
                  {criticalNews.map((news, i) => (
                    <Card
                      key={i}
                      className="cursor-pointer hover:border-primary transition-colors border-[var(--bd)]"
                      onClick={() => handleNewsClick(news)}
                    >
                      <CardContent className="p-2">
                        {/* Severity Badge */}
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary"
                            className="text-[9px] font-bold"
                            style={{
                              background: getSeverityColor(news.severity) + '20',
                              color: getSeverityColor(news.severity),
                            }}
                          >
                            {news.severity}
                          </Badge>
                          <Badge 
                            variant="secondary"
                            className="text-[9px] font-bold"
                            style={{
                              background: getCategoryColor(news.category) + '20',
                              color: getCategoryColor(news.category),
                            }}
                          >
                            {news.category}
                          </Badge>
                        </div>

                        {/* Title */}
                        <h5 className="text-foreground text-xs font-semibold mb-1 line-clamp-2">
                          {news.article.title}
                        </h5>

                        {/* Keywords */}
                        {news.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {news.keywords.slice(0, 3).map((keyword, idx) => (
                              <Badge 
                                key={idx}
                                variant="outline"
                                className="text-[9px] px-1.5 py-0"
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="font-mono">{news.article.source}</span>
                          <span>•</span>
                          <span>{new Date(news.article.publishedAt).toLocaleDateString()}</span>
                          {news.location && (
                            <>
                              <span>•</span>
                              <MapPin className="w-3 h-3 inline" />
                              <span className="text-primary">Click to view on map</span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-xs">No critical intelligence for this location</div>
              )}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <Search className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-foreground text-xs mb-1">Search for any city</p>
              <p className="text-muted-foreground text-[10px]">
                Get weather and critical intelligence
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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

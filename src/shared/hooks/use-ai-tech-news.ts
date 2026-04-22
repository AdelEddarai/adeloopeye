'use client';

import { useQuery } from '@tanstack/react-query';

export type AITechCategory = 'LLM' | 'AI_AGENT' | 'AI_MODEL' | 'BENCHMARK' | 'FRAMEWORK' | 'RESEARCH' | 'COMPANY';

export type AITechArticle = {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  category: AITechCategory;
  tags: string[];
};

type AITechNewsResponse = {
  articles: AITechArticle[];
  timestamp: string;
};

async function fetchAITechNews(): Promise<AITechNewsResponse> {
  const res = await fetch('/api/v1/live/ai-tech');
  if (!res.ok) throw new Error('Failed to fetch AI tech news');
  return res.json();
}

export function useAITechNews() {
  return useQuery({
    queryKey: ['ai-tech-news'],
    queryFn: fetchAITechNews,
    refetchInterval: 120000, // Refresh every 2 minutes
    staleTime: 60000,
  });
}

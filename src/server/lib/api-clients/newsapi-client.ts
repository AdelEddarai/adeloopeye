/**
 * NewsAPI.org Client
 * Free news API - 100 requests/day on free tier
 * https://newsapi.org/
 */

export class NewsAPIClient {
  private apiKey: string;
  private baseUrl = 'https://newsapi.org/v2';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEWSAPI_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  NEWSAPI_KEY not configured - using fallback');
    }
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('NewsAPI key not configured');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, val]) => url.searchParams.set(key, val));
    url.searchParams.set('apiKey', this.apiKey);

    try {
      const res = await fetch(url.toString(), {
        next: { revalidate: 60 }, // Cache for 60s
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!res.ok) {
        throw new Error(`NewsAPI error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      
      if (json.status === 'error') {
        throw new Error(json.message || 'NewsAPI error');
      }

      return json as T;
    } catch (error) {
      console.error('NewsAPI request failed:', error);
      throw error;
    }
  }

  /**
   * Search for news articles
   */
  async searchNews(query: string, pageSize: number = 20, language: string = 'en') {
    const response = await this.request<NewsAPIResponse>('/everything', {
      q: query,
      pageSize: String(Math.min(pageSize, 100)),
      language,
      sortBy: 'publishedAt',
    });

    return response.articles.map(article => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      source: article.source.name,
      publishedAt: article.publishedAt,
      author: article.author,
      imageUrl: article.urlToImage,
      content: article.content,
    }));
  }

  /**
   * Get top headlines
   */
  async getTopHeadlines(country: string = 'us', pageSize: number = 20) {
    const response = await this.request<NewsAPIResponse>('/top-headlines', {
      country,
      pageSize: String(Math.min(pageSize, 100)),
    });

    return response.articles.map(article => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      source: article.source.name,
      publishedAt: article.publishedAt,
      author: article.author,
      imageUrl: article.urlToImage,
      content: article.content,
    }));
  }
}

type NewsAPIResponse = {
  status: string;
  totalResults: number;
  articles: Array<{
    source: { id: string | null; name: string };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
  }>;
  message?: string;
};

export type NewsArticle = {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  author: string | null;
  imageUrl: string | null;
  content: string | null;
};

// Singleton instance
export const newsAPIClient = new NewsAPIClient();

/**
 * Multi-Source News Client
 * Aggregates news from multiple free APIs with fallback support
 * 
 * Supported sources:
 * 1. GNews API - 15,000 requests/month (free tier)
 * 2. NewsData.io - 200 requests/day (free tier)
 * 3. NewsAPI.org - 100 requests/day (free tier) - fallback
 */

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

class MultiNewsClient {
  private gnewsKey: string;
  private newsdataKey: string;
  private newsapiKey: string;

  constructor() {
    this.gnewsKey = process.env.GNEWS_API_KEY || '';
    this.newsdataKey = process.env.NEWSDATA_API_KEY || '';
    this.newsapiKey = process.env.NEWSAPI_KEY || '';
  }

  /**
   * Fetch news with automatic fallback between sources
   */
  async searchNews(query: string, limit: number = 20, language: string = 'en'): Promise<NewsArticle[]> {
    // Try GNews first (best rate limits)
    if (this.gnewsKey) {
      try {
        return await this.fetchFromGNews(query, limit, language);
      } catch (error) {
        console.warn('GNews failed, trying NewsData:', error);
      }
    }

    // Try NewsData.io second
    if (this.newsdataKey) {
      try {
        return await this.fetchFromNewsData(query, limit, language);
      } catch (error) {
        console.warn('NewsData failed, trying NewsAPI:', error);
      }
    }

    // Try NewsAPI as last resort
    if (this.newsapiKey) {
      try {
        return await this.fetchFromNewsAPI(query, limit, language);
      } catch (error) {
        console.error('All news sources failed:', error);
        throw new Error('All news sources unavailable');
      }
    }

    throw new Error('No news API keys configured');
  }

  /**
   * GNews API - 15,000 requests/month free
   * https://gnews.io/
   */
  private async fetchFromGNews(query: string, limit: number, language: string): Promise<NewsArticle[]> {
    const url = new URL('https://gnews.io/api/v4/search');
    url.searchParams.set('q', query);
    url.searchParams.set('lang', language);
    url.searchParams.set('max', String(Math.min(limit, 100)));
    url.searchParams.set('apikey', this.gnewsKey);

    const res = await fetch(url.toString(), {
      next: { revalidate: 300 }, // Cache for 5 minutes
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`GNews error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    
    return json.articles.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      source: article.source.name,
      publishedAt: article.publishedAt,
      author: null,
      imageUrl: article.image || null,
      content: article.content || null,
    }));
  }

  /**
   * NewsData.io API - 200 requests/day free
   * https://newsdata.io/
   */
  private async fetchFromNewsData(query: string, limit: number, language: string): Promise<NewsArticle[]> {
    const url = new URL('https://newsdata.io/api/1/news');
    url.searchParams.set('q', query);
    url.searchParams.set('language', language);
    url.searchParams.set('size', String(Math.min(limit, 50)));
    url.searchParams.set('apikey', this.newsdataKey);

    const res = await fetch(url.toString(), {
      next: { revalidate: 300 }, // Cache for 5 minutes
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`NewsData error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    
    if (json.status !== 'success') {
      throw new Error(json.message || 'NewsData error');
    }

    return json.results.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      url: article.link,
      source: article.source_id,
      publishedAt: article.pubDate,
      author: article.creator?.[0] || null,
      imageUrl: article.image_url || null,
      content: article.content || null,
    }));
  }

  /**
   * NewsAPI.org - 100 requests/day free (fallback)
   * https://newsapi.org/
   */
  private async fetchFromNewsAPI(query: string, limit: number, language: string): Promise<NewsArticle[]> {
    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', query);
    url.searchParams.set('pageSize', String(Math.min(limit, 100)));
    url.searchParams.set('language', language);
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('apiKey', this.newsapiKey);

    const res = await fetch(url.toString(), {
      next: { revalidate: 300 }, // Cache for 5 minutes
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`NewsAPI error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    
    if (json.status === 'error') {
      throw new Error(json.message || 'NewsAPI error');
    }

    return json.articles.map((article: any) => ({
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
   * Get top headlines (uses GNews or NewsData)
   */
  async getTopHeadlines(country: string = 'us', limit: number = 20): Promise<NewsArticle[]> {
    // GNews doesn't have country-specific headlines, use general search
    if (this.gnewsKey) {
      try {
        const url = new URL('https://gnews.io/api/v4/top-headlines');
        url.searchParams.set('country', country);
        url.searchParams.set('max', String(Math.min(limit, 100)));
        url.searchParams.set('apikey', this.gnewsKey);

        const res = await fetch(url.toString(), {
          next: { revalidate: 300 },
          signal: AbortSignal.timeout(10000),
        });

        if (res.ok) {
          const json = await res.json();
          return json.articles.map((article: any) => ({
            title: article.title,
            description: article.description || '',
            url: article.url,
            source: article.source.name,
            publishedAt: article.publishedAt,
            author: null,
            imageUrl: article.image || null,
            content: article.content || null,
          }));
        }
      } catch (error) {
        console.warn('GNews headlines failed:', error);
      }
    }

    // Fallback to search with generic query
    return this.searchNews('breaking news', limit, 'en');
  }
}

// Singleton instance
export const multiNewsClient = new MultiNewsClient();

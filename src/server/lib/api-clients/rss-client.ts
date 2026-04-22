/**
 * RSS Feed Client
 * Fetches news from RSS feeds (Moroccan and international sources)
 */

export type RSSArticle = {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  image?: string;
  source: string;
  category?: string;
};

/**
 * Parse RSS/Atom feed XML
 */
function parseRSSFeed(xml: string, sourceName: string): RSSArticle[] {
  const articles: RSSArticle[] = [];
  
  try {
    // Extract items/entries
    const itemRegex = /<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/gi;
    const items = xml.match(itemRegex) || [];
    
    items.forEach(item => {
      try {
        // Extract title
        const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';
        
        // Extract description/content
        const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>|<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i);
        let description = descMatch ? descMatch[1].trim() : '';
        
        // Clean HTML tags from description
        description = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Extract link
        const linkMatch = item.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>|<link[^>]*href=["'](.*?)["']/i);
        const url = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : '';
        
        // Extract published date
        const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>|<published>(.*?)<\/published>|<updated>(.*?)<\/updated>/i);
        const publishedAt = dateMatch ? (dateMatch[1] || dateMatch[2] || dateMatch[3] || new Date().toISOString()) : new Date().toISOString();
        
        // Extract image
        const imageMatch = item.match(/<media:content[^>]*url=["'](.*?)["']|<enclosure[^>]*url=["'](.*?)["']|<media:thumbnail[^>]*url=["'](.*?)["']/i);
        const image = imageMatch ? (imageMatch[1] || imageMatch[2] || imageMatch[3] || undefined) : undefined;
        
        // Extract category
        const categoryMatch = item.match(/<category>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/category>/i);
        const category = categoryMatch ? categoryMatch[1].trim() : undefined;
        
        if (title && url) {
          articles.push({
            title,
            description: description.substring(0, 500), // Limit description length
            url,
            publishedAt,
            image,
            source: sourceName,
            category,
          });
        }
      } catch (err) {
        console.error(`[RSS] Error parsing item:`, err);
      }
    });
  } catch (err) {
    console.error(`[RSS] Error parsing feed:`, err);
  }
  
  return articles;
}

/**
 * Fetch and parse RSS feed
 */
async function fetchRSSFeed(url: string, sourceName: string, timeoutMs: number = 15000): Promise<RSSArticle[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
      },
      signal: AbortSignal.timeout(timeoutMs), // Configurable timeout (default 15s)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const xml = await response.text();
    return parseRSSFeed(xml, sourceName);
  } catch (err: any) {
    // Only log non-timeout errors
    if (!err.message?.includes('timeout') && !err.message?.includes('aborted')) {
      console.error(`[RSS] Failed to fetch ${sourceName}:`, err.message);
    }
    return [];
  }
}

/**
 * Moroccan RSS Feeds - Comprehensive list
 */
const MOROCCO_RSS_FEEDS = [
  // Major News Sources
  {
    url: 'https://lematin.ma/rss',
    name: 'Le Matin (General)',
    language: 'fr',
  },
  {
    url: 'https://lematin.ma/rss/economie',
    name: 'Le Matin (Economy)',
    language: 'fr',
  },
  {
    url: 'https://lematin.ma/rss/politique',
    name: 'Le Matin (Politics)',
    language: 'fr',
  },
  {
    url: 'https://lematin.ma/rss/societe',
    name: 'Le Matin (Society)',
    language: 'fr',
  },
  {
    url: 'https://www.moroccoworldnews.com/feed/',
    name: 'Morocco World News',
    language: 'en',
  },
  {
    url: 'https://www.mapnews.ma/en/rss',
    name: 'MAP (English)',
    language: 'en',
  },
  {
    url: 'https://www.mapnews.ma/fr/rss',
    name: 'MAP (French)',
    language: 'fr',
  },
  // Business & Economy
  {
    url: 'https://www.medias24.com/rss',
    name: 'Medias24 (Business)',
    language: 'fr',
  },
  {
    url: 'https://www.leconomiste.com/rss',
    name: 'L\'Économiste',
    language: 'fr',
  },
  // Regional News
  {
    url: 'https://www.hespress.com/rss',
    name: 'Hespress (Arabic)',
    language: 'ar',
  },
  {
    url: 'https://en.hespress.com/feed',
    name: 'Hespress (English)',
    language: 'en',
  },
  // Tourism & Culture
  {
    url: 'https://www.yabiladi.com/rss',
    name: 'Yabiladi',
    language: 'fr',
  },
  // International Coverage
  {
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    name: 'Al Jazeera (All)',
    language: 'en',
  },
  {
    url: 'https://www.france24.com/fr/afrique/rss',
    name: 'France 24 Africa',
    language: 'fr',
  },
];

/**
 * Fetch news from all Moroccan RSS feeds
 */
export async function fetchMoroccanRSSNews(timeoutMs: number = 15000): Promise<RSSArticle[]> {
  console.log(`[RSS] Fetching from ${MOROCCO_RSS_FEEDS.length} Moroccan RSS feeds (timeout: ${timeoutMs}ms)...`);
  
  const results = await Promise.allSettled(
    MOROCCO_RSS_FEEDS.map(feed => fetchRSSFeed(feed.url, feed.name, timeoutMs))
  );
  
  const allArticles: RSSArticle[] = [];
  let successCount = 0;
  let failCount = 0;
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const articles = result.value;
      if (articles.length > 0) {
        console.log(`[RSS] ✓ ${MOROCCO_RSS_FEEDS[index].name}: ${articles.length} articles`);
        allArticles.push(...articles);
        successCount++;
      }
    } else {
      failCount++;
      // Only log if not a timeout
      if (!result.reason?.message?.includes('timeout') && !result.reason?.message?.includes('aborted')) {
        console.error(`[RSS] ✗ ${MOROCCO_RSS_FEEDS[index].name}: ${result.reason?.message || 'Failed'}`);
      }
    }
  });
  
  // Remove duplicates by URL
  const uniqueArticles = Array.from(
    new Map(allArticles.map(article => [article.url, article])).values()
  );
  
  console.log(`[RSS] Summary: ${successCount} sources succeeded, ${failCount} timed out/failed, ${uniqueArticles.length} unique articles`);
  
  return uniqueArticles;
}

/**
 * Convert RSS article to NewsArticle format
 */
export function convertRSSToNewsArticle(rss: RSSArticle): any {
  return {
    title: rss.title,
    description: rss.description,
    url: rss.url,
    publishedAt: rss.publishedAt,
    urlToImage: rss.image,
    source: { name: rss.source },
  };
}

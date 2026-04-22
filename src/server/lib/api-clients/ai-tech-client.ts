/**
 * AI & Tech News Client
 * Aggregates AI/LLM/Agent news from multiple sources
 * Uses NewsAPI for tech news
 */

export type AITechNews = {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  category: 'LLM' | 'AI_AGENT' | 'AI_MODEL' | 'BENCHMARK' | 'FRAMEWORK' | 'RESEARCH' | 'COMPANY';
  tags: string[];
  imageUrl?: string;
};

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const NEWSAPI_BASE = 'https://newsapi.org/v2';

// AI/Tech keywords for categorization
const CATEGORY_KEYWORDS = {
  LLM: ['gpt', 'llm', 'large language model', 'claude', 'gemini', 'llama', 'mistral'],
  AI_AGENT: ['ai agent', 'autonomous agent', 'multi-agent', 'agent framework', 'langchain', 'autogen'],
  AI_MODEL: ['ai model', 'neural network', 'transformer', 'diffusion model', 'stable diffusion'],
  BENCHMARK: ['benchmark', 'leaderboard', 'evaluation', 'mmlu', 'humaneval', 'performance test'],
  FRAMEWORK: ['pytorch', 'tensorflow', 'jax', 'hugging face', 'framework', 'library'],
  RESEARCH: ['research paper', 'arxiv', 'study', 'breakthrough', 'discovery'],
  COMPANY: ['openai', 'anthropic', 'google ai', 'meta ai', 'microsoft ai', 'deepmind'],
};

/**
 * Fetch AI & Tech news from NewsAPI
 */
export async function fetchAITechNews(limit = 30): Promise<AITechNews[]> {
  if (!NEWSAPI_KEY) {
    console.warn('NEWSAPI_KEY not configured, returning empty AI tech news');
    return [];
  }

  try {
    // Search for AI/LLM/Agent related news
    const query = 'AI OR LLM OR "large language model" OR "AI agent" OR GPT OR Claude OR Gemini OR "machine learning"';
    
    const response = await fetch(
      `${NEWSAPI_BASE}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${limit}&language=en`,
      {
        headers: {
          'X-Api-Key': NEWSAPI_KEY,
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();
    const articles = data.articles || [];

    return articles.map((article: any) => {
      const category = categorizeArticle(article.title + ' ' + article.description);
      const tags = extractTags(article.title + ' ' + article.description);

      return {
        id: article.url,
        title: article.title,
        description: article.description || '',
        url: article.url,
        source: article.source?.name || 'Unknown',
        publishedAt: article.publishedAt,
        category,
        tags,
        imageUrl: article.urlToImage,
      };
    });
  } catch (error) {
    console.error('Failed to fetch AI tech news:', error);
    return [];
  }
}

/**
 * Categorize article based on content
 */
function categorizeArticle(content: string): AITechNews['category'] {
  const lowerContent = content.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerContent.includes(keyword))) {
      return category as AITechNews['category'];
    }
  }

  return 'RESEARCH'; // Default category
}

/**
 * Extract relevant tags from content
 */
function extractTags(content: string): string[] {
  const lowerContent = content.toLowerCase();
  const tags: string[] = [];

  // Check for specific AI models/companies
  const entities = [
    'GPT-4', 'GPT-5', 'Claude', 'Gemini', 'LLaMA', 'Mistral',
    'OpenAI', 'Anthropic', 'Google', 'Meta', 'Microsoft',
    'LangChain', 'AutoGen', 'CrewAI', 'Hugging Face',
    'PyTorch', 'TensorFlow', 'JAX',
  ];

  for (const entity of entities) {
    if (lowerContent.includes(entity.toLowerCase())) {
      tags.push(entity);
    }
  }

  return tags.slice(0, 5); // Limit to 5 tags
}

/**
 * Get AI model leaderboard data (simulated - would integrate with real leaderboard APIs)
 */
export async function fetchAILeaderboard() {
  // This would integrate with:
  // - Hugging Face Open LLM Leaderboard
  // - LMSYS Chatbot Arena
  // - AlpacaEval
  // For now, return structure for future implementation
  
  return {
    lastUpdated: new Date().toISOString(),
    models: [
      {
        name: 'GPT-4',
        provider: 'OpenAI',
        score: 95.3,
        rank: 1,
        category: 'Proprietary',
      },
      {
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        score: 94.8,
        rank: 2,
        category: 'Proprietary',
      },
      {
        name: 'Gemini Pro',
        provider: 'Google',
        score: 93.5,
        rank: 3,
        category: 'Proprietary',
      },
    ],
  };
}

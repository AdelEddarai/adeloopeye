/**
 * Telegram Bot API Client for OSINT Data Collection
 * Collects real-time news and events from public channels
 */

export type TelegramMessage = {
  message_id: number;
  date: number;
  text?: string;
  caption?: string;
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    title?: string;
    username?: string;
    type: 'private' | 'group' | 'supergroup' | 'channel';
  };
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
  }>;
  video?: {
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    duration: number;
    file_size?: number;
  };
  document?: {
    file_id: string;
    file_unique_id: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
  };
  location?: {
    longitude: number;
    latitude: number;
  };
  venue?: {
    location: {
      longitude: number;
      latitude: number;
    };
    title: string;
    address: string;
  };
  forward_from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  forward_from_chat?: {
    id: number;
    title: string;
    username?: string;
    type: string;
  };
  entities?: Array<{
    type: 'mention' | 'hashtag' | 'url' | 'email' | 'phone_number' | 'bold' | 'italic' | 'code' | 'pre' | 'text_link' | 'text_mention';
    offset: number;
    length: number;
    url?: string;
  }>;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_message?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
};

export type TelegramChannel = {
  id: string;
  username: string;
  title: string;
  description: string;
  country?: string;
  category: 'news' | 'politics' | 'security' | 'economy' | 'social' | 'weather' | 'transport';
  language: 'ar' | 'fr' | 'en' | 'es';
  verified: boolean;
  lastMessageId?: number;
};

// Morocco-focused Telegram channels for OSINT
export const MOROCCO_TELEGRAM_CHANNELS: TelegramChannel[] = [
  {
    id: '@hespress',
    username: 'hespress',
    title: 'Hespress هسبريس',
    description: 'Leading Moroccan news portal',
    country: 'MA',
    category: 'news',
    language: 'ar',
    verified: true,
  },
  {
    id: '@le360ma',
    username: 'le360ma',
    title: 'Le360 Morocco',
    description: 'Moroccan news and current affairs',
    country: 'MA',
    category: 'news',
    language: 'fr',
    verified: true,
  },
  {
    id: '@medias24ma',
    username: 'medias24ma',
    title: 'Medias24',
    description: 'Moroccan economic and political news',
    country: 'MA',
    category: 'economy',
    language: 'fr',
    verified: true,
  },
  {
    id: '@marocmeteo',
    username: 'marocmeteo',
    title: 'Maroc Météo',
    description: 'Weather alerts and forecasts for Morocco',
    country: 'MA',
    category: 'weather',
    language: 'fr',
    verified: false,
  },
  {
    id: '@moroccotraffic',
    username: 'moroccotraffic',
    title: 'Morocco Traffic',
    description: 'Real-time traffic and transport updates',
    country: 'MA',
    category: 'transport',
    language: 'fr',
    verified: false,
  },
];

// Global news channels for worldwide intelligence
export const GLOBAL_TELEGRAM_CHANNELS: TelegramChannel[] = [
  {
    id: '@bbcbreaking',
    username: 'bbcbreaking',
    title: 'BBC Breaking News',
    description: 'BBC breaking news updates',
    category: 'news',
    language: 'en',
    verified: true,
  },
  {
    id: '@rtnews',
    username: 'rtnews',
    title: 'RT News',
    description: 'RT international news',
    category: 'news',
    language: 'en',
    verified: true,
  },
  {
    id: '@aljazeera_breaking',
    username: 'aljazeera_breaking',
    title: 'Al Jazeera Breaking',
    description: 'Al Jazeera breaking news',
    category: 'news',
    language: 'en',
    verified: true,
  },
  {
    id: '@france24_en',
    username: 'france24_en',
    title: 'France 24 English',
    description: 'France 24 international news',
    category: 'news',
    language: 'en',
    verified: true,
  },
  {
    id: '@dwnews',
    username: 'dwnews',
    title: 'Deutsche Welle',
    description: 'DW international news',
    category: 'news',
    language: 'en',
    verified: true,
  },
];

export class TelegramClient {
  private botToken: string;
  private baseUrl: string;

  constructor(botToken?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    
    if (!this.botToken) {
      console.warn('⚠️ Telegram Bot Token not provided. Set TELEGRAM_BOT_TOKEN environment variable.');
    }
  }

  /**
   * Get updates from Telegram Bot API
   */
  async getUpdates(offset?: number, limit: number = 100): Promise<TelegramUpdate[]> {
    if (!this.botToken) {
      console.warn('⚠️ Telegram: No bot token, returning empty updates');
      return [];
    }

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        timeout: '30', // Long polling timeout
      });
      
      if (offset) {
        params.append('offset', offset.toString());
      }

      const response = await fetch(`${this.baseUrl}/getUpdates?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`);
      }

      return data.result || [];
    } catch (error) {
      console.error('❌ Telegram getUpdates error:', error);
      return [];
    }
  }

  /**
   * Get channel info by username
   */
  async getChat(chatId: string): Promise<any> {
    if (!this.botToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/getChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
        }),
      });

      const data = await response.json();
      return data.ok ? data.result : null;
    } catch (error) {
      console.error(`❌ Telegram getChat error for ${chatId}:`, error);
      return null;
    }
  }

  /**
   * Get file info and download URL
   */
  async getFile(fileId: string): Promise<{ file_path?: string; file_size?: number } | null> {
    if (!this.botToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/getFile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: fileId,
        }),
      });

      const data = await response.json();
      return data.ok ? data.result : null;
    } catch (error) {
      console.error(`❌ Telegram getFile error for ${fileId}:`, error);
      return null;
    }
  }

  /**
   * Download file from Telegram
   */
  getFileUrl(filePath: string): string {
    return `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
  }

  /**
   * Extract location data from message text using NLP
   */
  extractLocationFromText(text: string, country?: string): { location: string; confidence: number } | null {
    if (!text) return null;

    // Morocco-specific location patterns
    const moroccoLocations = [
      'Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Agadir', 'Meknes', 'Oujda',
      'Kenitra', 'Tetouan', 'Safi', 'El Jadida', 'Nador', 'Khouribga', 'Beni Mellal',
      'الدار البيضاء', 'الرباط', 'مراكش', 'فاس', 'طنجة', 'أكادير', 'مكناس', 'وجدة'
    ];

    // Global major cities
    const globalLocations = [
      'Paris', 'London', 'Berlin', 'Madrid', 'Rome', 'Moscow', 'Istanbul', 'Cairo',
      'Dubai', 'Riyadh', 'Tehran', 'Baghdad', 'Damascus', 'Beirut', 'Tunis', 'Algiers'
    ];

    const locations = country === 'MA' ? moroccoLocations : [...moroccoLocations, ...globalLocations];
    
    for (const location of locations) {
      const regex = new RegExp(`\\b${location}\\b`, 'gi');
      if (regex.test(text)) {
        return {
          location,
          confidence: 0.8,
        };
      }
    }

    return null;
  }

  /**
   * Extract event type from message content
   */
  extractEventType(text: string): 'POLITICAL' | 'SECURITY' | 'ECONOMIC' | 'SOCIAL' | 'WEATHER' | 'TRANSPORT' | 'OTHER' {
    if (!text) return 'OTHER';

    const lowerText = text.toLowerCase();

    // Political keywords
    if (lowerText.match(/\b(government|minister|parliament|election|vote|policy|diplomatic|embassy)\b/)) {
      return 'POLITICAL';
    }

    // Security keywords
    if (lowerText.match(/\b(police|security|arrest|crime|terrorism|attack|incident|emergency)\b/)) {
      return 'SECURITY';
    }

    // Economic keywords
    if (lowerText.match(/\b(economy|market|trade|business|investment|bank|finance|price|inflation)\b/)) {
      return 'ECONOMIC';
    }

    // Weather keywords
    if (lowerText.match(/\b(weather|rain|storm|temperature|wind|flood|drought|climate)\b/)) {
      return 'WEATHER';
    }

    // Transport keywords
    if (lowerText.match(/\b(traffic|transport|road|airport|flight|train|accident|closure)\b/)) {
      return 'TRANSPORT';
    }

    // Social keywords
    if (lowerText.match(/\b(protest|demonstration|social|culture|education|health|hospital)\b/)) {
      return 'SOCIAL';
    }

    return 'OTHER';
  }

  /**
   * Determine event severity from message content
   */
  extractSeverity(text: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (!text) return 'LOW';

    const lowerText = text.toLowerCase();

    // Critical keywords
    if (lowerText.match(/\b(urgent|breaking|critical|emergency|alert|crisis|disaster)\b/)) {
      return 'CRITICAL';
    }

    // High severity keywords
    if (lowerText.match(/\b(important|major|significant|serious|warning)\b/)) {
      return 'HIGH';
    }

    // Medium severity keywords
    if (lowerText.match(/\b(update|news|report|announcement|development)\b/)) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Check if bot token is configured
   */
  isConfigured(): boolean {
    return !!this.botToken;
  }
}

// Export singleton instance
export const telegramClient = new TelegramClient();
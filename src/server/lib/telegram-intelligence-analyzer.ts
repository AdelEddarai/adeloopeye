/**
 * Telegram Intelligence Analyzer
 * Processes Telegram messages into structured intelligence events
 */

import { telegramClient, type TelegramMessage, type TelegramChannel, MOROCCO_TELEGRAM_CHANNELS, GLOBAL_TELEGRAM_CHANNELS } from './api-clients/telegram-client';
import { getCoordinatesForLocation } from '@/shared/lib/location-coordinates';

export type TelegramEvent = {
  id: string;
  type: 'POLITICAL' | 'SECURITY' | 'ECONOMIC' | 'SOCIAL' | 'WEATHER' | 'TRANSPORT' | 'OTHER';
  title: string;
  description: string;
  location: string;
  position: [number, number];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  source: string;
  sourceChannel: string;
  messageId: number;
  image?: string;
  video?: string;
  document?: string;
  impact: string;
  status: 'ONGOING' | 'RESOLVED' | 'MONITORING';
  language: 'ar' | 'fr' | 'en' | 'es';
  country?: string;
  hashtags: string[];
  mentions: string[];
  urls: string[];
  mediaCount: number;
  forwardedFrom?: string;
};

export type TelegramIntelligenceResponse = {
  events: TelegramEvent[];
  channels: {
    monitored: number;
    active: number;
    lastUpdate: string;
  };
  summary: {
    totalEvents: number;
    criticalEvents: number;
    eventsByType: Record<string, number>;
    eventsByCountry: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    mediaEvents: number;
    recentEvents: number; // Last 24h
  };
  timestamp: string;
  error?: string;
};

class TelegramIntelligenceAnalyzer {
  private lastUpdateId: number = 0;
  private processedMessages: Set<string> = new Set();

  /**
   * Collect intelligence from Morocco-focused Telegram channels
   */
  async collectMoroccoIntelligence(): Promise<TelegramIntelligenceResponse> {
    console.log('📱 Collecting Morocco intelligence from Telegram...');
    
    if (!telegramClient.isConfigured()) {
      return this.createEmptyResponse('Telegram Bot Token not configured');
    }

    try {
      const events: TelegramEvent[] = [];
      const updates = await telegramClient.getUpdates(this.lastUpdateId + 1, 50);
      
      console.log(`📱 Received ${updates.length} Telegram updates`);

      for (const update of updates) {
        this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
        
        const message = update.message || update.channel_post;
        if (!message) continue;

        // Skip already processed messages
        const messageKey = `${message.chat.id}_${message.message_id}`;
        if (this.processedMessages.has(messageKey)) continue;
        this.processedMessages.add(messageKey);

        // Find matching channel
        const channel = this.findChannelByChat(message.chat, MOROCCO_TELEGRAM_CHANNELS);
        if (!channel) continue;

        const event = await this.processMessage(message, channel, 'MA');
        if (event) {
          events.push(event);
        }
      }

      // Sort by timestamp (newest first)
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return this.createResponse(events, MOROCCO_TELEGRAM_CHANNELS, 'MA');
    } catch (error) {
      console.error('❌ Telegram Morocco intelligence error:', error);
      return this.createEmptyResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Collect global intelligence from international Telegram channels
   */
  async collectGlobalIntelligence(): Promise<TelegramIntelligenceResponse> {
    console.log('🌍 Collecting global intelligence from Telegram...');
    
    if (!telegramClient.isConfigured()) {
      return this.createEmptyResponse('Telegram Bot Token not configured');
    }

    try {
      const events: TelegramEvent[] = [];
      const updates = await telegramClient.getUpdates(this.lastUpdateId + 1, 100);
      
      console.log(`🌍 Received ${updates.length} global Telegram updates`);

      for (const update of updates) {
        this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
        
        const message = update.message || update.channel_post;
        if (!message) continue;

        // Skip already processed messages
        const messageKey = `${message.chat.id}_${message.message_id}`;
        if (this.processedMessages.has(messageKey)) continue;
        this.processedMessages.add(messageKey);

        // Find matching global channel
        const channel = this.findChannelByChat(message.chat, GLOBAL_TELEGRAM_CHANNELS);
        if (!channel) continue;

        const event = await this.processMessage(message, channel);
        if (event) {
          events.push(event);
        }
      }

      // Sort by timestamp (newest first)
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return this.createResponse(events, GLOBAL_TELEGRAM_CHANNELS);
    } catch (error) {
      console.error('❌ Telegram global intelligence error:', error);
      return this.createEmptyResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process a single Telegram message into an intelligence event
   */
  private async processMessage(
    message: TelegramMessage, 
    channel: TelegramChannel, 
    country?: string
  ): Promise<TelegramEvent | null> {
    const text = message.text || message.caption || '';
    if (!text || text.length < 10) return null; // Skip very short messages

    // Extract location
    const locationData = message.location 
      ? { location: 'Unknown', confidence: 1.0 }
      : telegramClient.extractLocationFromText(text, country);
    
    if (!locationData) return null; // Skip messages without location

    // Get coordinates
    const coordinates = getCoordinatesForLocation(locationData.location);
    if (!coordinates) return null;

    // Extract event details
    const eventType = telegramClient.extractEventType(text);
    const severity = telegramClient.extractSeverity(text);
    
    // Extract entities
    const hashtags = this.extractHashtags(text);
    const mentions = this.extractMentions(text);
    const urls = this.extractUrls(text);

    // Generate event
    const event: TelegramEvent = {
      id: `tg_${message.chat.id}_${message.message_id}`,
      type: eventType,
      title: this.generateTitle(text, eventType),
      description: this.cleanText(text),
      location: locationData.location,
      position: [coordinates.lng, coordinates.lat],
      severity,
      timestamp: new Date(message.date * 1000).toISOString(),
      source: 'Telegram',
      sourceChannel: channel.title,
      messageId: message.message_id,
      impact: this.generateImpact(eventType, severity),
      status: severity === 'CRITICAL' ? 'ONGOING' : 'MONITORING',
      language: channel.language,
      country: country || undefined,
      hashtags,
      mentions,
      urls,
      mediaCount: this.countMedia(message),
      forwardedFrom: message.forward_from_chat?.title || message.forward_from?.first_name,
    };

    // Add media URLs if available
    if (message.photo && message.photo.length > 0) {
      const largestPhoto = message.photo[message.photo.length - 1];
      const fileInfo = await telegramClient.getFile(largestPhoto.file_id);
      if (fileInfo?.file_path) {
        event.image = telegramClient.getFileUrl(fileInfo.file_path);
      }
    }

    if (message.video) {
      const fileInfo = await telegramClient.getFile(message.video.file_id);
      if (fileInfo?.file_path) {
        event.video = telegramClient.getFileUrl(fileInfo.file_path);
      }
    }

    if (message.document) {
      const fileInfo = await telegramClient.getFile(message.document.file_id);
      if (fileInfo?.file_path) {
        event.document = telegramClient.getFileUrl(fileInfo.file_path);
      }
    }

    return event;
  }

  /**
   * Find channel configuration by chat info
   */
  private findChannelByChat(chat: TelegramMessage['chat'], channels: TelegramChannel[]): TelegramChannel | null {
    return channels.find(channel => 
      channel.username === chat.username || 
      channel.id === `@${chat.username}` ||
      channel.title === chat.title
    ) || null;
  }

  /**
   * Generate event title from message text
   */
  private generateTitle(text: string, eventType: string): string {
    const cleanText = this.cleanText(text);
    const firstSentence = cleanText.split(/[.!?]/)[0];
    const title = firstSentence.length > 100 
      ? firstSentence.substring(0, 97) + '...'
      : firstSentence;
    
    return title || `${eventType} Event`;
  }

  /**
   * Clean message text
   */
  private cleanText(text: string): string {
    return text
      .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
      .replace(/@\w+/g, '') // Remove mentions
      .replace(/#\w+/g, '') // Remove hashtags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Generate impact description
   */
  private generateImpact(eventType: string, severity: string): string {
    const impacts = {
      POLITICAL: {
        CRITICAL: 'Major political disruption expected',
        HIGH: 'Significant political implications',
        MEDIUM: 'Moderate political impact',
        LOW: 'Minor political relevance',
      },
      SECURITY: {
        CRITICAL: 'Immediate security threat',
        HIGH: 'Elevated security concerns',
        MEDIUM: 'Security situation monitoring',
        LOW: 'Routine security matter',
      },
      ECONOMIC: {
        CRITICAL: 'Major economic disruption',
        HIGH: 'Significant market impact',
        MEDIUM: 'Economic implications',
        LOW: 'Minor economic relevance',
      },
      WEATHER: {
        CRITICAL: 'Severe weather emergency',
        HIGH: 'Dangerous weather conditions',
        MEDIUM: 'Weather advisory',
        LOW: 'Weather update',
      },
      TRANSPORT: {
        CRITICAL: 'Major transport disruption',
        HIGH: 'Significant delays expected',
        MEDIUM: 'Transport affected',
        LOW: 'Minor transport impact',
      },
    };

    return impacts[eventType as keyof typeof impacts]?.[severity as keyof typeof impacts.POLITICAL] || 'Event monitoring';
  }

  /**
   * Extract hashtags from text
   */
  private extractHashtags(text: string): string[] {
    const matches = text.match(/#\w+/g);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  /**
   * Extract mentions from text
   */
  private extractMentions(text: string): string[] {
    const matches = text.match(/@\w+/g);
    return matches ? matches.map(mention => mention.substring(1)) : [];
  }

  /**
   * Extract URLs from text
   */
  private extractUrls(text: string): string[] {
    const matches = text.match(/https?:\/\/[^\s]+/g);
    return matches || [];
  }

  /**
   * Count media attachments
   */
  private countMedia(message: TelegramMessage): number {
    let count = 0;
    if (message.photo) count++;
    if (message.video) count++;
    if (message.document) count++;
    return count;
  }

  /**
   * Create response object
   */
  private createResponse(events: TelegramEvent[], channels: TelegramChannel[], country?: string): TelegramIntelligenceResponse {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const eventsByType: Record<string, number> = {};
    const eventsByCountry: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    
    let criticalEvents = 0;
    let mediaEvents = 0;
    let recentEvents = 0;

    events.forEach(event => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      // Count by country
      if (event.country) {
        eventsByCountry[event.country] = (eventsByCountry[event.country] || 0) + 1;
      }
      
      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      // Count critical events
      if (event.severity === 'CRITICAL') criticalEvents++;
      
      // Count media events
      if (event.mediaCount > 0) mediaEvents++;
      
      // Count recent events
      if (new Date(event.timestamp) > last24h) recentEvents++;
    });

    return {
      events,
      channels: {
        monitored: channels.length,
        active: channels.filter(c => c.verified).length,
        lastUpdate: now.toISOString(),
      },
      summary: {
        totalEvents: events.length,
        criticalEvents,
        eventsByType,
        eventsByCountry,
        eventsBySeverity,
        mediaEvents,
        recentEvents,
      },
      timestamp: now.toISOString(),
    };
  }

  /**
   * Create empty response with error
   */
  private createEmptyResponse(error: string): TelegramIntelligenceResponse {
    return {
      events: [],
      channels: {
        monitored: 0,
        active: 0,
        lastUpdate: new Date().toISOString(),
      },
      summary: {
        totalEvents: 0,
        criticalEvents: 0,
        eventsByType: {},
        eventsByCountry: {},
        eventsBySeverity: {},
        mediaEvents: 0,
        recentEvents: 0,
      },
      timestamp: new Date().toISOString(),
      error,
    };
  }
}

// Export singleton instance
export const telegramIntelligenceAnalyzer = new TelegramIntelligenceAnalyzer();
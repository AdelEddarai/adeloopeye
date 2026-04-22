import { NextRequest, NextResponse } from 'next/server';
import { telegramIntelligenceAnalyzer } from '@/server/lib/telegram-intelligence-analyzer';

/**
 * GET /api/v1/telegram/global
 * 
 * Collect real-time intelligence from global Telegram news channels
 * 
 * Features:
 * - Monitors international news channels (BBC, RT, Al Jazeera, France24, DW)
 * - Extracts global events with location data
 * - Multi-language support (English, Arabic, French)
 * - Categorizes by type and severity
 * - Includes media attachments and forwarded content
 * 
 * Rate Limits: Respects Telegram's 30 msg/sec limit
 * Cost: FREE (uses Telegram Bot API)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🌍 API: Fetching global Telegram intelligence...');
    
    const startTime = Date.now();
    const data = await telegramIntelligenceAnalyzer.collectGlobalIntelligence();
    const duration = Date.now() - startTime;
    
    console.log(`🌍 Global Telegram intelligence collected in ${duration}ms:`, {
      events: data.events.length,
      critical: data.summary.criticalEvents,
      channels: data.channels.monitored,
      countries: Object.keys(data.summary.eventsByCountry).length,
      error: data.error,
    });

    // Return success response
    return NextResponse.json({
      ok: true,
      data,
      meta: {
        source: 'telegram',
        region: 'global',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Global Telegram API error:', error);
    
    return NextResponse.json({
      ok: false,
      error: 'Failed to fetch global Telegram intelligence',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { telegramIntelligenceAnalyzer } from '@/server/lib/telegram-intelligence-analyzer';

/**
 * GET /api/v1/telegram/morocco
 * 
 * Collect real-time intelligence from Morocco-focused Telegram channels
 * 
 * Features:
 * - Monitors Moroccan news channels (Hespress, Le360, Medias24, etc.)
 * - Extracts events with location data
 * - Categorizes by type (political, security, economic, etc.)
 * - Determines severity levels
 * - Includes media attachments
 * 
 * Rate Limits: Respects Telegram's 30 msg/sec limit
 * Cost: FREE (uses Telegram Bot API)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📱 API: Fetching Morocco Telegram intelligence...');
    
    const startTime = Date.now();
    const data = await telegramIntelligenceAnalyzer.collectMoroccoIntelligence();
    const duration = Date.now() - startTime;
    
    console.log(`📱 Morocco Telegram intelligence collected in ${duration}ms:`, {
      events: data.events.length,
      critical: data.summary.criticalEvents,
      channels: data.channels.monitored,
      error: data.error,
    });

    // Return success response
    return NextResponse.json({
      ok: true,
      data,
      meta: {
        source: 'telegram',
        region: 'morocco',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Morocco Telegram API error:', error);
    
    return NextResponse.json({
      ok: false,
      error: 'Failed to fetch Morocco Telegram intelligence',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
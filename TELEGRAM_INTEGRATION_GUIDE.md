# Telegram Intelligence Integration

## Overview
Real-time OSINT monitoring from Telegram public channels integrated into the Morocco Intelligence map.

## Requirements
**YES - API Key Required (but FREE and unlimited for public channels)**

### How to Get Telegram Bot Token

1. **Open Telegram** (mobile or desktop app)

2. **Find BotFather**
   - Search for `@BotFather` in Telegram
   - Start a chat

3. **Create Bot**
   ```
   Send: /newbot
   Follow: Instructions to name your bot
   Receive: Bot token (123456789:ABCdefGHIjklMNOpqrsTUVwxyz)
   ```

4. **Configure Environment**
   ```bash
   # Add to .env.local
   TELEGRAM_BOT_TOKEN="your_token_here"
   ```

5. **Add Bot to Channels** (Optional - for private channels)
   - If monitoring private channels, add bot as admin
   - Public channels work automatically

## Monitored Channels

### Morocco Channels (5)
- **@hespress** - Hespress هسبريس (Arabic news)
- **@le360ma** - Le360 Morocco (French news)
- **@medias24ma** - Medias24 (Economic/political)
- **@marocmeteo** - Maroc Météo (Weather alerts)
- **@moroccotraffic** - Morocco Traffic (Transport)

### Global Channels (5)
- **@bbcbreaking** - BBC Breaking News
- **@rtnews** - RT News
- **@aljazeera_breaking** - Al Jazeera Breaking
- **@france24_en** - France 24 English
- **@dwnews** - Deutsche Welle

## Features

### Real-Time Event Processing
- Monitors 10 channels continuously
- Extracts location, severity, type from messages
- Geolocates events on map
- Filters by Morocco relevance
- Detects media (photos, videos, documents)
- Extracts hashtags, mentions, URLs

### Event Classification
**Types:**
- POLITICAL - Government, parliament, elections
- SECURITY - Police, military, terrorism
- ECONOMIC - Business, trade, investment
- SOCIAL - Protests, strikes, demonstrations
- WEATHER - Storms, floods, alerts
- TRANSPORT - Traffic, accidents, closures

**Severity:**
- CRITICAL - Keywords: crisis, emergency, urgent
- HIGH - Keywords: major, breaking, alert
- MEDIUM - Keywords: important, significant
- LOW - Regular updates

### Integration Points

1. **Morocco Intelligence API**
   ```typescript
   // Already integrated in route.ts
   const telegramData = await telegramIntelligenceAnalyzer.collectMoroccoIntelligence();
   ```

2. **Map Visualization**
   - Events appear as pulses on map
   - Color-coded by type and severity
   - Grouped with news events
   - Real-time updates every 30s

3. **KPI Dashboard**
   - Event counts by source
   - Media events tracking
   - 24h recent events

## Without Token

If `TELEGRAM_BOT_TOKEN` not configured:
- System continues working
- Other news sources still function (RSS, GNews, NewsAPI)
- Telegram events return empty array
- No errors shown to user

## Cost

**FREE - No Limits**
- Public channel monitoring: Unlimited
- No rate limits for bot API
- Only requires Telegram account

## Code Files

```
src/
├── server/lib/
│   ├── telegram-intelligence-analyzer.ts  # Main analyzer
│   └── api-clients/telegram-client.ts     # Bot API client
├── shared/hooks/
│   └── use-telegram-intelligence.ts       # React hooks
└── app/api/v1/telegram/
    ├── morocco/route.ts                   # Morocco endpoint
    └── global/route.ts                    # Global endpoint
```

## Testing

```bash
# Start dev server
npm run dev

# Check Telegram integration
curl http://localhost:3000/api/v1/telegram/morocco

# Expected with token:
{
  "events": [...],
  "channels": { "monitored": 5, "active": 5 },
  "summary": { "totalEvents": X }
}

# Expected without token:
{
  "events": [],
  "error": "Telegram Bot Token not configured"
}
```

## Adding More Channels

Edit `telegram-client.ts`:

```typescript
export const MOROCCO_TELEGRAM_CHANNELS: TelegramChannel[] = [
  {
    id: '@yourchannel',
    username: 'yourchannel',
    title: 'Your Channel',
    description: 'Description',
    country: 'MA',
    category: 'news',
    language: 'ar',
    verified: false,
  },
  // ... existing channels
];
```

## Notes

- Bot only reads messages, cannot send
- Works with public channels without admin access
- Private channels require bot to be added as admin
- Messages processed once (deduplicated by message_id)
- Updates fetched via long polling
- No webhooks required (simpler setup)

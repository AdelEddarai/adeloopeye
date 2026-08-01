# Google Analytics Setup Guide

This guide will help you integrate Google Analytics 4 (GA4) into your AdeloopEye project.

## 🚀 Quick Start

### 1. Get Your Google Analytics Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property (or use an existing one)
3. Navigate to **Admin** → **Data Streams**
4. Click on your web stream (or create a new one)
5. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Add Measurement ID to Environment Variables

Add your Measurement ID to your `.env` or `.env.local` file:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Important**: The variable must start with `NEXT_PUBLIC_` to be accessible in the browser.

### 3. That's It!

Google Analytics is now active on your site. The implementation will:
- ✅ Automatically track page views on route changes
- ✅ Load Analytics scripts after the page is interactive (for better performance)
- ✅ Only load when a valid Measurement ID is provided
- ✅ Track Single Page Application (SPA) navigation

## 📊 Tracking Custom Events

The implementation includes helper functions for tracking custom events.

### Track Custom Events

```typescript
import { trackEvent } from '@/lib/analytics';

// Example: Track button click
trackEvent('click', 'button', 'subscribe_button');

// Example: Track with value
trackEvent('purchase', 'ecommerce', 'premium_plan', 29.99);
```

### Track Page Views Manually

```typescript
import { trackPageView } from '@/lib/analytics';

trackPageView('/custom-page', 'Custom Page Title');
```

### Track Exceptions

```typescript
import { trackException } from '@/lib/analytics';

try {
  // Your code
} catch (error) {
  trackException(error.message, false); // false = non-fatal
}
```

## 🎯 Usage Examples

### Example 1: Track Dashboard View

```typescript
'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

export function DashboardPage() {
  useEffect(() => {
    trackEvent('view_dashboard', 'engagement', 'main_dashboard');
  }, []);

  return <div>Dashboard Content</div>;
}
```

### Example 2: Track User Interactions

```typescript
'use client';

import { trackEvent } from '@/lib/analytics';

export function InteractiveButton() {
  const handleClick = () => {
    trackEvent('click', 'cta', 'signup_button');
    // Your click handler logic
  };

  return <button onClick={handleClick}>Sign Up</button>;
}
```

### Example 3: Track Map Interactions

```typescript
'use client';

import { trackEvent } from '@/lib/analytics';

export function MapComponent() {
  const handleMarkerClick = (location: string) => {
    trackEvent('map_interaction', 'engagement', `marker_${location}`);
  };

  return <Map onMarkerClick={handleMarkerClick} />;
}
```

## 🔧 Advanced Configuration

### Custom Configuration

If you need to customize the GA4 configuration, edit `/src/lib/analytics/google-analytics.tsx`:

```typescript
gtag('config', '${measurementId}', {
  page_path: window.location.pathname,
  // Add custom configuration here
  send_page_view: false, // Disable automatic page views
  anonymize_ip: true,    // Anonymize IP addresses
  cookie_flags: 'SameSite=None;Secure', // Cookie configuration
});
```

### Privacy Considerations

To respect user privacy and comply with GDPR/CCPA:

1. **Cookie Consent**: The implementation already works with your existing `CookieConsentProvider`
2. **Disable Analytics**: Users can disable analytics by not providing the `NEXT_PUBLIC_GA_MEASUREMENT_ID` in production
3. **IP Anonymization**: Add `anonymize_ip: true` to the config (shown above)

## 🧪 Testing

### Development Testing

1. Add your Measurement ID to `.env.local`
2. Run `npm run dev`
3. Open [GA4 DebugView](https://analytics.google.com/analytics/web/#/a{your-property}/debugview)
4. Navigate through your app and verify events appear in DebugView

### Production Testing

1. Deploy with `NEXT_PUBLIC_GA_MEASUREMENT_ID` set
2. Visit your production site
3. Check [GA4 Realtime Report](https://analytics.google.com/analytics/web/#/realtime) to see live traffic

## 📁 File Structure

```
src/
├── lib/
│   └── analytics/
│       ├── google-analytics.tsx  # Main GA4 component
│       └── index.ts              # Helper functions and exports
└── app/
    └── layout.tsx                # Root layout with GA integration
```

## 🐛 Troubleshooting

### Analytics Not Working?

1. **Check Measurement ID**: Verify `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set correctly
2. **Check Browser Console**: Look for errors related to `gtag`
3. **Ad Blockers**: Disable ad blockers during testing
4. **DebugView**: Use GA4 DebugView to see real-time events
5. **Environment Variable**: Ensure the variable starts with `NEXT_PUBLIC_`

### Events Not Appearing?

- Allow 24-48 hours for events to appear in standard GA4 reports
- Use Realtime or DebugView for immediate verification
- Check that events are being called correctly in your code

## 📚 Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/9304153)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [Next.js Analytics Integration](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)

## 🎉 You're All Set!

Your Google Analytics implementation is now complete. The tracking will automatically:
- Track all page views across your SPA
- Load scripts optimally for performance
- Provide helper functions for custom events
- Work seamlessly with your existing cookie consent system

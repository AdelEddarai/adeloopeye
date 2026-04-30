# Flight Tracking Fix - Production Issue Resolution

## Problem Summary
Flights were not showing in production (Netlify) but worked in local development. The issue was caused by:

1. **OpenSky Network blocks cloud providers**: AWS, Netlify, Vercel, and other hyperscalers are intentionally blocked
2. **Duplicate implementations**: Two different flight tracking systems existed
3. **API confusion**: Two separate endpoints (`/api/v1/flights` and `/api/v1/live/flights`)
4. **Toggle confusion**: Flights were controlled by `assets` toggle instead of dedicated `flights` toggle
5. **Missing visibility**: No separate FLIGHTS button in the UI

## Solution Implemented

### Primary: adsb.fi API
- **Why**: Works on all cloud platforms (Netlify, Vercel, AWS)
- **Rate Limit**: 1 request/second (86,400 requests/day)
- **Coverage**: 5,400+ community feeders worldwide
- **Cost**: Completely free for personal/non-commercial use
- **Website**: https://adsb.fi/

### Fallback: OpenSky Network
- **When**: Used only as fallback for local development
- **Limitation**: Blocked on cloud platforms
- **Credentials**: Still useful for local development with authenticated access

## Changes Made

### 1. Consolidated Flight Tracking
**Removed (unused):**
- ❌ `src/features/map/hooks/use-flight-tracking.ts`
- ❌ `src/app/api/v1/flights/route.ts`

**Kept (working):**
- ✅ `src/shared/hooks/use-live-flights.ts` (used by 3 components)
- ✅ `src/app/api/v1/live/flights/route.ts` (robust API with bbox support)

### 2. Updated IntelMap Component
**File:** `src/features/map/components/IntelMap.tsx`

- Switched from `useFlightTracking` to `useLiveFlights`
- Added flight data transformation to Asset format
- Added dedicated FLIGHTS toggle button (purple theme)
- Added debug logging for production troubleshooting

### 3. Updated Layer Visibility
**File:** `src/features/map/components/intel-map-layers.ts`

- Added `flights: boolean` to `LayerVisibility` type
- Changed flight layers to use `visibility.flights` instead of `visibility.assets`
- Now flights have independent toggle control

### 4. Button Configuration
Added new FLIGHTS button to the map controls:
```typescript
{ key: 'flights', label: 'FLIGHTS', active: { 
  bg: 'var(--purple-dim)', 
  border: 'var(--purple)', 
  color: 'var(--purple)' 
}}
```

## API Endpoints (Final State)

### ✅ `/api/v1/live/flights` (ACTIVE)
- **Used by:** LiveFlightsWidget, LiveFlightsPanel, LiveIntelFeed, IntelMap
- **Features:**
  - Bounding box filtering
  - ICAO24 specific aircraft lookup
  - 10-second cache with stale-while-revalidate
  - Proper error handling
  - OpenSky Network integration

### ❌ `/api/v1/flights` (REMOVED)
- Was only used by IntelMap
- Duplicate functionality
- Less flexible (no bbox support)

## Testing Checklist

### Local Development
- [ ] Run `npm run dev`
- [ ] Open dashboard at `http://localhost:3000/dashboard`
- [ ] Check browser console for flight logs:
  - `[IntelMap] Flights data updated`
  - `[Flight Tracking] Fetching flights`
- [ ] Toggle FLIGHTS button on/off
- [ ] Verify airplane icons appear on map

### Production (Netlify)
- [ ] Deploy to Netlify
- [ ] Open browser DevTools → Console
- [ ] Check for flight API calls: `/api/v1/live/flights?bbox=24,32,42,63`
- [ ] Verify no 404 errors for `/api/v1/flights`
- [ ] Check flight count in console logs
- [ ] Toggle FLIGHTS button and verify visibility

## Environment Variables
Ensure these are set in Netlify:

```bash
# Required for better OpenSky API rate limits
OPENSKY_USERNAME=your_username
OPENSKY_PASSWORD=your_password
```

**Note:** The API works without credentials but has lower rate limits.

## Netlify Configuration

A `netlify.toml` file has been created with the following:

```toml
[build]
  command = "next build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"
```

This plugin is **critical** for Next.js API routes to work as serverless functions on Netlify.

## btoa() Compatibility Fix

The OpenSky client has been updated to work in both Node.js and edge environments:

```typescript
// Use Buffer for Node.js environments, fallback to btoa for edge/browser compatibility
const auth = typeof Buffer !== 'undefined' 
  ? Buffer.from(`${this.username}:${this.password}`).toString('base64')
  : btoa(`${this.username}:${this.password}`);
```

This ensures authentication works correctly in Netlify's serverless functions.

## Debugging Production Issues

If flights still don't show in production:

1. **Check Console Logs:**
   ```
   [IntelMap] Flights data updated: { count: X, sample: {...}, visibility: true }
   ```

2. **Check Network Tab:**
   - Look for `/api/v1/live/flights?bbox=24,32,42,63`
   - Status should be 200
   - Response should have `{ ok: true, data: { flights: [...] } }`

3. **Check OpenSky API:**
   - May be rate-limited (429 error)
   - May be blocked by Netlify's IP
   - Check server logs for OpenSky errors

4. **Fallback Behavior:**
   - API should return empty array on error (not crash)
   - UI should handle empty flights gracefully

## Architecture Benefits

### Before (Broken in Production)
```
IntelMap → useLiveFlights → /api/v1/live/flights → OpenSky (BLOCKED on cloud)
LiveFlightsWidget → useLiveFlights → /api/v1/live/flights → OpenSky (BLOCKED on cloud)
```

### After (Works Everywhere)
```
IntelMap → useLiveFlights → /api/v1/live/flights → adsb.fi (primary)
                                                    ↓ (fallback)
                                                OpenSky (local only)

LiveFlightsWidget → useLiveFlights → /api/v1/live/flights → adsb.fi (primary)
                                                            ↓ (fallback)
                                                        OpenSky (local only)
```

**Benefits:**
- ✅ Works on all cloud platforms (Netlify, Vercel, AWS)
- ✅ Automatic fallback to OpenSky if adsb.fi fails
- ✅ Source attribution shown in UI ("adsb.fi" or "opensky (fallback)")
- ✅ Better rate limits (86,400 requests/day vs 8,640)
- ✅ No API keys required for adsb.fi
- ✅ Single source of truth
- ✅ Shared caching across components
- ✅ Consistent error handling
- ✅ Easier to debug
- ✅ Less code to maintain

## Next Steps

1. **Deploy to production** and verify flights appear
2. **Monitor console logs** for any errors
3. **Consider adding OpenSky credentials** if rate limiting occurs
4. **Remove debug logs** after confirming it works in production
5. **Add loading state** to FLIGHTS button when fetching

## Related Files
- `src/server/lib/api-clients/adsbfi-client.ts` (NEW - Primary API client)
- `src/server/lib/api-clients/opensky-client.ts` (Fallback API client)
- `src/app/api/v1/live/flights/route.ts` (Updated - Dual API support)
- `src/app/api/v1/live/flights-global/route.ts` (Updated - Dual API support)
- `src/shared/hooks/use-live-flights.ts` (Updated - Source tracking)
- `src/features/map/components/IntelMap.tsx`
- `src/features/map/components/intel-map-layers.ts`
- `src/features/dashboard/components/widgets/LiveFlightsWidget.tsx` (Updated - Source display)
- `src/features/dashboard/components/LiveFlightsPanel.tsx` (Updated - Source display)
- `netlify.toml` (NEW - Netlify configuration)

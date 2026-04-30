# Flight Map Debugging Guide

## Issue: Flights Not Showing on Intel Map

### Root Cause Analysis

The flights are not showing on the Intel Map due to one or more of these potential issues:

1. **API Not Returning Data** - The adsb.fi API might not be returning flights
2. **Type Mismatch** - Response types don't match expected format
3. **Layer Not Rendering** - DeckGL layers might not be configured correctly
4. **Visibility Toggle** - Flights layer might be disabled in UI

---

## Changes Made

### 1. Fixed Type Definitions

**File**: `src/shared/hooks/use-live-flights.ts`

Added missing fields to `FlightsResponse` type:
```typescript
type FlightsResponse = {
  flights: OpenSkyFlight[];
  bbox: [number, number, number, number];
  count: number;
  fetchedAt: string;
  source?: string;      // ✅ Added
  scope?: string;       // ✅ Added
  error?: string;       // ✅ Added
};
```

### 2. Added Debug Logging

**File**: `src/features/map/components/IntelMap.tsx`

Added comprehensive console logging to track flight data:
```typescript
console.log('[IntelMap] No flight data available:', { liveFlightsData, flightsError, flightsLoading });
console.log('[IntelMap] Processing flights:', { totalFlights, source, scope, bbox });
console.log('[IntelMap] Processed flights:', { count, sample });
```

### 3. Added adsb.fi Attribution

**File**: `src/features/map/components/IntelMapLegend.tsx`

- Added "LIVE FLIGHTS" to legend with airplane icon
- Added attribution link to adsb.fi (required by their terms)

### 4. Created Test Page

**File**: `test-flights-api.html`

Simple HTML page to test the API endpoints directly without running the full app.

---

## How to Debug

### Step 1: Check if Dev Server is Running

```bash
# Start the dev server
npm run dev
```

Open browser to `http://localhost:3000`

### Step 2: Test API Directly

Open `http://localhost:3000/test-flights-api.html` in your browser and click:

1. **Test Global Flights** - Tests `/api/v1/live/flights?global=true`
2. **Test Regional Flights** - Tests `/api/v1/live/flights?bbox=24,32,42,63`
3. **Test Direct adsb.fi** - Tests the external API directly

### Step 3: Check Browser Console

Open Developer Tools (F12) and check the Console tab for:

```
[IntelMap] No flight data available: { ... }
[IntelMap] Processing flights: { totalFlights: X, source: 'adsb.fi', ... }
[IntelMap] Processed flights: { count: X, sample: [...] }
[useMapLayers] Created layers: { ... }
```

### Step 4: Check Network Tab

In Developer Tools, go to Network tab and filter for:
- `/api/v1/live/flights` - Should return 200 OK
- Look for response body with `{ ok: true, data: { flights: [...], count: X } }`

### Step 5: Verify Flights Layer is Enabled

On the Intel Map, check the top-right buttons:
- **FLIGHTS** button should be highlighted (purple border)
- If not, click it to enable

---

## Expected Behavior

### API Response Format

```json
{
  "ok": true,
  "data": {
    "flights": [
      {
        "icao24": "461e1a",
        "callsign": "UAE201",
        "origin_country": "United Arab Emirates",
        "latitude": 25.2532,
        "longitude": 55.3657,
        "baro_altitude": 10668,
        "velocity": 250,
        "on_ground": false,
        "true_track": 45,
        ...
      }
    ],
    "bbox": [-90, -180, 90, 180],
    "count": 150,
    "fetchedAt": "2026-04-30T...",
    "source": "adsb.fi",
    "scope": "global"
  }
}
```

### Console Logs

```
[IntelMap] Processing flights: {
  totalFlights: 150,
  source: 'adsb.fi',
  scope: 'global',
  bbox: [-90, -180, 90, 180]
}

[IntelMap] Processed flights: {
  count: 150,
  sample: [
    { id: '461e1a', name: 'UAE201', position: [55.3657, 25.2532], ... },
    { id: '4ca1fa', name: 'QTR8', position: [51.5074, 25.2532], ... },
    { id: '896094', name: 'UAE1', position: [55.3657, 25.2532], ... }
  ]
}

[useMapLayers] Created layers: {
  total: 15,
  layerIds: ['heat', 'zones', 'strikes', 'missiles', 'targets', 'assets', 'target-labels', 'asset-labels', 'flights-icons', 'flights-labels', 'maritime-lanes'],
  flightLayersIncluded: true,
  selectedFlightLayersIncluded: false
}
```

### Visual Indicators

On the Intel Map, you should see:
- **Purple airplane icons** on the map
- **Flight labels** below each icon (callsign or ICAO24)
- **FLIGHTS button** highlighted in purple
- **Legend** showing "LIVE FLIGHTS" with airplane icon
- **Attribution** at bottom of legend: "Flight data: adsb.fi"

---

## Common Issues & Solutions

### Issue 1: API Returns 0 Flights

**Symptoms:**
```json
{ "ok": true, "data": { "flights": [], "count": 0 } }
```

**Possible Causes:**
1. adsb.fi API is down or rate-limited
2. No flights in the requested region
3. Network/firewall blocking requests

**Solutions:**
1. Check adsb.fi status: https://globe.adsb.fi/
2. Try different regions (global vs regional)
3. Check for rate limit errors (429 status)
4. Wait 1-2 seconds between requests

### Issue 2: Flights Not Visible on Map

**Symptoms:**
- API returns flights
- Console shows processed flights
- But nothing visible on map

**Possible Causes:**
1. Flights layer is disabled
2. Map is zoomed to wrong location
3. Flight positions are outside viewport
4. Layer rendering issue

**Solutions:**
1. Click **FLIGHTS** button to enable layer
2. Zoom out to see global view
3. Check flight positions in console logs
4. Verify `flightLayersIncluded: true` in console

### Issue 3: TypeScript Errors

**Symptoms:**
```
Property 'source' does not exist on type 'FlightsResponse'
```

**Solution:**
Already fixed in `src/shared/hooks/use-live-flights.ts` - make sure you have the latest version.

### Issue 4: CORS Errors

**Symptoms:**
```
Access to fetch at 'https://opendata.adsb.fi/...' has been blocked by CORS policy
```

**Solution:**
This is expected when testing direct API calls from browser. The Next.js API route (`/api/v1/live/flights`) handles this by making server-side requests.

---

## Testing Checklist

- [ ] Dev server is running (`npm run dev`)
- [ ] Navigate to Intel Map (`/dashboard` or `/dashboard/map`)
- [ ] Open browser console (F12)
- [ ] Check for flight processing logs
- [ ] Verify FLIGHTS button is enabled (purple)
- [ ] Check Network tab for API calls
- [ ] Verify API returns `count > 0`
- [ ] Look for purple airplane icons on map
- [ ] Test clicking on a flight icon
- [ ] Verify flight info card appears
- [ ] Check legend shows "LIVE FLIGHTS"
- [ ] Verify adsb.fi attribution link

---

## API Endpoints

### Global Flights
```
GET /api/v1/live/flights?global=true
```
Returns flights from multiple strategic points worldwide (up to ~1000 flights)

### Regional Flights
```
GET /api/v1/live/flights?bbox=24,32,42,63
```
Returns flights in specified bounding box (Middle East example)

### Specific Aircraft
```
GET /api/v1/live/flights?icao24=461e1a
```
Returns single aircraft by ICAO24 hex code

---

## Rate Limits

- **adsb.fi**: 1 request/second (86,400/day)
- **App refresh**: Every 10 seconds
- **Daily requests**: ~8,640 (well within limit)

---

## Next Steps

1. **Run the dev server**: `npm run dev`
2. **Open test page**: `http://localhost:3000/test-flights-api.html`
3. **Test all three buttons** and check results
4. **Navigate to Intel Map**: `http://localhost:3000/dashboard`
5. **Open browser console** and look for flight logs
6. **Enable FLIGHTS layer** if disabled
7. **Report findings** with console logs and screenshots

---

## Support

If flights still don't show after following this guide:

1. Share console logs from browser
2. Share Network tab showing API response
3. Share screenshot of Intel Map
4. Confirm adsb.fi is working: https://globe.adsb.fi/

---

**Last Updated**: 2026-04-30
**Status**: ✅ Debugging tools added, ready for testing

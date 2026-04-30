# adsb.fi Integration - Deployment Guide

## ✅ What Was Changed

### New Files Created
1. **`src/server/lib/api-clients/adsbfi-client.ts`** - New API client for adsb.fi
2. **`netlify.toml`** - Netlify deployment configuration with Next.js plugin

### Files Modified
1. **`src/app/api/v1/live/flights/route.ts`** - Updated to use adsb.fi (primary) + OpenSky (fallback)
2. **`src/app/api/v1/live/flights-global/route.ts`** - Updated to use adsb.fi (primary) + OpenSky (fallback)
3. **`src/shared/hooks/use-live-flights.ts`** - Added source tracking
4. **`src/features/dashboard/components/widgets/LiveFlightsWidget.tsx`** - Shows data source
5. **`src/features/dashboard/components/LiveFlightsPanel.tsx`** - Shows data source
6. **`package.json`** - Added @netlify/plugin-nextjs dependency

---

## 🚀 Deployment Steps

### Step 1: Install Dependencies

```bash
npm install
```

This will install the `@netlify/plugin-nextjs` package required for Netlify deployment.

### Step 2: Test Locally

```bash
npm run dev
```

Then open your browser to `http://localhost:3000` and:
- Navigate to the dashboard
- Check the flights widget/panel
- You should see flights with source labeled as "adsb.fi"
- Open browser console to see API logs

### Step 3: Commit Changes

```bash
git add .
git commit -m "feat: integrate adsb.fi API for production flight tracking

- Add adsb.fi client as primary API (works on cloud platforms)
- Keep OpenSky as fallback for local development
- Update API routes with dual-API support
- Add source attribution in UI
- Add netlify.toml configuration
- Fix btoa() compatibility for serverless functions"
git push
```

### Step 4: Deploy to Netlify

Netlify should automatically trigger a new deployment when you push to your repository.

If using manual deployment:
```bash
npx netlify deploy --prod
```

### Step 5: Verify Deployment

1. **Check the deployment logs** in Netlify dashboard:
   - Go to your site → Deploys → Latest deploy
   - Check for any build errors

2. **Test the API endpoint directly**:
   ```
   https://your-site.netlify.app/api/v1/live/flights?bbox=24,32,42,63
   ```
   
   Expected response:
   ```json
   {
     "ok": true,
     "data": {
       "flights": [...],
       "bbox": [24, 32, 42, 63],
       "count": 15,
       "fetchedAt": "2026-04-29T...",
       "source": "adsb.fi"
     }
   }
   ```

3. **Check the UI**:
   - Open your deployed site
   - Navigate to dashboard
   - Flights should be showing with count > 0
   - Source badge should show "adsb.fi"

4. **Check Netlify function logs**:
   - Go to Deploys → Latest deploy → Functions tab
   - Look for `/api/v1/live/flights` logs
   - Should see: `[Live Flights API] Fetching from adsb.fi for bbox: ...`
   - Should see: `[ADSB.fi Client] Success, aircraft count: XX`

---

## 🔍 Troubleshooting

### Issue: Still showing 0 flights

**Check 1: API endpoint response**
```bash
curl "https://your-site.netlify.app/api/v1/live/flights?bbox=24,32,42,63"
```

**Check 2: Netlify function logs**
- Look for error messages
- Check if adsb.fi API is being called
- Check for rate limit errors (429 status)

**Check 3: adsb.fi API status**
- Visit https://globe.adsb.fi/ to verify service is up
- Test API directly: `https://opendata.adsb.fi/api/v3/lat/33/lon/44/dist/250`

**Check 4: Rate limiting**
- adsb.fi allows 1 request/second
- Your app refreshes every 10 seconds (well within limits)
- If you see 429 errors, increase refresh interval

### Issue: Build fails on Netlify

**Check 1: Plugin installation**
- Verify `@netlify/plugin-nextjs` is in package.json
- Run `npm install` locally to update package-lock.json

**Check 2: netlify.toml exists**
- Verify the file is committed to git
- Check syntax is correct

**Check 3: Node version**
- netlify.toml specifies Node 20
- Should be compatible with Next.js 16

### Issue: TypeScript errors

Run locally to catch errors:
```bash
npm run build
```

Fix any type errors before deploying.

---

## 📊 Expected Behavior

### Local Development
- **Primary API**: adsb.fi (works everywhere)
- **Fallback**: OpenSky (if adsb.fi fails)
- **Source badge**: Shows "adsb.fi" or "opensky (fallback)"
- **Rate limit**: 1 req/sec (adsb.fi), 10 sec (OpenSky anonymous)

### Production (Netlify/Vercel/AWS)
- **Primary API**: adsb.fi ✅
- **Fallback**: OpenSky (will fail - cloud providers blocked) ❌
- **Source badge**: Shows "adsb.fi"
- **Rate limit**: 1 req/sec (86,400/day)
- **Expected flight count**: 10-50+ flights in Middle East region

---

## 🎯 Key Improvements

| Feature | Before | After |
|---------|--------|-------|
| **Works on Netlify** | ❌ No (OpenSky blocked) | ✅ Yes (adsb.fi) |
| **Works on Vercel** | ❌ No (OpenSky blocked) | ✅ Yes (adsb.fi) |
| **Works Locally** | ✅ Yes | ✅ Yes |
| **Rate Limit** | 8,640/day | 86,400/day |
| **API Key Required** | Optional (OpenSky) | No (adsb.fi) |
| **Fallback** | None | OpenSky (local only) |
| **Source Attribution** | No | Yes (shows in UI) |
| **Error Handling** | Silent failures | Graceful fallback |

---

## 📝 API Response Format

### Success Response
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
        ...
      }
    ],
    "bbox": [24, 32, 42, 63],
    "count": 15,
    "fetchedAt": "2026-04-29T12:00:00.000Z",
    "source": "adsb.fi"
  }
}
```

### Error Response (graceful degradation)
```json
{
  "ok": true,
  "data": {
    "flights": [],
    "bbox": [24, 32, 42, 63],
    "count": 0,
    "fetchedAt": "2026-04-29T12:00:00.000Z",
    "error": "API error details"
  }
}
```

---

## 🔐 Environment Variables

### adsb.fi
- **No API key required** ✅
- Works out of the box
- Just make requests to the public endpoints

### OpenSky (Fallback Only)
Still useful for local development:
```env
OPENSKY_USERNAME=your_username
OPENSKY_PASSWORD=your_password
```

These are **not required for production** since adsb.fi is the primary API.

---

## 📈 Monitoring

### Check API Usage
- Monitor your Netlify function logs
- Track response times and success rates
- Watch for 429 (rate limit) errors

### Flight Count Expectations
- **Middle East region** (your default bbox): 10-50+ flights
- **Peak hours**: More flights during day time (UTC)
- **Remote areas**: Fewer flights
- **Military operations**: May have gaps in coverage

### Performance Metrics
- **API response time**: < 2 seconds
- **Cache hit rate**: High (10s cache)
- **Refresh interval**: 10 seconds
- **Daily requests**: ~8,640 (well within 86,400 limit)

---

## 🎓 Understanding the Architecture

### Why Both APIs?

1. **adsb.fi (Primary)**
   - Works on all cloud platforms
   - No authentication required
   - Generous rate limits
   - Community-driven, open data

2. **OpenSky (Fallback)**
   - Only works on local/non-cloud servers
   - Requires authentication for better limits
   - Kept for backward compatibility
   - Useful for local development testing

### How the Fallback Works

```typescript
try {
  // Try adsb.fi first (works everywhere)
  const flights = await adsbfiClient.getFlightsInBbox(bbox);
  return { flights, source: 'adsb.fi' };
} catch (adsbError) {
  // If adsb.fi fails, try OpenSky
  try {
    const flights = await openSkyClient.getFlightsInBbox(bbox);
    return { flights, source: 'opensky (fallback)' };
  } catch (openSkyError) {
    // Both failed, return empty
    return { flights: [], count: 0, error: '...' };
  }
}
```

---

## ✨ Next Steps

After deployment:

1. **Monitor for 24-48 hours** to ensure stability
2. **Check flight counts** match expectations
3. **Verify no rate limit errors** in logs
4. **Test on different devices** (mobile, desktop)
5. **Consider adding error boundaries** for better UX
6. **Add attribution link** to adsb.fi in UI (required by their terms)

### Required Attribution

adsb.fi terms require citation. Add this somewhere in your UI:
```
Flight data provided by adsb.fi - https://adsb.fi/
```

---

## 📚 Additional Resources

- **adsb.fi API Docs**: https://github.com/adsbfi/opendata
- **adsb.fi Live Map**: https://globe.adsb.fi/
- **adsb.fi Terms**: https://adsb.fi/ (see footer)
- **Netlify Plugin**: https://github.com/netlify/netlify-plugin-nextjs
- **OpenSky API**: https://openskynetwork.github.io/opensky-api/

---

## 🆘 Support

If you encounter issues:

1. **Check this guide** first for common solutions
2. **Review Netlify logs** for error details
3. **Test API directly** to isolate the issue
4. **Check adsb.fi status** at https://globe.adsb.fi/
5. **Review FLIGHT_API_PRODUCTION_FIX.md** for background

---

**Last Updated**: 2026-04-29
**Status**: ✅ Ready for deployment

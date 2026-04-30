# Flight Tracking - Quick Summary

## Problem
❌ Flights work locally but show 0 in production (Netlify)

## Root Cause
🚫 **OpenSky Network intentionally blocks cloud providers** (AWS, Netlify, Vercel, etc.)

## Solution Implemented
✅ **Switched to adsb.fi API** - works on all cloud platforms

---

## What Changed

### New Files
- `src/server/lib/api-clients/adsbfi-client.ts` - adsb.fi API client
- `netlify.toml` - Netlify configuration
- `ADSBFI_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `FLIGHT_API_PRODUCTION_FIX.md` - Root cause analysis

### Modified Files
- `src/app/api/v1/live/flights/route.ts` - Uses adsb.fi + OpenSky fallback
- `src/app/api/v1/live/flights-global/route.ts` - Uses adsb.fi + OpenSky fallback
- `src/shared/hooks/use-live-flights.ts` - Tracks data source
- `src/features/dashboard/components/widgets/LiveFlightsWidget.tsx` - Shows source
- `src/features/dashboard/components/LiveFlightsPanel.tsx` - Shows source
- `package.json` - Added @netlify/plugin-nextjs

---

## Deploy Now

```bash
# 1. Install dependencies
npm install

# 2. Test locally
npm run dev
# Check http://localhost:3000 - should show flights with "adsb.fi" badge

# 3. Commit and push
git add .
git commit -m "feat: integrate adsb.fi API for production flight tracking"
git push

# 4. Netlify will auto-deploy
# Check your site - flights should now work!
```

---

## Expected Results

| Environment | API Used | Flight Count |
|-------------|----------|--------------|
| Local Dev | adsb.fi (primary) | 10-50+ |
| Local Dev | OpenSky (fallback) | 10-50+ |
| **Netlify** | **adsb.fi (primary)** | **10-50+** ✅ |
| Netlify | OpenSky (blocked) | 0 ❌ |

---

## Verify It Works

1. Visit your deployed site
2. Check flights widget/panel
3. Should show: **"X active • Source: adsb.fi"**
4. Flight count should be > 0
5. Updates every 10 seconds

---

## Key Benefits

✅ Works on Netlify, Vercel, AWS (all cloud platforms)
✅ No API key required
✅ 86,400 requests/day (10x more than before)
✅ Automatic fallback to OpenSky
✅ Source attribution in UI
✅ Free for personal use

---

## Need Help?

📖 Read: `ADSBFI_DEPLOYMENT_GUIDE.md` for detailed instructions
🔍 Check: Netlify function logs for debugging
🌐 Test: `https://opendata.adsb.fi/api/v3/lat/33/lon/44/dist/250`

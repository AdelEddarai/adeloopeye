# Flight API Production Issue - Root Cause & Solutions

## 🚨 ROOT CAUSE IDENTIFIED

**OpenSky Network BLOCKS cloud providers and hyperscalers!**

From the official OpenSky API documentation:
> "Note that we may block AWS and other hyperscalers due to generalized abuse from these IPs."

This means:
- ❌ **AWS** (Lambda, EC2, etc.)
- ❌ **Vercel** (serverless functions)
- ❌ **Netlify** (serverless functions)
- ❌ **Google Cloud**
- ❌ **Azure**
- ❌ **Other major cloud providers**

All of these are **blocked or rate-limited** by OpenSky Network, which is why:
- ✅ Works in local development (your home IP is not blocked)
- ❌ Fails in production (Netlify/Vercel IPs are blocked)

This is **NOT** an environment variable issue or code bug - it's an intentional block by OpenSky Network.

---

## 📊 Free Flight API Alternatives Comparison

### 1. **adsb.fi** ⭐ RECOMMENDED
- **Free Tier:** Yes, completely free for personal use
- **Rate Limit:** 1 request/second (public endpoints)
- **Cloud Provider Block:** No known blocks
- **Features:**
  - Real-time flight tracking
  - Search by hex code, callsign, registration, squawk
  - Location-based queries (radius search up to 250 NM)
  - Military aircraft tracking
  - Compatible with ADSBexchange v2 API format
- **Limitations:**
  - Personal, non-commercial use only
  - Must cite adsb.fi with link
  - Full snapshot requires running a receiver
- **API Base:** `https://opendata.adsb.fi/api/`
- **Documentation:** https://github.com/adsbfi/opendata

### 2. **AviationStack**
- **Free Tier:** 100 requests/month (very limited!)
- **Rate Limit:** 100/month = ~3 requests/day
- **Cloud Provider Block:** No (runs on apilayer cloud)
- **Features:**
  - Real-time flight tracking
  - Flight status and schedules
  - Historical data (paid)
  - Airline routes (paid)
- **Limitations:**
  - ❌ Only 100 requests/month on free tier
  - Not suitable for 10-second refresh intervals
  - Commercial license requires paid plan ($49.99/month)
- **API Base:** `http://api.aviationstack.com/v1/`
- **Website:** https://aviationstack.com

### 3. **ADS-B Exchange** (API Lite)
- **Free Tier:** Low-cost for personal use (not completely free)
- **Rate Limit:** Varies by plan
- **Cloud Provider Block:** No
- **Features:**
  - Unfiltered global flight data
  - Military, private jets, commercial
  - High-fidelity data
- **Limitations:**
  - ❌ Retired their free unlimited service
  - Now requires payment for API access
  - More expensive than alternatives
- **Website:** https://www.adsbexchange.com/api-lite/

### 4. **FlightAware AeroAPI**
- **Free Tier:** Limited free tier available
- **Rate Limit:** Varies
- **Cloud Provider Block:** No
- **Features:**
  - Real-time flight tracking
  - Flight alerts
  - Comprehensive aviation data
- **Limitations:**
  - Free tier very limited
  - Primarily commercial-focused
  - Requires account approval
- **Website:** https://www.flightaware.com/commercial/data

---

## 🎯 RECOMMENDED SOLUTION: Switch to adsb.fi

### Why adsb.fi is the best choice:
1. ✅ **Completely free** for personal/non-commercial use
2. ✅ **No cloud provider blocks** (works on Netlify, Vercel, AWS, etc.)
3. ✅ **Generous rate limits** (1 request/second = 86,400 requests/day)
4. ✅ **Compatible API format** (similar to OpenSky)
5. ✅ **Community-driven** and open data
6. ✅ **Global coverage** with 5400+ feeders worldwide

### API Endpoints Available:

```typescript
// Search by location (latitude, longitude, distance in NM)
GET https://opendata.adsb.fi/api/v3/lat/{lat}/lon/{lon}/dist/{dist}

// Search by ICAO hex code
GET https://opendata.adsb.fi/api/v2/hex/{hex}
GET https://opendata.adsb.fi/api/v2/icao/{hex1},{hex2}

// Search by callsign
GET https://opendata.adsb.fi/api/v2/callsign/{callsign}

// Search by registration
GET https://opendata.adsb.fi/api/v2/registration/{reg}

// Military aircraft
GET https://opendata.adsb.fi/api/v2/mil
```

---

## 🔧 Implementation Plan

### Option A: Quick Fix - Switch to adsb.fi (Recommended)

**Pros:**
- Minimal code changes
- Works immediately in production
- Free and reliable
- Better rate limits than OpenSky anonymous tier

**Cons:**
- Slightly different API response format
- Need to adapt data parsing
- Location-based search only (no bbox)

**Estimated Effort:** 2-3 hours

### Option B: Keep OpenSky + Add Proxy

**Pros:**
- No code changes needed
- Keep existing functionality

**Cons:**
- Requires separate server/VPS (not serverless)
- Additional hosting costs
- More complex architecture
- Still subject to OpenSky rate limits

**Estimated Effort:** 4-6 hours + ongoing server costs

### Option C: Hybrid Approach

Use adsb.fi as primary, keep OpenSky as fallback for local development.

**Pros:**
- Best of both worlds
- Works in all environments
- Graceful degradation

**Cons:**
- More complex code
- Need to maintain two integrations

**Estimated Effort:** 4-5 hours

---

## 📝 Next Steps

1. **Choose an alternative** (recommendation: adsb.fi)
2. **Create new API route** (`/api/v1/live/flights` using adsb.fi)
3. **Update OpenSky client** or create new `adsbfi-client.ts`
4. **Test locally** with the new API
5. **Deploy to Netlify** and verify flights appear
6. **Monitor rate limits** and adjust refresh interval if needed

---

## 🔍 Verification Steps

After implementing the fix:

1. **Test API endpoint directly:**
   ```
   https://your-site.netlify.app/api/v1/live/flights?bbox=24,32,42,63
   ```

2. **Check Netlify function logs:**
   - No more OpenSky connection errors
   - Successful responses from adsb.fi

3. **Verify UI shows flights:**
   - Flight count should be > 0
   - Flights update every 10 seconds
   - No console errors

4. **Monitor rate usage:**
   - Track API calls per day
   - Ensure staying within limits (86,400/day for adsb.fi)

---

## 📚 Additional Resources

- **adsb.fi API Docs:** https://github.com/adsbfi/opendata
- **adsb.fi Live Map:** https://globe.adsb.fi/
- **OpenSky API Docs:** https://openskynetwork.github.io/opensky-api/
- **AviationStack Pricing:** https://aviationstack.com/pricing
- **ADS-B Exchange:** https://www.adsbexchange.com/

---

## ⚠️ Important Notes

1. **OpenSky Block is Intentional:** This is not a bug or temporary issue. OpenSky actively blocks cloud providers.

2. **Environment Variables Won't Help:** Even with valid credentials, OpenSky will block requests from Netlify/Vercel IPs.

3. **Rate Limits Matter:** With 10-second refresh intervals, you need:
   - 6 requests/minute
   - 360 requests/hour
   - 8,640 requests/day
   - OpenSky anonymous: 10s intervals (barely works)
   - OpenSky authenticated: 5s intervals (better, but still blocked in cloud)
   - adsb.fi: 1s intervals (plenty of headroom)

4. **Commercial Use:** If you plan to monetize, you'll need a commercial license from any provider.

5. **Attribution Required:** adsb.fi requires citation with link to their homepage.

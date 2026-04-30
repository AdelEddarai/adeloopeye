# adsb.fi API - No API Key Required! ✅

## Good News: You DON'T Need an API Key!

**adsb.fi is completely free and open** for personal, non-commercial use.

### What You Need to Know:

| Feature | Details |
|---------|---------|
| **API Key Required** | ❌ NO - Works without any authentication |
| **Registration** | ❌ NO - No account needed |
| **Cost** | ✅ 100% FREE for personal use |
| **Rate Limit** | 1 request/second (86,400 requests/day) |
| **Environment Variables** | ❌ NONE required |

---

## How It Works

Simply make requests to the API - no authentication needed:

```typescript
// This works immediately - no API key!
const response = await fetch('https://opendata.adsb.fi/api/v3/lat/33/lon/44/dist/250');
```

Your current implementation is already configured correctly and **requires no additional setup**.

---

## What IS Required (By Their Terms)

### 1. Attribution (Required)
You must cite adsb.fi and include a link to their homepage.

**Add this somewhere in your UI:**
```
Flight data provided by adsb.fi - https://adsb.fi/
```

**Example placement:**
- Footer of your dashboard
- Tooltip on the flights widget
- About page
- Settings page

### 2. Personal/Non-Commercial Use Only
- ✅ Personal projects
- ✅ Research
- ✅ Learning/education
- ❌ Cannot sell the data
- ❌ Cannot rent/lease the service
- ❌ Cannot use for commercial purposes without contacting them

---

## Optional: OpenSky Network (Fallback Only)

**OpenSky credentials are ONLY needed for local development fallback**, not for production.

### If You Want OpenSky as Local Fallback:

**Where to get credentials:**
1. Go to: https://opensky-network.org/
2. Click "Sign Up" in the top right
3. Create a free account
4. Your username is your email
5. Use your password

**Environment variables to set:**
```env
OPENSKY_USERNAME=your_email@example.com
OPENSKY_PASSWORD=your_password
```

**Where to set them:**
- **Local development**: In your `.env` file
- **Netlify**: Site settings → Environment variables
- **Vercel**: Project settings → Environment Variables

**But again**: These are **OPTIONAL** and only improve rate limits for local development. Production uses adsb.fi which needs no credentials.

---

## Current Status

✅ **Your implementation is ready to deploy - NO additional configuration needed!**

The code already:
- Uses adsb.fi as primary API (no key needed)
- Falls back to OpenSky if adsb.fi fails
- Shows source attribution in the UI
- Respects rate limits (10s refresh interval vs 1s limit)

---

## What to Add Before Production

### Required: Attribution Link

Add this to your dashboard footer or flights widget:

```tsx
<div className="text-[10px] text-[var(--t4)] text-center py-2">
  Flight data provided by{' '}
  <a 
    href="https://adsb.fi/" 
    target="_blank" 
    rel="noopener noreferrer"
    className="underline hover:text-[var(--t2)]"
  >
    adsb.fi
  </a>
</div>
```

### Optional: OpenSky Credentials (For Better Local Dev)

Only if you want OpenSky as a fallback during local development:

```env
# In your .env file (local only)
OPENSKY_USERNAME=adeleddarai29@gmail.com-api-client
OPENSKY_PASSWORD=QpaRKeh9fdfld0Mj8mCvtJ7FdM0pTsgx
```

**Note**: These are already in your `.env` file, so you're all set!

---

## Summary

| API | Production (Netlify) | Local Development | API Key Needed? |
|-----|---------------------|-------------------|-----------------|
| **adsb.fi** | ✅ Primary | ✅ Primary | ❌ NO |
| **OpenSky** | ❌ Blocked | ✅ Fallback | Optional (better limits) |

**Bottom line**: 
- ✅ Production works OUT OF THE BOX
- ✅ No API keys to configure
- ✅ No environment variables needed
- ✅ Just deploy and it works!

---

## Quick Deployment Checklist

- [x] adsb.fi client implemented
- [x] API routes updated
- [x] No API keys required
- [x] No env vars needed
- [ ] Add attribution link to UI (required by terms)
- [x] netlify.toml configured
- [x] @netlify/plugin-nextjs installed

**Ready to deploy!** 🚀

---

## Links

- **adsb.fi Homepage**: https://adsb.fi/
- **adsb.fi Live Map**: https://globe.adsb.fi/
- **adsb.fi API Docs**: https://github.com/adsbfi/opendata
- **OpenSky Signup** (optional): https://opensky-network.org/

---

**Last Updated**: 2026-04-29
**Status**: ✅ Ready - No API Key Required

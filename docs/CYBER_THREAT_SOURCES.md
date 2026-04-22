# Cyber Threat Intelligence Sources

This document describes the free, no-authentication-required threat intelligence sources used in the OSINT dashboard.

## Data Sources

### 1. Shodan InternetDB
- **URL**: https://internetdb.shodan.io
- **Authentication**: None required (completely free)
- **Rate Limits**: Reasonable for production use
- **Data Provided**:
  - Open ports on IP addresses
  - Known vulnerabilities (CVEs)
  - Service tags
  - Hostnames
  - CPE (Common Platform Enumeration) data

**Example Request**:
```bash
curl https://internetdb.shodan.io/8.8.8.8
```

**Example Response**:
```json
{
  "cpes": [],
  "hostnames": ["dns.google"],
  "ip": "8.8.8.8",
  "ports": [53, 443],
  "tags": [],
  "vulns": []
}
```

### 2. GitHub Open-Source Threat Intel Feeds
- **Repository**: https://github.com/Bert-JanP/Open-Source-Threat-Intel-Feeds
- **Authentication**: None required
- **Update Frequency**: Daily
- **Data Provided**:
  - Command & Control (C2) server IPs
  - Malware distribution IPs
  - Botnet IPs
  - Known malicious infrastructure

**Feeds Used**:
1. **C2 Servers** (30-day feed)
   - URL: `https://raw.githubusercontent.com/drb-ra/C2IntelFeeds/master/feeds/IPC2s-30day.csv`
   - Format: CSV
   - Contains: Active C2 infrastructure

2. **Malware IPs** (Level 3 - High confidence)
   - URL: `https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt`
   - Format: Plain text (one IP per line)
   - Contains: IPs associated with malware activity

3. **Botnet IPs** (30-day feed)
   - URL: `https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/botscout_30d.ipset`
   - Format: IPSet
   - Contains: Known botnet infrastructure

## Threat Classification

The system automatically classifies threats into the following categories:

### Threat Types
- **DDOS**: Distributed Denial of Service attacks
- **MALWARE**: Malware distribution and infection
- **RANSOMWARE**: Ransomware campaigns
- **PHISHING**: Phishing infrastructure
- **INTRUSION**: Command & Control and intrusion attempts

### Severity Levels
- **CRITICAL**: Immediate action required (e.g., ransomware, zero-day exploits)
- **HIGH**: Significant threat (e.g., active C2 servers, malware distribution)
- **MEDIUM**: Moderate threat (e.g., phishing campaigns)
- **LOW**: Low-priority threat

## Implementation Details

### Caching Strategy
- **Shodan InternetDB**: 1 hour cache per IP
- **GitHub Feeds**: 1 hour cache per feed
- **API Response**: 15 seconds cache with 30 seconds stale-while-revalidate

### Rate Limiting
All sources are free and have reasonable rate limits for production use. The implementation includes:
- Automatic retry with exponential backoff
- Graceful degradation on API failures
- Fallback to empty results rather than errors

### Geographic Location
IP addresses are mapped to approximate geographic locations using:
1. First octet-based geolocation (simplified)
2. Fallback to "Unknown" for unrecognized ranges

Future enhancement: Integrate with MaxMind GeoLite2 for accurate geolocation.

## Data Freshness

- **C2 Servers**: Updated daily, 30-day rolling window
- **Malware IPs**: Updated hourly
- **Botnet IPs**: Updated daily, 30-day rolling window
- **Shodan Data**: Real-time lookups

## Privacy & Compliance

All data sources are:
- Publicly available
- Free to use
- No personal data collection
- No authentication required
- Compliant with open-source licenses

## Alternative Sources (Future)

If you need more comprehensive threat intelligence, consider:

1. **AbuseIPDB** (Free tier available)
   - Requires API key (free)
   - 1,000 checks/day on free tier
   - Community-driven IP reputation

2. **GreyNoise** (Community API)
   - Free community API
   - Requires API key
   - Focuses on internet noise vs. targeted attacks

3. **VirusTotal** (Free tier)
   - Requires API key
   - 4 requests/minute on free tier
   - Comprehensive malware and URL analysis

## Monitoring & Alerts

The dashboard displays:
- Real-time threat counts by type
- Geographic distribution on map
- Pulsing visual indicators by severity
- Interactive tooltips with threat details
- Auto-refresh every 15 seconds

## Contributing

To add new threat intelligence sources:

1. Add the source to `src/server/lib/api-clients/cyber-threat-client.ts`
2. Implement fetch function with proper error handling
3. Add transformation logic to match the `CyberThreat` type
4. Update this documentation
5. Test with production-like data volumes

## Support

For issues or questions about threat intelligence sources:
- Check source documentation links above
- Review GitHub repository issues
- Verify API endpoints are accessible from your network

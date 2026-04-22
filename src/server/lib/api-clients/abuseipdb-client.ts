/**
 * AbuseIPDB Client
 * IP reputation and threat intelligence
 * https://www.abuseipdb.com/api
 */

export class AbuseIPDBClient {
  private apiKey: string;
  private baseUrl = 'https://api.abuseipdb.com/api/v2';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ABUSEIPDB_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  ABUSEIPDB_API_KEY not configured');
    }
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, val]) => url.searchParams.set(key, val));

    const res = await fetch(url.toString(), {
      headers: {
        'Key': this.apiKey,
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      throw new Error(`AbuseIPDB API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    return json.data as T;
  }

  /**
   * Check IP address reputation
   * @param ip IP address to check
   * @param maxAgeInDays How far back to check (default 90 days)
   */
  async checkIP(ip: string, maxAgeInDays: number = 90): Promise<IPReport> {
    return this.request<IPReport>('/check', {
      ipAddress: ip,
      maxAgeInDays: String(maxAgeInDays),
      verbose: 'true',
    });
  }

  /**
   * Get blacklisted IPs
   * @param limit Number of results (max 10000)
   * @param confidenceMinimum Minimum abuse confidence score (0-100)
   */
  async getBlacklist(limit: number = 100, confidenceMinimum: number = 90): Promise<BlacklistIP[]> {
    return this.request<BlacklistIP[]>('/blacklist', {
      limit: String(limit),
      confidenceMinimum: String(confidenceMinimum),
    });
  }

  /**
   * Report an IP address
   * @param ip IP to report
   * @param categories Comma-separated category IDs
   * @param comment Description of abuse
   */
  async reportIP(ip: string, categories: number[], comment: string): Promise<ReportResponse> {
    const url = `${this.baseUrl}/report`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Key': this.apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        ip,
        categories: categories.join(','),
        comment,
      }),
    });

    if (!res.ok) {
      throw new Error(`AbuseIPDB API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    return json.data as ReportResponse;
  }

  /**
   * Bulk report multiple IPs
   */
  async bulkReport(reports: Array<{ ip: string; categories: number[]; comment: string }>) {
    const url = `${this.baseUrl}/bulk-report`;
    
    const csv = [
      'IP,Categories,Comment',
      ...reports.map(r => `${r.ip},"${r.categories.join(',')}","${r.comment}"`),
    ].join('\n');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Key': this.apiKey,
        'Accept': 'application/json',
        'Content-Type': 'text/csv',
      },
      body: csv,
    });

    if (!res.ok) {
      throw new Error(`AbuseIPDB API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }
}

// AbuseIPDB types
export type IPReport = {
  ipAddress: string;
  isPublic: boolean;
  ipVersion: number;
  isWhitelisted: boolean;
  abuseConfidenceScore: number;
  countryCode: string;
  countryName: string;
  usageType: string;
  isp: string;
  domain: string;
  hostnames: string[];
  isTor: boolean;
  totalReports: number;
  numDistinctUsers: number;
  lastReportedAt: string;
  reports?: Array<{
    reportedAt: string;
    comment: string;
    categories: number[];
    reporterId: number;
    reporterCountryCode: string;
  }>;
};

export type BlacklistIP = {
  ipAddress: string;
  abuseConfidenceScore: number;
  lastReportedAt: string;
  countryCode: string;
  usageType: string;
  isp: string;
  domain: string;
  totalReports: number;
  numDistinctUsers: number;
};

export type ReportResponse = {
  ipAddress: string;
  abuseConfidenceScore: number;
};

// Abuse categories
export const ABUSE_CATEGORIES = {
  DNS_COMPROMISE: 1,
  DNS_POISONING: 2,
  FRAUD_ORDERS: 3,
  DDOS_ATTACK: 4,
  FTP_BRUTE_FORCE: 5,
  PING_OF_DEATH: 6,
  PHISHING: 7,
  FRAUD_VOIP: 8,
  OPEN_PROXY: 9,
  WEB_SPAM: 10,
  EMAIL_SPAM: 11,
  BLOG_SPAM: 12,
  VPNIP: 13,
  PORT_SCAN: 14,
  HACKING: 15,
  SQL_INJECTION: 16,
  SPOOFING: 17,
  BRUTE_FORCE: 18,
  BAD_WEB_BOT: 19,
  EXPLOITED_HOST: 20,
  WEB_APP_ATTACK: 21,
  SSH: 22,
  IOT_TARGETED: 23,
} as const;

// Singleton instance
export const abuseIPDBClient = new AbuseIPDBClient();

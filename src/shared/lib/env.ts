export function getRequiredEnv(name: string): string {
  if (!process.env[name]) {
    console.warn(`[WARNING] Missing environment variable: ${name}. App may not function correctly.`);
    return '';
  }
  return process.env[name] as string;
}

/* ── public (client-safe) env vars ─────────────────────────────── */

// Accessed via literal so Next.js can inline at build time.
export const publicConflictId: string =
  process.env.NEXT_PUBLIC_CONFLICT_ID ?? 'iran-2026';

export const publicAppUrl: string =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.conflicts.app';

export const publicPosthogKey: string | undefined =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_TOKEN;

export const publicPosthogHost: string =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

export const publicAnalyticsEnabled: boolean =
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';

/* ── server-only env vars ──────────────────────────────────────── */

// Lazy getter — only evaluated when called on the server.
export function getDatabaseUrl(): string {
  if (!process.env.DATABASE_URL) {
    console.warn('[WARNING] DATABASE_URL is missing. Using dummy URL to allow app to start without DB.');
    return 'postgres://dummy:dummy@localhost:5432/dummy';
  }
  return process.env.DATABASE_URL;
}

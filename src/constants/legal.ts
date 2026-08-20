/**
 * Published legal pages.
 *
 * Derived from the API base URL so a staging build points at staging's copies
 * rather than production's. The `/api` suffix is stripped because these are web
 * pages, not API endpoints.
 */
const apiBase = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';
const siteBase = apiBase.replace(/\/api\/?$/, '');

export const LEGAL_URLS = {
  privacy: `${siteBase}/legal/privacy`,
  terms: `${siteBase}/legal/terms`,
  support: `${siteBase}/support`,
} as const;

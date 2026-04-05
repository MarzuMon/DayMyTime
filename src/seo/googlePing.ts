/**
 * Google Ping – notify search engines after publishing.
 */

const SITE_URL = 'https://daymytime.com';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

/**
 * Ping Google and Bing to re-crawl the sitemap.
 * Best-effort, fire-and-forget.
 */
export async function pingSitemapToSearchEngines(): Promise<{ google: boolean; bing: boolean }> {
  const results = { google: false, bing: false };

  const endpoints = [
    { name: 'google' as const, url: `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}` },
    { name: 'bing' as const, url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}` },
  ];

  const settled = await Promise.allSettled(
    endpoints.map(async ep => {
      try {
        await fetch(ep.url, { mode: 'no-cors' });
        results[ep.name] = true;
      } catch {
        // Best effort – ignore failures
      }
    })
  );

  return results;
}

/**
 * Ping Google with a page-specific URL hint.
 */
export async function pingGoogleForUrl(pageUrl: string): Promise<void> {
  try {
    await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
      { mode: 'no-cors' }
    );
  } catch {
    // Best effort
  }
}

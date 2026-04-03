const SITE_URL = 'https://daymytime.com';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

/**
 * Ping Google and Bing to re-crawl the sitemap after new content is published.
 * This is a best-effort fire-and-forget call.
 */
export async function pingSearchEngines(): Promise<void> {
  const endpoints = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
  ];

  await Promise.allSettled(
    endpoints.map(url =>
      fetch(url, { mode: 'no-cors' }).catch(() => {/* ignore */})
    )
  );
}

/**
 * Ping Google with a specific URL for faster indexing via the informal ping endpoint.
 */
export async function pingGoogleUrl(pageUrl: string): Promise<void> {
  try {
    await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
      { mode: 'no-cors' }
    );
  } catch {
    // Best effort
  }
}

/**
 * Generate Article JSON-LD structured data
 */
export function generateArticleJsonLd(post: {
  title: string;
  seo_title?: string | null;
  excerpt: string;
  meta_description?: string | null;
  featured_image?: string | null;
  author_name: string;
  publish_date: string;
  updated_at?: string;
  slug: string;
}, type: 'history' | 'tips') {
  const basePath = type === 'history' ? '/history' : '/todaytip';
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.seo_title || post.title,
    description: post.meta_description || post.excerpt,
    image: post.featured_image || `${SITE_URL}/images/logo_D-full.png`,
    author: { '@type': 'Person', name: post.author_name },
    datePublished: post.publish_date,
    ...(post.updated_at ? { dateModified: post.updated_at.split('T')[0] } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'DayMyTime',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo-icon.webp` },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}${basePath}/${post.slug}`,
    },
    url: `${SITE_URL}${basePath}/${post.slug}`,
  };
}

/**
 * Generate WebSite JSON-LD for homepage
 */
export function generateWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DayMyTime',
    url: SITE_URL,
    description: 'Smart Visual Scheduler with productivity tips and daily inspiration.',
    publisher: {
      '@type': 'Organization',
      name: 'DayMyTime',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo-icon.webp` },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/topics/{search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate FAQ JSON-LD
 */
export function generateFaqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

/**
 * Generate BreadcrumbList JSON-LD
 */
export function generateBreadcrumbJsonLd(items: { label: string; href?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };
}

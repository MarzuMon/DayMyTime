/**
 * Schema Markup – generates JSON-LD structured data.
 */

const SITE_URL = 'https://daymytime.com';
const LOGO_URL = `${SITE_URL}/images/logo-icon.webp`;
const ORG_NAME = 'DayMyTime';

export interface ArticleSchemaInput {
  title: string;
  seoTitle?: string | null;
  description: string;
  metaDescription?: string | null;
  image?: string | null;
  authorName: string;
  publishDate: string;
  modifiedDate?: string;
  slug: string;
  type: 'history' | 'tips';
  keywords?: string[];
}

/**
 * Generate Article/BlogPosting JSON-LD.
 */
export function generateArticleSchema(input: ArticleSchemaInput): Record<string, unknown> {
  const basePath = input.type === 'history' ? '/history' : '/todaytip';
  const url = `${SITE_URL}${basePath}/${input.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.seoTitle || input.title,
    description: input.metaDescription || input.description,
    image: input.image || `${SITE_URL}/images/logo_D-full.png`,
    author: { '@type': 'Person', name: input.authorName },
    datePublished: input.publishDate,
    ...(input.modifiedDate ? { dateModified: input.modifiedDate.split('T')[0] } : {}),
    publisher: {
      '@type': 'Organization',
      name: ORG_NAME,
      logo: { '@type': 'ImageObject', url: LOGO_URL },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    ...(input.keywords?.length ? { keywords: input.keywords.join(', ') } : {}),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
  };
}

/**
 * Generate WebSite JSON-LD for homepage.
 */
export function generateWebsiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: ORG_NAME,
    url: SITE_URL,
    description: 'Smart Visual Scheduler with productivity tips and daily inspiration.',
    publisher: {
      '@type': 'Organization',
      name: ORG_NAME,
      logo: { '@type': 'ImageObject', url: LOGO_URL },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/topics/{search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate FAQ JSON-LD.
 */
export function generateFaqSchema(faqs: { q: string; a: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };
}

/**
 * Generate BreadcrumbList JSON-LD.
 */
export function generateBreadcrumbSchema(items: { label: string; href?: string }[]): Record<string, unknown> {
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

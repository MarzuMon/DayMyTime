const SITE_URL = 'https://daymytime.com';

export interface SeoMetaInput {
  title: string;
  seoTitle?: string | null;
  description: string;
  metaDescription?: string | null;
  keywords: string[];
  image?: string | null;
  url: string;
  type?: 'article' | 'website';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

export interface SeoMetaTags {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonical: string;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
}

const DEFAULT_IMAGE = `${SITE_URL}/images/logo_D-full.png`;

/**
 * Generate complete SEO meta tags from post data.
 */
export function generateSeoMeta(input: SeoMetaInput): SeoMetaTags {
  const title = truncate(input.seoTitle || input.title, 60);
  const description = truncate(input.metaDescription || input.description, 160);
  const image = input.image || DEFAULT_IMAGE;
  const canonical = input.url.startsWith('http') ? input.url : `${SITE_URL}${input.url}`;

  return {
    title,
    description,
    keywords: input.keywords.join(', '),
    ogTitle: title,
    ogDescription: description,
    ogImage: image,
    ogUrl: canonical,
    ogType: input.type === 'article' ? 'article' : 'website',
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
    canonical,
    ...(input.publishedTime ? { articlePublishedTime: input.publishedTime } : {}),
    ...(input.modifiedTime ? { articleModifiedTime: input.modifiedTime } : {}),
    ...(input.author ? { articleAuthor: input.author } : {}),
  };
}

/**
 * Apply meta tags to the document head (client-side).
 */
export function applySeoMetaToDocument(meta: SeoMetaTags): void {
  document.title = meta.title;

  const setMeta = (name: string, content: string, isProperty = false) => {
    const attr = isProperty ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.content = content;
  };

  setMeta('description', meta.description);
  setMeta('keywords', meta.keywords);
  setMeta('og:title', meta.ogTitle, true);
  setMeta('og:description', meta.ogDescription, true);
  setMeta('og:image', meta.ogImage, true);
  setMeta('og:url', meta.ogUrl, true);
  setMeta('og:type', meta.ogType, true);
  setMeta('og:site_name', 'DayMyTime', true);
  setMeta('og:locale', 'en_US', true);
  setMeta('og:image:width', '1200', true);
  setMeta('og:image:height', '630', true);
  setMeta('twitter:card', meta.twitterCard);
  setMeta('twitter:site', '@daymytime');
  setMeta('twitter:title', meta.twitterTitle);
  setMeta('twitter:description', meta.twitterDescription);
  setMeta('twitter:image', meta.twitterImage);

  if (meta.articlePublishedTime) setMeta('article:published_time', meta.articlePublishedTime, true);
  if (meta.articleModifiedTime) setMeta('article:modified_time', meta.articleModifiedTime, true);
  if (meta.articleAuthor) setMeta('article:author', meta.articleAuthor, true);

  // Canonical link
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = meta.canonical;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3).trimEnd() + '...';
}

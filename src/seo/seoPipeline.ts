/**
 * SEO Pipeline – orchestrates all SEO modules into a single `runSEO` function.
 * This runs automatically before publishing any blog post.
 */

import { extractKeywords, injectKeywordInFirstParagraph, keywordDensityScore } from './keywordEngine';
import { generateSeoMeta, type SeoMetaTags } from './seoMeta';
import { generateSlug, isValidSlug } from './slugGenerator';
import { injectInternalLinks } from './internalLinker';
import { optimizeImages, generateAltText } from './imageSEO';
import { generateArticleSchema, type ArticleSchemaInput } from './schema';
import { pingSitemapToSearchEngines } from './googlePing';

export interface SEOInput {
  title: string;
  content: string;
  excerpt: string;
  authorName: string;
  publishDate: string;
  type: 'history' | 'tips';
  featuredImage?: string | null;
  explicitKeywords?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  updatedAt?: string;
}

export interface SEOOutput {
  optimizedContent: string;
  slug: string;
  keywords: string[];
  metaTags: SeoMetaTags;
  jsonLd: Record<string, unknown>;
  altText: string;
  seoScore: number;
}

/**
 * Run the full SEO pipeline on a blog post.
 * Call this BEFORE publishing.
 */
export async function runSEO(input: SEOInput): Promise<SEOOutput> {
  // 1. Extract keywords
  const keywords = extractKeywords(input.title, input.explicitKeywords);

  // 2. Generate slug
  const slug = generateSlug(input.title, input.publishDate);

  // 3. Inject keywords into first paragraph
  let content = injectKeywordInFirstParagraph(input.content, keywords);

  // 4. Inject internal links
  const basePath = input.type === 'history' ? '/history' : '/todaytip';
  content = injectInternalLinks(content, `${basePath}/${slug}`);

  // 5. Optimize images with alt text
  content = optimizeImages(content, input.title, keywords);

  // 6. Generate alt text for featured image
  const altText = generateAltText(input.title, keywords);

  // 7. Generate meta tags
  const metaTags = generateSeoMeta({
    title: input.title,
    seoTitle: input.seoTitle,
    description: input.excerpt,
    metaDescription: input.metaDescription,
    keywords,
    image: input.featuredImage,
    url: `${basePath}/${slug}`,
    type: 'article',
    publishedTime: input.publishDate,
    modifiedTime: input.updatedAt,
    author: input.authorName,
  });

  // 8. Generate schema markup
  const jsonLd = generateArticleSchema({
    title: input.title,
    seoTitle: input.seoTitle,
    description: input.excerpt,
    metaDescription: input.metaDescription,
    image: input.featuredImage,
    authorName: input.authorName,
    publishDate: input.publishDate,
    modifiedDate: input.updatedAt,
    slug,
    type: input.type,
    keywords,
  });

  // 9. Calculate SEO score
  const seoScore = calculateSeoScore(input, keywords, slug, content);

  return {
    optimizedContent: content,
    slug,
    keywords,
    metaTags,
    jsonLd,
    altText,
    seoScore,
  };
}

/**
 * Run SEO + ping search engines. Use after publishing.
 */
export async function runSEOAndNotify(input: SEOInput): Promise<SEOOutput> {
  const result = await runSEO(input);

  // Fire-and-forget ping
  pingSitemapToSearchEngines().catch(() => {});

  return result;
}

/**
 * Calculate an overall SEO score (0-100).
 */
function calculateSeoScore(input: SEOInput, keywords: string[], slug: string, content: string): number {
  let score = 0;
  const checks = 10;

  // 1. Title length (50-60 chars ideal)
  const titleLen = (input.seoTitle || input.title).length;
  if (titleLen >= 30 && titleLen <= 60) score += 1;

  // 2. Meta description exists and is 120-160 chars
  const desc = input.metaDescription || input.excerpt;
  if (desc && desc.length >= 80 && desc.length <= 160) score += 1;

  // 3. Has keywords
  if (keywords.length >= 3) score += 1;

  // 4. Valid slug
  if (isValidSlug(slug)) score += 1;

  // 5. Featured image present
  if (input.featuredImage) score += 1;

  // 6. Content length (>200 words)
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 200) score += 1;

  // 7. Has headings
  if (/<h[2-3]/i.test(content)) score += 1;

  // 8. Keyword in first paragraph
  const firstPara = content.slice(0, 300).toLowerCase();
  if (keywords.some(k => firstPara.includes(k))) score += 1;

  // 9. Keyword density OK
  if (keywordDensityScore(content, keywords) >= 50) score += 1;

  // 10. Has internal links
  if (content.includes('daymytime.com') || content.includes('href="/')) score += 1;

  return Math.round((score / checks) * 100);
}

// Re-export all modules for convenience
export { extractKeywords, injectKeywordInFirstParagraph, keywordDensityScore } from './keywordEngine';
export { generateSeoMeta, applySeoMetaToDocument } from './seoMeta';
export { generateSlug, isValidSlug } from './slugGenerator';
export { injectInternalLinks, getSuggestedLinks } from './internalLinker';
export { optimizeImages, generateAltText } from './imageSEO';
export { generateArticleSchema, generateWebsiteSchema, generateFaqSchema, generateBreadcrumbSchema } from './schema';
export { pingSitemapToSearchEngines, pingGoogleForUrl } from './googlePing';

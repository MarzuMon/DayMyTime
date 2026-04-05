/**
 * DayMyTime Automated SEO Engine
 * 
 * Usage:
 *   import { runSEO, runSEOAndNotify } from '@/seo';
 * 
 *   // Before publishing:
 *   const seoResult = await runSEO({ title, content, excerpt, ... });
 *   
 *   // After publishing:
 *   const seoResult = await runSEOAndNotify({ title, content, excerpt, ... });
 */

export {
  runSEO,
  runSEOAndNotify,
  extractKeywords,
  injectKeywordInFirstParagraph,
  keywordDensityScore,
  generateSeoMeta,
  applySeoMetaToDocument,
  generateSlug,
  isValidSlug,
  injectInternalLinks,
  getSuggestedLinks,
  optimizeImages,
  generateAltText,
  generateArticleSchema,
  generateWebsiteSchema,
  generateFaqSchema,
  generateBreadcrumbSchema,
  pingSitemapToSearchEngines,
  pingGoogleForUrl,
} from './seoPipeline';

export type { SEOInput, SEOOutput } from './seoPipeline';
export type { SeoMetaTags, SeoMetaInput } from './seoMeta';
export type { ArticleSchemaInput } from './schema';

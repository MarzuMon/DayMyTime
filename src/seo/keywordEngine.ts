const SITE_URL = 'https://daymytime.com';

/**
 * Keyword Engine – ensures primary keywords appear naturally in content.
 */

/** Extract the most relevant keywords from title + explicit keywords list */
export function extractKeywords(title: string, explicitKeywords?: string | null): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'and', 'or', 'but', 'not', 'that', 'this', 'it',
    'as', 'be', 'has', 'had', 'do', 'did', 'will', 'can', 'may', 'who', 'what',
    'how', 'your', 'you', 'we', 'our', 'they', 'their', 'its', 'about', 'into',
  ]);

  const explicit = explicitKeywords
    ? explicitKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    : [];

  const fromTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const result: string[] = [];
  for (const kw of [...explicit, ...fromTitle]) {
    if (!seen.has(kw)) {
      seen.add(kw);
      result.push(kw);
    }
  }

  return result.slice(0, 8);
}

/**
 * Ensure the primary keyword appears in the first paragraph of the content.
 * If it's already there, content is returned unchanged.
 */
export function injectKeywordInFirstParagraph(content: string, keywords: string[]): string {
  if (keywords.length === 0) return content;

  const primary = keywords[0];
  // Check if already present in first ~300 chars
  const firstChunk = content.slice(0, 300).toLowerCase();
  if (firstChunk.includes(primary)) return content;

  // Find the end of the first sentence or paragraph
  const firstBreak = content.search(/[.!?]\s/);
  if (firstBreak === -1) return content;

  const insertionPoint = firstBreak + 1;
  const bridgePhrase = ` This is essential for anyone interested in ${primary}.`;

  return content.slice(0, insertionPoint) + bridgePhrase + content.slice(insertionPoint);
}

/**
 * Calculate keyword density score (0-100)
 */
export function keywordDensityScore(content: string, keywords: string[]): number {
  if (!content || keywords.length === 0) return 0;

  const words = content.toLowerCase().split(/\s+/);
  const totalWords = words.length;
  if (totalWords === 0) return 0;

  let found = 0;
  for (const kw of keywords) {
    const count = words.filter(w => w.includes(kw)).length;
    found += count;
  }

  const density = (found / totalWords) * 100;
  // Ideal density: 1-3%. Score peaks at 2%.
  if (density >= 1 && density <= 3) return 100;
  if (density < 1) return Math.round(density * 100);
  return Math.max(0, Math.round(100 - (density - 3) * 20));
}

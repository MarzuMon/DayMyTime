/**
 * Image SEO – optimizes image tags with alt text and attributes.
 */

/**
 * Add SEO-optimized alt text to images in HTML content.
 * Images without alt text get keyword-based descriptions.
 */
export function optimizeImages(html: string, title: string, keywords: string[]): string {
  const altBase = keywords.length > 0
    ? `${title} - ${keywords.slice(0, 3).join(', ')}`
    : title;

  let imgIndex = 0;

  return html.replace(/<img\b([^>]*)>/gi, (fullMatch, attrs: string) => {
    imgIndex++;

    // Skip if already has meaningful alt text
    const altMatch = attrs.match(/alt\s*=\s*["']([^"']*)["']/i);
    if (altMatch && altMatch[1].trim().length > 5) {
      // Just ensure loading="lazy" and dimensions
      return ensureImageAttrs(fullMatch, attrs);
    }

    const alt = imgIndex === 1 ? altBase : `${altBase} - image ${imgIndex}`;
    const cleanAlt = alt.replace(/"/g, '&quot;');

    // Replace or add alt
    let newAttrs: string;
    if (altMatch) {
      newAttrs = attrs.replace(/alt\s*=\s*["'][^"']*["']/i, `alt="${cleanAlt}"`);
    } else {
      newAttrs = `${attrs} alt="${cleanAlt}"`;
    }

    return ensureImageAttrs(`<img${newAttrs}>`, newAttrs);
  });
}

/**
 * Ensure images have loading="lazy" and decoding="async" for performance.
 */
function ensureImageAttrs(tag: string, attrs: string): string {
  let result = tag;

  if (!/loading\s*=/i.test(attrs)) {
    result = result.replace(/<img\b/i, '<img loading="lazy"');
  }

  if (!/decoding\s*=/i.test(attrs)) {
    result = result.replace(/<img\b/i, '<img decoding="async"');
  }

  return result;
}

/**
 * Generate an SEO-friendly alt text from title and keywords.
 */
export function generateAltText(title: string, keywords: string[]): string {
  const kw = keywords.slice(0, 3).join(', ');
  return kw ? `${title} – ${kw} | DayMyTime` : `${title} | DayMyTime`;
}

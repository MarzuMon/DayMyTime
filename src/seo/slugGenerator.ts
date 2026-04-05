/**
 * Slug Generator – creates SEO-friendly URL slugs.
 */

/**
 * Convert a title into a clean, SEO-friendly slug.
 * - Lowercases
 * - Removes special characters
 * - Replaces spaces with hyphens
 * - Trims leading/trailing hyphens
 * - Collapses consecutive hyphens
 */
export function generateSlug(title: string, dateSuffix?: string): string {
  let slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')   // remove symbols
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/-+/g, '-')            // collapse hyphens
    .replace(/^-|-$/g, '');         // trim edges

  if (dateSuffix) {
    const datePart = dateSuffix.replace(/\//g, '-').slice(0, 10);
    slug = `${slug}-${datePart}`;
  }

  // Max 80 chars for URL readability
  if (slug.length > 80) {
    slug = slug.slice(0, 80).replace(/-$/, '');
  }

  return slug;
}

/**
 * Validate a slug meets SEO requirements.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 100;
}

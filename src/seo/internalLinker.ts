/**
 * Internal Linker – automatically injects internal links into content.
 */

const SITE_URL = 'https://daymytime.com';

interface LinkTarget {
  keyword: RegExp;
  path: string;
  label: string;
}

const LINK_MAP: LinkTarget[] = [
  { keyword: /\bproductivity tips?\b/gi, path: '/topics/productivity-tips', label: 'productivity tips' },
  { keyword: /\bself[- ]improvement\b/gi, path: '/topics/self-improvement', label: 'self improvement' },
  { keyword: /\bdaily motivation\b/gi, path: '/topics/daily-motivation', label: 'daily motivation' },
  { keyword: /\blife hacks?\b/gi, path: '/topics/life-hacks', label: 'life hacks' },
  { keyword: /\btoday in history\b/gi, path: '/topics/today-in-history', label: 'today in history' },
  { keyword: /\bvisual scheduler\b/gi, path: '/', label: 'visual scheduler' },
  { keyword: /\btime management\b/gi, path: '/topics/productivity-tips', label: 'time management' },
  { keyword: /\bgoal setting\b/gi, path: '/topics/self-improvement', label: 'goal setting' },
  { keyword: /\bmorning routine\b/gi, path: '/topics/productivity-tips', label: 'morning routine' },
  { keyword: /\bwork[- ]life balance\b/gi, path: '/topics/self-improvement', label: 'work-life balance' },
];

/**
 * Inject internal links into HTML content.
 * Only the first match per path is linked. Max 3 links total.
 */
export function injectInternalLinks(content: string, currentPath?: string, maxLinks = 3): string {
  let linked = 0;
  let result = content;
  const usedPaths = new Set<string>();

  for (const { keyword, path, label } of LINK_MAP) {
    if (linked >= maxLinks) break;
    if (usedPaths.has(path)) continue;
    if (currentPath && path === currentPath) continue;

    keyword.lastIndex = 0;
    const match = keyword.exec(result);
    if (match) {
      // Don't link if already inside an anchor tag
      const before = result.slice(Math.max(0, match.index - 50), match.index);
      if (/<a\s[^>]*$/i.test(before)) continue;

      usedPaths.add(path);
      linked++;
      const anchor = `<a href="${SITE_URL}${path}" title="${label}" style="color:inherit;text-decoration:underline">${match[0]}</a>`;
      result = result.slice(0, match.index) + anchor + result.slice(match.index + match[0].length);
      keyword.lastIndex = 0;
    }
  }

  return result;
}

/**
 * Get suggested related links for a given piece of content.
 */
export function getSuggestedLinks(content: string, currentPath: string): { path: string; label: string; fullUrl: string }[] {
  const suggestions: { path: string; label: string; fullUrl: string }[] = [];
  for (const { keyword, path, label } of LINK_MAP) {
    if (path === currentPath) continue;
    keyword.lastIndex = 0;
    if (keyword.test(content)) {
      suggestions.push({ path, label, fullUrl: `${SITE_URL}${path}` });
    }
    keyword.lastIndex = 0;
  }
  return suggestions.slice(0, 5);
}

import { useMemo } from 'react';
import { Link } from 'react-router-dom';

const LINK_MAP: { keyword: RegExp; path: string; label: string }[] = [
  { keyword: /\bproductivity tips?\b/gi, path: '/topics/productivity-tips', label: 'productivity tips' },
  { keyword: /\bself[- ]improvement\b/gi, path: '/topics/self-improvement', label: 'self improvement' },
  { keyword: /\bdaily motivation\b/gi, path: '/topics/daily-motivation', label: 'daily motivation' },
  { keyword: /\blife hacks?\b/gi, path: '/topics/life-hacks', label: 'life hacks' },
  { keyword: /\btoday in history\b/gi, path: '/topics/today-in-history', label: 'today in history' },
  { keyword: /\bvisual scheduler\b/gi, path: '/', label: 'visual scheduler' },
  { keyword: /\btime management\b/gi, path: '/topics/productivity-tips', label: 'time management' },
];

interface AutoInternalLinksProps {
  content: string;
  maxLinks?: number;
  className?: string;
}

export default function AutoInternalLinks({ content, maxLinks = 3, className }: AutoInternalLinksProps) {
  const enrichedContent = useMemo(() => {
    let linked = 0;
    let result = content;
    const usedPaths = new Set<string>();

    for (const { keyword, path, label } of LINK_MAP) {
      if (linked >= maxLinks) break;
      if (usedPaths.has(path)) continue;

      const match = keyword.exec(result);
      if (match) {
        usedPaths.add(path);
        linked++;
        // Replace only first occurrence
        result = result.slice(0, match.index) +
          `<a href="${path}" class="text-primary underline underline-offset-2 hover:text-primary/80" data-internal="true">${match[0]}</a>` +
          result.slice(match.index + match[0].length);
        keyword.lastIndex = 0; // Reset regex
      }
    }

    return result;
  }, [content, maxLinks]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: enrichedContent }}
    />
  );
}

// Helper: get suggested internal links for a post based on its content
export function getSuggestedLinks(content: string, currentPath: string): { path: string; label: string }[] {
  const suggestions: { path: string; label: string }[] = [];
  for (const { keyword, path, label } of LINK_MAP) {
    if (path === currentPath) continue;
    keyword.lastIndex = 0;
    if (keyword.test(content)) {
      suggestions.push({ path, label });
    }
    keyword.lastIndex = 0;
  }
  return suggestions.slice(0, 5);
}

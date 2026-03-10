import { useEffect } from 'react';
import { useSeoKeywords } from '@/hooks/use-seo-keywords';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  type?: string;
}

export default function SEOHead({ title, description, canonical, type = 'website' }: SEOHeadProps) {
  const seoKeywords = useSeoKeywords();

  useEffect(() => {
    document.title = title;

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

    setMeta('description', description);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', type, true);
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);

    if (seoKeywords.length > 0) {
      setMeta('keywords', seoKeywords.join(', '));
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    return () => {
      const link = document.querySelector('link[rel="canonical"]');
      if (link) link.remove();
    };
  }, [title, description, canonical, type, seoKeywords]);

  return null;
}

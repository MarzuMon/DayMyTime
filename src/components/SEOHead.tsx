import { useEffect } from 'react';
import { useSeoKeywords } from '@/hooks/use-seo-keywords';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  type?: string;
  image?: string;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
  };
  noindex?: boolean;
}

export default function SEOHead({ title, description, canonical, type = 'website', image, article, noindex }: SEOHeadProps) {
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
    setMeta('og:site_name', 'DayMyTime', true);
    setMeta('og:locale', 'en_US', true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:site', '@daymytime');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);

    if (noindex) {
      setMeta('robots', 'noindex, nofollow');
    }

    if (image) {
      setMeta('og:image', image, true);
      setMeta('og:image:width', '1200', true);
      setMeta('og:image:height', '630', true);
      setMeta('twitter:image', image);
    }

    if (canonical) {
      setMeta('og:url', canonical, true);
    }

    if (type === 'article' && article) {
      if (article.publishedTime) setMeta('article:published_time', article.publishedTime, true);
      if (article.modifiedTime) setMeta('article:modified_time', article.modifiedTime, true);
      if (article.author) setMeta('article:author', article.author, true);
      if (article.section) setMeta('article:section', article.section, true);
    }

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
  }, [title, description, canonical, type, seoKeywords, image, article, noindex]);

  return null;
}

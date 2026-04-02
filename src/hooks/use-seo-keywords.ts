import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CACHE_KEY = 'dmt_seo_kw';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export function useSeoKeywords() {
  const [keywords, setKeywords] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) return data;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    // Skip fetch if cache is fresh
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) return;
      }
    } catch {}

    const fetchKw = async () => {
      const { data } = await supabase
        .from('seo_keywords')
        .select('keyword')
        .order('created_at', { ascending: false });
      if (data) {
        const kw = data.map(d => d.keyword);
        setKeywords(kw);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: kw, ts: Date.now() }));
        } catch {}
      }
    };

    // Defer to idle time
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(fetchKw);
    } else {
      setTimeout(fetchKw, 2000);
    }
  }, []);

  return keywords;
}

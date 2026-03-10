import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSeoKeywords() {
  const [keywords, setKeywords] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('seo_keywords')
        .select('keyword')
        .order('created_at', { ascending: false });
      if (data) setKeywords(data.map(d => d.keyword));
    };
    fetch();
  }, []);

  return keywords;
}

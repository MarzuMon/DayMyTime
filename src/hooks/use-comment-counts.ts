import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useCommentCounts(postIds: string[], postType: string) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (postIds.length === 0) return;

    const fetchCounts = async () => {
      const { data } = await supabase
        .from('post_comments')
        .select('post_id')
        .eq('post_type', postType)
        .in('post_id', postIds);

      if (data) {
        const map: Record<string, number> = {};
        data.forEach((row) => {
          map[row.post_id] = (map[row.post_id] || 0) + 1;
        });
        setCounts(map);
      }
    };

    fetchCounts();
  }, [postIds.join(','), postType]);

  return counts;
}

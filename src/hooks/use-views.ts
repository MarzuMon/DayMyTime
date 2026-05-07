import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function getAnonKey() {
  const k = 'dmt_anon_id';
  let v = localStorage.getItem(k);
  if (!v) {
    v = `anon_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem(k, v);
  }
  return v;
}

/** Records a unique view per (post, viewer) — safe to call on every page view. */
export function useTrackView(postId: string | undefined) {
  const { user } = useAuth();

  useEffect(() => {
    if (!postId) return;
    const viewerKey = user?.id || getAnonKey();
    // Session-level dedupe so we don't even hit the network twice
    const seenKey = `dmt_viewed_${postId}`;
    if (sessionStorage.getItem(seenKey)) return;
    sessionStorage.setItem(seenKey, '1');

    supabase
      .from('post_views')
      .insert({ post_id: postId, viewer_key: viewerKey })
      .then(() => {});
  }, [postId, user?.id]);
}

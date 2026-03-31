import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useLikes(postId: string, postType: string) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch initial state + subscribe to realtime
  useEffect(() => {
    if (!postId) return;

    const fetchLikes = async () => {
      const { count } = await supabase
        .from('post_likes')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId)
        .eq('post_type', postType);
      setLikeCount(count || 0);

      if (user) {
        const { data } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('post_type', postType)
          .eq('user_id', user.id)
          .maybeSingle();
        setLiked(!!data);
      }
    };

    fetchLikes();

    // Realtime subscription
    const channel = supabase
      .channel(`likes-${postType}-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLikeCount((c) => c + 1);
            if (user && (payload.new as any).user_id === user.id) setLiked(true);
          } else if (payload.eventType === 'DELETE') {
            setLikeCount((c) => Math.max(0, c - 1));
            if (user && (payload.old as any).user_id === user.id) setLiked(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, postType, user]);

  const toggleLike = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to like');
      return;
    }
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));

    try {
      if (wasLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('post_type', postType)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, post_type: postType, user_id: user.id });
        if (error) throw error;
      }
    } catch {
      // Revert optimistic update
      setLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
      toast.error('Failed to update like');
    } finally {
      setLoading(false);
    }
  }, [user, liked, loading, postId, postType]);

  return { liked, likeCount, toggleLike, loading };
}

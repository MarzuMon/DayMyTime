import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Comment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
  user_id: string;
}

export function useComments(postId: string, postType: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) return;

    const fetchComments = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('post_type', postType)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setComments(data as unknown as Comment[]);
      setLoading(false);
    };

    fetchComments();

    // Realtime subscription
    const channel = supabase
      .channel(`comments-${postType}-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const newComment = payload.new as unknown as Comment;
          setComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev;
            return [newComment, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, postType]);

  const addComment = useCallback(
    async (text: string) => {
      if (!user) {
        toast.error('Please sign in to comment');
        return false;
      }
      if (!text.trim()) return false;
      setSubmitting(true);

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        const { error } = await supabase.from('post_comments').insert({
          post_id: postId,
          post_type: postType,
          user_id: user.id,
          user_name: profile?.display_name || user.email || 'Anonymous',
          content: text.trim(),
        });

        if (error) throw error;
        toast.success('Comment added! ✅');
        return true;
      } catch {
        toast.error('Failed to add comment');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [user, postId, postType]
  );

  return { comments, loading, submitting, addComment };
}

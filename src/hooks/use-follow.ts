import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createNotification } from '@/lib/notify';

export function useFollow(targetUserId: string | undefined) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!targetUserId) return;
    (async () => {
      const { count } = await supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', targetUserId);
      setFollowerCount(count || 0);

      if (user) {
        const { data } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .maybeSingle();
        setFollowing(!!data);
      }
    })();
  }, [targetUserId, user?.id]);

  const toggle = useCallback(async () => {
    if (!user) {
      toast.error('Sign in to follow');
      return;
    }
    if (!targetUserId || user.id === targetUserId || loading) return;
    setLoading(true);
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowerCount((c) => (wasFollowing ? Math.max(0, c - 1) : c + 1));

    try {
      if (wasFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({ follower_id: user.id, following_id: targetUserId });
        if (error) throw error;
        const actorName =
          (user.user_metadata as any)?.display_name || user.email?.split('@')[0] || 'Someone';
        createNotification({
          recipientId: targetUserId,
          actorId: user.id,
          actorName,
          type: 'follow',
        });
      }
    } catch {
      setFollowing(wasFollowing);
      setFollowerCount((c) => (wasFollowing ? c + 1 : Math.max(0, c - 1)));
      toast.error('Action failed');
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId, following, loading]);

  return { following, followerCount, toggle, loading, isSelf: user?.id === targetUserId };
}

import { supabase } from '@/integrations/supabase/client';

interface NotifyParams {
  recipientId: string;
  actorId: string;
  actorName: string;
  type: 'like' | 'comment' | 'follow';
  postId?: string;
  postSlug?: string;
  postTitle?: string;
}

export async function createNotification(p: NotifyParams) {
  if (!p.recipientId || p.recipientId === p.actorId) return;
  try {
    await supabase.from('notifications').insert({
      user_id: p.recipientId,
      actor_id: p.actorId,
      actor_name: p.actorName,
      type: p.type,
      post_id: p.postId ?? null,
      post_slug: p.postSlug ?? null,
      post_title: p.postTitle ?? null,
    });
  } catch {
    /* swallow — notifications are best-effort */
  }
}

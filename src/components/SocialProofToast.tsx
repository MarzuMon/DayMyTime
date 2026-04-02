import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SocialProofToastProps {
  postId: string;
  postType: string;
  visible: boolean;
  onDismiss: () => void;
}

export default function SocialProofToast({ postId, postType, visible, onDismiss }: SocialProofToastProps) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!visible || !postId) return;

    const fetchStats = async () => {
      const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
        supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId).eq('post_type', postType),
        supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', postId).eq('post_type', postType),
      ]);

      const likes = likeCount || 0;
      const comments = commentCount || 0;

      if (likes > 0 && comments > 0) {
        setMessage(`🔥 ${likes} like${likes > 1 ? 's' : ''} & ${comments} comment${comments > 1 ? 's' : ''} on this post`);
      } else if (likes > 0) {
        setMessage(`❤️ ${likes} people liked this post`);
      } else if (comments > 0) {
        setMessage(`💬 ${comments} comment${comments > 1 ? 's' : ''} on this post`);
      } else {
        setMessage('✨ Be the first to like & comment!');
      }
    };

    fetchStats();
    const autoHide = setTimeout(onDismiss, 6000);
    return () => clearTimeout(autoHide);
  }, [visible, postId, postType]);

  if (!visible || !message) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-xs animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-background/95 backdrop-blur-md px-4 py-3 shadow-lg">
        <p className="text-xs font-medium flex-1">{message}</p>
        <button onClick={onDismiss} className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors" aria-label="Close">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { MessageSquare, Send, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useComments } from '@/hooks/use-comments';
import { useSubscription } from '@/hooks/use-subscription';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import SuggestedComments from '@/components/SuggestedComments';

interface CommentSectionProps {
  postId: string;
  postType: string;
  requireSubscription?: boolean;
}

export default function CommentSection({ postId, postType, requireSubscription = false }: CommentSectionProps) {
  const { comments, loading, submitting, addComment } = useComments(postId, postType);
  const { isSubscribed, user } = useSubscription();
  const [text, setText] = useState('');
  const navigate = useNavigate();

  const canComment = user && (!requireSubscription || isSubscribed);

  const handleSubmit = async () => {
    const success = await addComment(text);
    if (success) setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section data-comment-section>
      <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" /> Comments ({comments.length})
      </h3>

      {canComment ? (
        <>
        <SuggestedComments onSelect={(s) => setText(s)} />
        <div className="flex gap-2 mb-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment..."
            className="flex-1 min-h-[60px] rounded-xl"
            maxLength={1000}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="self-end rounded-xl"
          >
            {submitting ? (
              <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-4 p-3 rounded-xl bg-muted/50">
          {!user ? (
            <>
              <Button variant="link" onClick={() => navigate('/auth')} className="p-0 h-auto">
                Sign in
              </Button>{' '}
              to comment.
            </>
          ) : (
            'Subscribe to the newsletter to comment.'
          )}
        </p>
      )}

      {loading ? (
        <div className="text-center py-4 text-sm text-muted-foreground">Loading comments...</div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <UserIcon className="h-3 w-3" /> {c.user_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{c.content}</p>
              </CardContent>
            </Card>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
          )}
        </div>
      )}
    </section>
  );
}

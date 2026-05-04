import { Heart, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LikeNudgeProps {
  visible: boolean;
  onDismiss: () => void;
  onLikeClick?: () => void;
}

export function LikeNudge({ visible, onDismiss, onLikeClick }: LikeNudgeProps) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-background/95 backdrop-blur-md px-4 py-3 shadow-lg">
        <Heart className="h-5 w-5 text-primary shrink-0" />
        <p className="text-sm font-medium flex-1">Tap ❤️ if this helped you!</p>
        <button onClick={onLikeClick} className="text-xs font-semibold text-primary hover:underline shrink-0">Like</button>
        <button onClick={onDismiss} className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors" aria-label="Dismiss">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

interface EngagementPopupProps {
  visible: boolean;
  onDismiss: () => void;
}

export function EngagementPopup({ visible, onDismiss }: EngagementPopupProps) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-xs w-72 animate-in zoom-in-95 fade-in duration-300">
      <div className="rounded-xl border border-border bg-background/95 backdrop-blur-md p-4 shadow-xl">
        <div className="flex items-start justify-between mb-2">
          <span className="text-lg">🔥</span>
          <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-muted transition-colors" aria-label="Close">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        <p className="text-sm font-semibold mb-1">Enjoyed this post?</p>
        <p className="text-xs text-muted-foreground mb-3">Tap ❤️ and share your thoughts in the comments!</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => {
            onDismiss();
            document.querySelector('[data-like-button]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}>
            <Heart className="h-3.5 w-3.5" /> Like
          </Button>
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => {
            onDismiss();
            document.querySelector('[data-comment-section]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}>
            <MessageSquare className="h-3.5 w-3.5" /> Comment
          </Button>
        </div>
      </div>
    </div>
  );
}

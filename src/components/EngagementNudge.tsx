import { Heart, X, Gift, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface LikeNudgeProps {
  visible: boolean;
  onDismiss: () => void;
  onLikeClick?: () => void;
}

export function LikeNudge({ visible, onDismiss, onLikeClick }: LikeNudgeProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)]"
        >
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-background/95 backdrop-blur-md px-4 py-3 shadow-lg">
            <Heart className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm font-medium flex-1">Tap ❤️ if this helped you!</p>
            <button onClick={onLikeClick} className="text-xs font-semibold text-primary hover:underline shrink-0">Like</button>
            <button onClick={onDismiss} className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors" aria-label="Dismiss">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface EngagementPopupProps {
  visible: boolean;
  onDismiss: () => void;
}

export function EngagementPopup({ visible, onDismiss }: EngagementPopupProps) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-20 right-4 z-50 max-w-xs w-72"
        >
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
            <button
              onClick={() => { onDismiss(); navigate('/giveaway'); }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-primary font-medium hover:underline"
            >
              <Gift className="h-3.5 w-3.5" /> Like + Comment to enter giveaway!
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

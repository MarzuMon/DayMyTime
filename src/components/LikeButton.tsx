import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLikes } from '@/hooks/use-likes';
import { motion, AnimatePresence } from 'framer-motion';

interface LikeButtonProps {
  postId: string;
  postType: string;
  variant?: 'default' | 'ghost' | 'outline';
  showCount?: boolean;
}

export default function LikeButton({ postId, postType, variant = 'outline', showCount = true }: LikeButtonProps) {
  const { liked, likeCount, toggleLike, loading } = useLikes(postId, postType);

  return (
    <Button
      size="sm"
      variant={liked ? 'default' : (variant as any)}
      onClick={toggleLike}
      disabled={loading}
      className="gap-1.5 relative"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={liked ? 'liked' : 'unliked'}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current text-red-500' : ''}`} />
        </motion.span>
      </AnimatePresence>
      {showCount && <span>{likeCount}</span>}
    </Button>
  );
}

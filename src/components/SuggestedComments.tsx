import { motion } from 'framer-motion';

const SUGGESTIONS = [
  "This is very useful 🔥",
  "I will try this today!",
  "Amazing insight 👏",
  "Thanks for sharing this 💯",
  "Really helpful tip!",
  "Great article, learned something new!",
];

interface SuggestedCommentsProps {
  onSelect: (text: string) => void;
}

export default function SuggestedComments({ onSelect }: SuggestedCommentsProps) {
  return (
    <div className="mb-3">
      <p className="text-xs text-muted-foreground mb-2">💡 Quick responses:</p>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(s)}
            className="text-xs px-2.5 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
          >
            {s}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

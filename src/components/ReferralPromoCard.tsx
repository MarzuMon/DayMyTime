import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ReferralPromoCardProps {
  compact?: boolean;
}

export default function ReferralPromoCard({ compact = false }: ReferralPromoCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`rounded-xl border border-primary/20 bg-primary/5 ${compact ? 'p-3.5' : 'p-4'} cursor-pointer group hover:border-primary/40 transition-colors`}
      onClick={() => navigate('/auth')}
    >
      <div className="flex items-center gap-3">
        <div className={`${compact ? 'h-8 w-8' : 'h-9 w-9'} rounded-lg gradient-primary flex items-center justify-center shadow-glow shrink-0`}>
          <Sparkles className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-primary-foreground`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-display font-bold ${compact ? 'text-xs' : 'text-sm'}`}>
            🚀 Refer &amp; Earn Pro
          </p>
          <p className={`${compact ? 'text-[11px]' : 'text-xs'} text-muted-foreground mt-0.5 leading-relaxed`}>
            Share your referral link. 20 friends sign up → <strong className="text-primary">1 month free Pro!</strong>
          </p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </div>
    </motion.div>
  );
}

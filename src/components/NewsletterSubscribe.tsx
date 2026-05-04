import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const SubscribeModal = lazy(() => import("@/components/SubscribeModal"));

interface NewsletterSubscribeProps {
  title?: string;
  description?: string;
  icon?: string;
  variant?: "accent" | "primary" | "default";
  context?: "history" | "tips" | "default";
}

const CONTEXT_COPY: Record<string, { title: string; description: string }> = {
  history: {
    title: "📬 Get daily history updates",
    description: "Subscribe to receive articles directly in your inbox.",
  },
  tips: {
    title: "💡 Get daily productivity tips",
    description: "Subscribe for actionable time management advice.",
  },
  default: {
    title: "📬 Stay updated",
    description: "Get the latest tips and articles delivered to your inbox.",
  },
};

export default function NewsletterSubscribe({
  title,
  description,
  variant = "default",
  context = "default",
}: NewsletterSubscribeProps) {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const copy = CONTEXT_COPY[context] || CONTEXT_COPY.default;
  const displayTitle = title || copy.title;
  const displayDesc = description || copy.description;

  const variantClasses: Record<string, string> = {
    accent: "bg-accent/5 border-accent/20",
    primary: "bg-primary/5 border-primary/20",
    default: "bg-muted/30 border-border",
  };

  // Check subscription status when user changes
  useEffect(() => {
    if (!user?.email) {
      setIsSubscribed(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("newsletter_followers")
        .select("id")
        .eq("email", user.email!)
        .maybeSingle();
      setIsSubscribed(!!data);
      setLoading(false);
    };

    check();
  }, [user]);

  // Auto-subscribe after login
  const handleAuthSuccess = useCallback(async () => {
    if (!user?.email) return;

    const { error } = await supabase
      .from("newsletter_followers")
      .insert({ email: user.email });

    if (error?.code === "23505") {
      // Already subscribed
    } else if (error) {
      toast.error("Subscription failed. Please try again.");
      return;
    }

    setIsSubscribed(true);
  }, [user]);

  // When user logs in via OAuth redirect, auto-subscribe
  useEffect(() => {
    if (user?.email && !isSubscribed && !loading) {
      // Check if we just came back from OAuth
      const hash = window.location.hash;
      if (hash.includes("access_token") || hash.includes("type=recovery")) {
        handleAuthSuccess();
      }
    }
  }, [user, isSubscribed, loading, handleAuthSuccess]);

  const handleSubscribeClick = () => {
    if (user?.email) {
      // Already logged in — just subscribe directly
      handleAuthSuccess();
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <Card className={variantClasses[variant]}>
        <CardContent className="pt-6 pb-5">
          <AnimatePresence mode="wait">
            {isSubscribed ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-2"
              >
                <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-display font-bold text-sm">Subscribed ✅</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll receive our latest updates.
                </p>
              </motion.div>
            ) : (
              <motion.div key="cta" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 className="font-display font-bold mb-1 text-sm sm:text-base">
                  {displayTitle}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  {displayDesc}
                </p>
                <Button
                  onClick={handleSubscribeClick}
                  disabled={loading}
                  className="w-full sm:w-auto min-w-[140px] gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Subscribe
                </Button>
                <p className="text-[10px] text-muted-foreground mt-2">
                  🔒 We respect your privacy. No spam, unsubscribe anytime.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <SubscribeModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={handleAuthSuccess}
        />
      </Suspense>
    </>
  );
}

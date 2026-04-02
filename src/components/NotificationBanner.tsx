import { useState, useEffect } from "react";
import { X, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "dmt-banner-dismissed-v1";

interface NotificationBannerProps {
  message?: string;
  autoHideSeconds?: number;
  storageKey?: string;
}

export default function NotificationBanner({
  message = "We sincerely apologize for the recent issue with likes and comments due to a server problem—everything is now fixed, and you can continue participating.",
  autoHideSeconds = 8,
  storageKey = STORAGE_KEY,
}: NotificationBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(storageKey)) return;
    setVisible(true);

    if (autoHideSeconds > 0) {
      const timer = setTimeout(() => dismiss(), autoHideSeconds * 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(storageKey, "1");
  };

  if (!visible) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-[60] flex justify-center px-3 py-2 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="w-full max-w-3xl flex items-start gap-3 rounded-xl border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 px-4 py-3 shadow-lg backdrop-blur-sm">
        <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-[hsl(var(--success))]" />
        <p className="flex-1 text-sm leading-relaxed text-foreground">
          {message}
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 hover:bg-foreground/10 transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

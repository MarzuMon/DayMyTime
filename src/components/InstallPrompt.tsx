import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setShowBanner(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div
      className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 p-4 bg-card border-t shadow-elevated animate-fade-in"
      role="banner"
      style={{ paddingBottom: `calc(0.5rem + env(safe-area-inset-bottom, 0px))` }}
    >
      <div className="max-w-md mx-auto flex items-center gap-3">
        <Download className="h-8 w-8 text-primary flex-shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold text-sm">Install DayMyTime</p>
          <p className="text-xs text-muted-foreground">
            {deferredPrompt
              ? 'Add to your home screen for the best experience!'
              : 'Tap Share → Add to Home Screen'}
          </p>
        </div>
        {deferredPrompt && (
          <Button size="sm" onClick={handleInstall}>Install</Button>
        )}
        <button onClick={() => setShowBanner(false)} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

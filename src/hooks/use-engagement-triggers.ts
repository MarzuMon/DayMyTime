import { useState, useEffect, useCallback, useRef } from 'react';

interface EngagementState {
  showLikeNudge: boolean;
  showEngagementPopup: boolean;
  showSocialProof: boolean;
  dismissLikeNudge: () => void;
  dismissEngagementPopup: () => void;
  dismissSocialProof: () => void;
}

const STORAGE_KEY = 'dmt-engagement-dismissed';

function wasDismissedToday(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const { date } = JSON.parse(raw);
    return date === new Date().toDateString();
  } catch {
    return false;
  }
}

function markDismissedToday() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: new Date().toDateString() }));
}

export function useEngagementTriggers(postId: string | undefined): EngagementState {
  const [showLikeNudge, setShowLikeNudge] = useState(false);
  const [showEngagementPopup, setShowEngagementPopup] = useState(false);
  const [showSocialProof, setShowSocialProof] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    if (!postId || wasDismissedToday()) return;
    triggered.current = false;

    // Random delay between 20-60s for social proof
    const socialProofDelay = (20 + Math.random() * 40) * 1000;
    const socialTimer = setTimeout(() => setShowSocialProof(true), socialProofDelay);

    // Scroll-based triggers
    const handleScroll = () => {
      if (triggered.current) return;
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.4) {
        triggered.current = true;
        setShowLikeNudge(true);
        // Show engagement popup after additional delay
        setTimeout(() => setShowEngagementPopup(true), 8000);
      }
    };

    // Also trigger after 30s regardless
    const timeTimer = setTimeout(() => {
      if (!triggered.current) {
        triggered.current = true;
        setShowLikeNudge(true);
        setTimeout(() => setShowEngagementPopup(true), 8000);
      }
    }, 30000);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(socialTimer);
      clearTimeout(timeTimer);
    };
  }, [postId]);

  const dismissLikeNudge = useCallback(() => setShowLikeNudge(false), []);
  const dismissEngagementPopup = useCallback(() => {
    setShowEngagementPopup(false);
    markDismissedToday();
  }, []);
  const dismissSocialProof = useCallback(() => setShowSocialProof(false), []);

  return { showLikeNudge, showEngagementPopup, showSocialProof, dismissLikeNudge, dismissEngagementPopup, dismissSocialProof };
}

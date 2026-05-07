/** Lightweight client-side rate limiting using localStorage. */

export function canPostToday(userId: string, max = 5): { ok: boolean; remaining: number } {
  const key = `dmt_posts_${userId}_${new Date().toISOString().slice(0, 10)}`;
  const used = parseInt(localStorage.getItem(key) || '0', 10);
  return { ok: used < max, remaining: Math.max(0, max - used) };
}

export function recordPost(userId: string) {
  const key = `dmt_posts_${userId}_${new Date().toISOString().slice(0, 10)}`;
  const used = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, String(used + 1));
}

const COMMENT_COOLDOWN_MS = 10_000;
export function canCommentNow(userId: string): { ok: boolean; waitMs: number } {
  const key = `dmt_last_comment_${userId}`;
  const last = parseInt(localStorage.getItem(key) || '0', 10);
  const elapsed = Date.now() - last;
  if (elapsed < COMMENT_COOLDOWN_MS) {
    return { ok: false, waitMs: COMMENT_COOLDOWN_MS - elapsed };
  }
  return { ok: true, waitMs: 0 };
}

export function recordComment(userId: string) {
  localStorage.setItem(`dmt_last_comment_${userId}`, String(Date.now()));
}

const SPAM_KEYWORDS = ['viagra', 'casino', 'xxx', 'porn', 'crypto pump', 'free money'];
export function looksLikeSpam(text: string): boolean {
  const lower = text.toLowerCase();
  return SPAM_KEYWORDS.some((k) => lower.includes(k));
}

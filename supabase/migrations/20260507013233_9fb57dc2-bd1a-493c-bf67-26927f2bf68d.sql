
-- Add denormalized counters to user_posts
ALTER TABLE public.user_posts
  ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_posts_status_created ON public.user_posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_posts_author ON public.user_posts(author_id);

-- ============= FOLLOWS =============
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read follows" ON public.user_follows
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can follow others" ON public.user_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.user_follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.user_follows(following_id);

-- ============= NOTIFICATIONS =============
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,            -- recipient
  actor_id UUID,                    -- who triggered it
  actor_name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,               -- 'like' | 'comment' | 'follow'
  post_id UUID,
  post_slug TEXT,
  post_title TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- ============= REPORTS =============
CREATE TABLE IF NOT EXISTS public.post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  target_type TEXT NOT NULL,        -- 'post' | 'comment'
  target_id UUID NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'resolved' | 'dismissed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can submit reports" ON public.post_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id AND length(reason) <= 500);

CREATE POLICY "Admins manage reports" ON public.post_reports
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.post_reports(status, created_at DESC);

-- ============= POST VIEWS (unique per user/anon-session) =============
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  viewer_key TEXT NOT NULL,        -- user.id or anon session id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, viewer_key)
);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record views" ON public.post_views
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read view counts" ON public.post_views
  FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_post_views_post ON public.post_views(post_id);

-- ============= COUNTER TRIGGERS =============
CREATE OR REPLACE FUNCTION public.bump_user_post_views()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.user_posts SET views_count = views_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_bump_post_views ON public.post_views;
CREATE TRIGGER trg_bump_post_views
AFTER INSERT ON public.post_views
FOR EACH ROW EXECUTE FUNCTION public.bump_user_post_views();

CREATE OR REPLACE FUNCTION public.bump_user_post_likes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.post_type = 'community') THEN
    UPDATE public.user_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE' AND OLD.post_type = 'community') THEN
    UPDATE public.user_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_bump_post_likes ON public.post_likes;
CREATE TRIGGER trg_bump_post_likes
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.bump_user_post_likes();

CREATE OR REPLACE FUNCTION public.bump_user_post_comments()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.post_type = 'community') THEN
    UPDATE public.user_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE' AND OLD.post_type = 'community') THEN
    UPDATE public.user_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_bump_post_comments ON public.post_comments;
CREATE TRIGGER trg_bump_post_comments
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.bump_user_post_comments();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;

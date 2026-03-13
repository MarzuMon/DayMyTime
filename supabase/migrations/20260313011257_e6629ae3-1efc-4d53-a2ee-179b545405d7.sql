
-- History posts table
CREATE TABLE public.history_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  featured_image text,
  author_name text NOT NULL DEFAULT 'DayMyTime Team',
  publish_date date NOT NULL DEFAULT CURRENT_DATE,
  seo_title text,
  meta_description text,
  keywords text,
  status text NOT NULL DEFAULT 'draft',
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Daily tips table
CREATE TABLE public.daily_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  featured_image text,
  author_name text NOT NULL DEFAULT 'DayMyTime Team',
  publish_date date NOT NULL DEFAULT CURRENT_DATE,
  seo_title text,
  meta_description text,
  keywords text,
  status text NOT NULL DEFAULT 'draft',
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Post comments table
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  post_type text NOT NULL CHECK (post_type IN ('history', 'tip')),
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Post likes/bookmarks
CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  post_type text NOT NULL CHECK (post_type IN ('history', 'tip')),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, post_type, user_id)
);

-- Newsletter followers
CREATE TABLE public.newsletter_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.history_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_followers ENABLE ROW LEVEL SECURITY;

-- History posts: anyone can read published, admins can manage all
CREATE POLICY "Anyone can read published history posts" ON public.history_posts
  FOR SELECT TO anon, authenticated USING (status = 'published');

CREATE POLICY "Admins can manage history posts" ON public.history_posts
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Daily tips: anyone can read published, admins can manage all
CREATE POLICY "Anyone can read published daily tips" ON public.daily_tips
  FOR SELECT TO anon, authenticated USING (status = 'published');

CREATE POLICY "Admins can manage daily tips" ON public.daily_tips
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Comments: anyone authenticated can insert, read all, delete own
CREATE POLICY "Anyone can read comments" ON public.post_comments
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated can add comments" ON public.post_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.post_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage comments" ON public.post_comments
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Post likes: authenticated users
CREATE POLICY "Anyone can read likes" ON public.post_likes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated can toggle likes" ON public.post_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes" ON public.post_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Newsletter: anyone can subscribe, admins can read
CREATE POLICY "Anyone can subscribe" ON public.newsletter_followers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can read subscribers" ON public.newsletter_followers
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

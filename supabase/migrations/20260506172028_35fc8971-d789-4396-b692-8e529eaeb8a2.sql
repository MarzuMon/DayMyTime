-- Community user posts
CREATE TABLE public.user_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  featured_image text,
  category text NOT NULL DEFAULT 'productivity',
  status text NOT NULL DEFAULT 'published',
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_posts_status_created ON public.user_posts(status, created_at DESC);
CREATE INDEX idx_user_posts_author ON public.user_posts(author_id);

ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published user posts"
  ON public.user_posts FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can create own posts"
  ON public.user_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
  ON public.user_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authors can delete own posts"
  ON public.user_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_user_posts_updated_at
  BEFORE UPDATE ON public.user_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_questions_updated_at();

-- Storage policies for community uploads in existing content-images bucket
CREATE POLICY "Authenticated can upload community images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'content-images' AND (storage.foldername(name))[1] = 'community');

CREATE POLICY "Authenticated can update own community images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'content-images' AND owner = auth.uid());

CREATE POLICY "Authenticated can delete own community images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'content-images' AND owner = auth.uid());
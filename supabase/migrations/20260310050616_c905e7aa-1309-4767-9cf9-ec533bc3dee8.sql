
CREATE TABLE public.seo_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;

-- Admins can manage keywords
CREATE POLICY "Admins can manage seo_keywords" ON public.seo_keywords
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone (including anon) can read keywords for SEO meta tags
CREATE POLICY "Anyone can read seo_keywords" ON public.seo_keywords
  FOR SELECT TO anon, authenticated
  USING (true);

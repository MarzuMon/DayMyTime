
-- Giveaway config (replaces Firebase giveaway_meta/config)
CREATE TABLE public.giveaway_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_count integer NOT NULL DEFAULT 0,
  active_image_url text,
  expiry_date timestamp with time zone,
  is_finished boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Seed a single config row
INSERT INTO public.giveaway_config (id) VALUES (gen_random_uuid());

ALTER TABLE public.giveaway_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read giveaway config"
  ON public.giveaway_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage giveaway config"
  ON public.giveaway_config FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Giveaway contributions (replaces Firebase contributions collection)
CREATE TABLE public.giveaway_contributions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  phone text NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.giveaway_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit giveaway entry"
  ON public.giveaway_contributions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read contributions"
  ON public.giveaway_contributions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete contributions"
  ON public.giveaway_contributions FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Giveaway winners (replaces Firebase winners collection)
CREATE TABLE public.giveaway_winners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  image_url text,
  video_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.giveaway_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read winners"
  ON public.giveaway_winners FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage winners"
  ON public.giveaway_winners FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public count function (so anon users can see participant count without reading PII)
CREATE OR REPLACE FUNCTION public.get_giveaway_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT start_count FROM giveaway_config LIMIT 1), 0
  ) + (SELECT COUNT(*)::integer FROM giveaway_contributions);
$$;

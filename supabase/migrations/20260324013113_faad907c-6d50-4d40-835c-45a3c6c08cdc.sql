ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS is_finished boolean NOT NULL DEFAULT false;
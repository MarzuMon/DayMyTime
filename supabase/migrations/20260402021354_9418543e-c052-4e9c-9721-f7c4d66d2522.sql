ALTER TABLE public.history_posts
  ADD COLUMN social_instagram text DEFAULT NULL,
  ADD COLUMN social_twitter text DEFAULT NULL,
  ADD COLUMN social_linkedin text DEFAULT NULL;

ALTER TABLE public.daily_tips
  ADD COLUMN social_instagram text DEFAULT NULL,
  ADD COLUMN social_twitter text DEFAULT NULL,
  ADD COLUMN social_linkedin text DEFAULT NULL;
ALTER TABLE public.history_posts ADD COLUMN IF NOT EXISTS social_youtube_short text;
ALTER TABLE public.daily_tips ADD COLUMN IF NOT EXISTS social_youtube_short text;
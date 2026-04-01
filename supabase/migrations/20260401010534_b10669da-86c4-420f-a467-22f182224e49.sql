ALTER TABLE public.post_likes DROP CONSTRAINT post_likes_post_type_check;
ALTER TABLE public.post_comments DROP CONSTRAINT post_comments_post_type_check;

ALTER TABLE public.post_likes ADD CONSTRAINT post_likes_post_type_check CHECK (post_type = ANY (ARRAY['history'::text, 'tip'::text, 'giveaway'::text]));
ALTER TABLE public.post_comments ADD CONSTRAINT post_comments_post_type_check CHECK (post_type = ANY (ARRAY['history'::text, 'tip'::text, 'giveaway'::text]));
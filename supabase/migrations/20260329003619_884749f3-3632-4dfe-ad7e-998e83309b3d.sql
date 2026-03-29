
-- Fix: Restrict post_likes and post_comments SELECT to authenticated only (remove anon access)
-- This prevents unauthenticated users from enumerating user_id values

-- post_likes: drop old public SELECT, create authenticated-only SELECT
DROP POLICY IF EXISTS "Anyone can read likes" ON public.post_likes;
CREATE POLICY "Authenticated can read likes"
  ON public.post_likes FOR SELECT
  TO authenticated
  USING (true);

-- post_comments: drop old public SELECT, create authenticated-only SELECT
DROP POLICY IF EXISTS "Anyone can read comments" ON public.post_comments;
CREATE POLICY "Authenticated can read comments"
  ON public.post_comments FOR SELECT
  TO authenticated
  USING (true);


-- Fix the newsletter policy to be more restrictive
DROP POLICY "Anyone can subscribe" ON public.newsletter_followers;
CREATE POLICY "Anyone can subscribe with email" ON public.newsletter_followers
  FOR INSERT TO anon, authenticated WITH CHECK (email IS NOT NULL AND email <> '');

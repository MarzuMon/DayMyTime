-- Fix suppressed_emails SELECT policy: restrict to service_role only
-- Drop the existing fragile policy that checks auth.role() = 'service_role' on public role
DROP POLICY IF EXISTS "Service role can read suppressed emails" ON public.suppressed_emails;
DROP POLICY IF EXISTS "Only service role can read" ON public.suppressed_emails;

-- Recreate: only the service_role database role can SELECT
CREATE POLICY "Service role reads suppressed emails"
  ON public.suppressed_emails
  FOR SELECT
  TO service_role
  USING (true);
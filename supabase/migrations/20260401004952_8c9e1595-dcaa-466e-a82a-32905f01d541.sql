
-- Create a security definer function to get the current user's email
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid()
$$;

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can check own subscription" ON public.newsletter_followers;

-- Recreate using the security definer function
CREATE POLICY "Users can check own subscription"
ON public.newsletter_followers
FOR SELECT
TO authenticated
USING (email = public.get_auth_email());

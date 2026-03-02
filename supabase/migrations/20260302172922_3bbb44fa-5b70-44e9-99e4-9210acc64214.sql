
-- Fix 1: Restrict profiles SELECT policy
-- Drop the overly permissive "anyone can read all profiles" policy
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Team members can read profiles of other team members
CREATE POLICY "Team members can read teammate profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT tm2.user_id FROM public.team_members tm1
    JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid()
  )
);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Restrict contact_messages INSERT to authenticated users only
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;

CREATE POLICY "Authenticated users can insert contact messages"
ON public.contact_messages FOR INSERT
TO authenticated
WITH CHECK (true);

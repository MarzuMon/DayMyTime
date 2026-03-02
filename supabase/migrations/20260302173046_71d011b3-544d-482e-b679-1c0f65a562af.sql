
-- Fix 1: Restrict admin_settings SELECT to user's own keys + admins
DROP POLICY IF EXISTS "Anyone can read settings" ON public.admin_settings;

CREATE POLICY "Users can read own settings"
ON public.admin_settings FOR SELECT
TO authenticated
USING (
  key LIKE '%_' || auth.uid()::text
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 2: Restrict profiles SELECT (was reverted to USING true)
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Team members can read teammate profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

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

CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

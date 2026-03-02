
-- Remove Pro restriction from team creation
DROP POLICY IF EXISTS "Pro users can create teams" ON public.teams;
CREATE POLICY "Authenticated users can create teams"
ON public.teams FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

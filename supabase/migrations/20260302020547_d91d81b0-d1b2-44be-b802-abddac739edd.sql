
-- Fix: Enforce Pro status check on teams INSERT policy
DROP POLICY "Pro users can create teams" ON public.teams;

CREATE POLICY "Pro users can create teams" ON public.teams
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = owner_id AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_pro = true
  )
);

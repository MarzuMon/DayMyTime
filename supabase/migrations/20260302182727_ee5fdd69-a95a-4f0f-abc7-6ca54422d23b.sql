
-- Allow team owners to update member roles (editor/viewer)
CREATE POLICY "Owners can update members"
ON public.team_members FOR UPDATE
TO authenticated
USING (is_team_owner(auth.uid(), team_id))
WITH CHECK (is_team_owner(auth.uid(), team_id));

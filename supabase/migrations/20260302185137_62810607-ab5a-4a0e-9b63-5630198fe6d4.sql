-- Allow team members to READ schedules of their teammates (viewer + editor)
CREATE POLICY "Team members can view teammate schedules"
ON public.schedules
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT tm2.user_id
    FROM team_members tm1
    JOIN team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid()
  )
);

-- Allow team editors to UPDATE teammate schedules
CREATE POLICY "Team editors can update teammate schedules"
ON public.schedules
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM team_members tm1
    JOIN team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid()
    AND tm1.role = 'editor'
    AND tm2.user_id = schedules.user_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM team_members tm1
    JOIN team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid()
    AND tm1.role = 'editor'
    AND tm2.user_id = schedules.user_id
  )
);
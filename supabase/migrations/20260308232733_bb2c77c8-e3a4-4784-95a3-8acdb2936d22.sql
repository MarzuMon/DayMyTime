
-- Fix contact_messages INSERT policy to not use bare TRUE
DROP POLICY IF EXISTS "Authenticated users can insert contact messages" ON contact_messages;
CREATE POLICY "Authenticated users can insert contact messages"
ON contact_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

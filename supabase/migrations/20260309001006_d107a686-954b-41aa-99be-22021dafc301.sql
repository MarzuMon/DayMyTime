-- Fix self-referral vulnerability
DROP POLICY IF EXISTS "Users can insert own referral signups" ON referral_signups;

CREATE POLICY "Users can insert own referral signups"
ON referral_signups FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = referred_user_id 
  AND NOT EXISTS (
    SELECT 1 FROM referral_codes rc 
    WHERE rc.id = referral_code_id AND rc.user_id = auth.uid()
  )
);
-- ============================================
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- Fix all RESTRICTIVE policies to PERMISSIVE
-- Add strict subscription protection
-- ============================================

-- ===========================================
-- 1. FIX SUBSCRIPTIONS TABLE (CRITICAL)
-- Only backend/service role can modify
-- ===========================================
DROP POLICY IF EXISTS "Users can read own subscriptions" ON subscriptions;

CREATE POLICY "Users can read own subscriptions"
ON subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- ===========================================
-- 2. FIX ADMIN_SETTINGS (PERMISSIVE)
-- ===========================================
DROP POLICY IF EXISTS "Admins can manage settings" ON admin_settings;
DROP POLICY IF EXISTS "Users can read own settings" ON admin_settings;

CREATE POLICY "Admins can manage settings"
ON admin_settings FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can read own settings"
ON admin_settings FOR SELECT TO authenticated
USING (key LIKE '%_' || auth.uid()::text OR has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- 3. FIX CONTACT_MESSAGES (PERMISSIVE)
-- ===========================================
DROP POLICY IF EXISTS "Authenticated users can insert contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Only admins can read contact messages" ON contact_messages;

CREATE POLICY "Authenticated users can insert contact messages"
ON contact_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can read contact messages"
ON contact_messages FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- 4. FIX DAILY_REPORTS (PERMISSIVE)
-- ===========================================
DROP POLICY IF EXISTS "Service can manage reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can read own reports" ON daily_reports;

CREATE POLICY "Users can manage own reports"
ON daily_reports FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- 5. FIX PROFILES (PERMISSIVE)
-- ===========================================
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Team members can read teammate profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team members can read teammate profiles"
ON profiles FOR SELECT TO authenticated
USING (id IN (
  SELECT tm2.user_id FROM team_members tm1
  JOIN team_members tm2 ON tm1.team_id = tm2.team_id
  WHERE tm1.user_id = auth.uid()
));

-- ===========================================
-- 6. FIX PROMOTIONS (PERMISSIVE + AUTH REQUIRED)
-- ===========================================
DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;
DROP POLICY IF EXISTS "Authenticated users can read active promotions" ON promotions;

CREATE POLICY "Admins can manage promotions"
ON promotions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read active promotions"
ON promotions FOR SELECT TO authenticated
USING (is_active = true);

-- ===========================================
-- 7. FIX REFERRAL_CODES (PERMISSIVE)
-- ===========================================
DROP POLICY IF EXISTS "Admins can read all referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Users can create own referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Users can read own referral codes" ON referral_codes;

CREATE POLICY "Users can read own referral codes"
ON referral_codes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral codes"
ON referral_codes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all referral codes"
ON referral_codes FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- 8. FIX REFERRAL_SIGNUPS (PERMISSIVE)
-- ===========================================
DROP POLICY IF EXISTS "Admins can read all referral signups" ON referral_signups;
DROP POLICY IF EXISTS "Anyone can insert referral signups" ON referral_signups;
DROP POLICY IF EXISTS "Code owners can read their referral signups" ON referral_signups;

CREATE POLICY "Users can insert own referral signups"
ON referral_signups FOR INSERT TO authenticated
WITH CHECK (auth.uid() = referred_user_id);

CREATE POLICY "Code owners can read their referral signups"
ON referral_signups FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM referral_codes rc
  WHERE rc.id = referral_signups.referral_code_id AND rc.user_id = auth.uid()
));

CREATE POLICY "Admins can read all referral signups"
ON referral_signups FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- 9. FIX SCHEDULES (PERMISSIVE)
-- ===========================================
DROP POLICY IF EXISTS "Team editors can update teammate schedules" ON schedules;
DROP POLICY IF EXISTS "Team members can view teammate schedules" ON schedules;
DROP POLICY IF EXISTS "Users can CRUD own schedules" ON schedules;

CREATE POLICY "Users can CRUD own schedules"
ON schedules FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can view teammate schedules"
ON schedules FOR SELECT TO authenticated
USING (user_id IN (
  SELECT tm2.user_id FROM team_members tm1
  JOIN team_members tm2 ON tm1.team_id = tm2.team_id
  WHERE tm1.user_id = auth.uid()
));

CREATE POLICY "Team editors can update teammate schedules"
ON schedules FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM team_members tm1
  JOIN team_members tm2 ON tm1.team_id = tm2.team_id
  WHERE tm1.user_id = auth.uid() AND tm1.role = 'editor' AND tm2.user_id = schedules.user_id
))
WITH CHECK (EXISTS (
  SELECT 1 FROM team_members tm1
  JOIN team_members tm2 ON tm1.team_id = tm2.team_id
  WHERE tm1.user_id = auth.uid() AND tm1.role = 'editor' AND tm2.user_id = schedules.user_id
));

-- ===========================================
-- 10. FIX TEAM_INVITATIONS (PERMISSIVE + SECURE)
-- ===========================================
DROP POLICY IF EXISTS "Owners can manage invitations" ON team_invitations;
DROP POLICY IF EXISTS "Team owners can read invitations" ON team_invitations;
DROP POLICY IF EXISTS "Invited users can read own invitations" ON team_invitations;

CREATE POLICY "Owners can manage invitations"
ON team_invitations FOR ALL TO authenticated
USING (is_team_owner(auth.uid(), team_id))
WITH CHECK (is_team_owner(auth.uid(), team_id));

CREATE POLICY "Invited users can read own invitations"
ON team_invitations FOR SELECT TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  OR is_team_owner(auth.uid(), team_id)
);

-- ===========================================
-- 11. FIX TEAM_MEMBERS (PERMISSIVE)
-- ===========================================
DROP POLICY IF EXISTS "Members can read team members" ON team_members;
DROP POLICY IF EXISTS "Owners can add members with invitation" ON team_members;
DROP POLICY IF EXISTS "Owners can update members" ON team_members;
DROP POLICY IF EXISTS "Owners or self can remove members" ON team_members;
DROP POLICY IF EXISTS "Users can join via verified invitation" ON team_members;

CREATE POLICY "Members can read team members"
ON team_members FOR SELECT TO authenticated
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Owners can add members with invitation"
ON team_members FOR INSERT TO authenticated
WITH CHECK (
  is_team_owner(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM team_invitations
    WHERE team_invitations.team_id = team_members.team_id
    AND team_invitations.status = 'pending'
    AND team_invitations.expires_at > now()
    AND (
      team_invitations.email = (SELECT email FROM auth.users WHERE id = team_members.user_id)::text
      OR team_invitations.email LIKE 'invite-link-%@link.daymytime.com'
    )
  )
);

CREATE POLICY "Users can join via verified invitation"
ON team_members FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM team_invitations
    WHERE team_invitations.team_id = team_members.team_id
    AND team_invitations.status = 'pending'
    AND team_invitations.expires_at > now()
    AND (
      team_invitations.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
      OR team_invitations.email LIKE 'invite-link-%@link.daymytime.com'
    )
  )
);

CREATE POLICY "Owners can update members"
ON team_members FOR UPDATE TO authenticated
USING (is_team_owner(auth.uid(), team_id))
WITH CHECK (is_team_owner(auth.uid(), team_id));

CREATE POLICY "Owners or self can remove members"
ON team_members FOR DELETE TO authenticated
USING (is_team_owner(auth.uid(), team_id) OR auth.uid() = user_id);

-- ===========================================
-- 12. FIX TEAMS (PERMISSIVE)
-- ===========================================
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
DROP POLICY IF EXISTS "Members can read teams" ON teams;
DROP POLICY IF EXISTS "Owners can delete teams" ON teams;
DROP POLICY IF EXISTS "Owners can update teams" ON teams;

CREATE POLICY "Authenticated users can create teams"
ON teams FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Members can read teams"
ON teams FOR SELECT TO authenticated
USING (is_team_member(auth.uid(), id) OR owner_id = auth.uid());

CREATE POLICY "Owners can update teams"
ON teams FOR UPDATE TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete teams"
ON teams FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

-- ===========================================
-- 13. FIX USER_ROLES (PERMISSIVE)
-- ===========================================
DROP POLICY IF EXISTS "Only admins can assign roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can modify roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can revoke roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;

CREATE POLICY "Users can read own roles"
ON user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can assign roles"
ON user_roles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can modify roles"
ON user_roles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can revoke roles"
ON user_roles FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
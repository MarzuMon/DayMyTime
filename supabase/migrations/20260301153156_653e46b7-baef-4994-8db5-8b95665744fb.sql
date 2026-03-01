
-- Add default_alarm_tone to profiles
ALTER TABLE profiles ADD COLUMN default_alarm_tone text NOT NULL DEFAULT 'default';

-- Create subscriptions table for Pro payments
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'active',
  razorpay_payment_id text,
  razorpay_order_id text,
  razorpay_subscription_id text,
  amount integer NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service can update subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Create teams table
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create team_members table
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_team_owner(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = _team_id AND owner_id = _user_id
  )
$$;

-- Teams RLS
CREATE POLICY "Members can read teams" ON teams FOR SELECT USING (
  public.is_team_member(auth.uid(), id) OR owner_id = auth.uid()
);
CREATE POLICY "Pro users can create teams" ON teams FOR INSERT WITH CHECK (
  auth.uid() = owner_id
);
CREATE POLICY "Owners can update teams" ON teams FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete teams" ON teams FOR DELETE USING (auth.uid() = owner_id);

-- Team members RLS
CREATE POLICY "Members can read team members" ON team_members FOR SELECT USING (
  public.is_team_member(auth.uid(), team_id)
);
CREATE POLICY "Owners can add members" ON team_members FOR INSERT WITH CHECK (
  public.is_team_owner(auth.uid(), team_id)
);
CREATE POLICY "Owners or self can remove members" ON team_members FOR DELETE USING (
  public.is_team_owner(auth.uid(), team_id) OR auth.uid() = user_id
);

-- Function to auto-expire subscriptions and downgrade users
CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark expired subscriptions
  UPDATE subscriptions SET status = 'expired'
  WHERE status = 'active' AND expires_at < now();
  
  -- Downgrade users with no active subscription
  UPDATE profiles SET is_pro = false
  WHERE is_pro = true
    AND id NOT IN (SELECT user_id FROM subscriptions WHERE status = 'active')
    AND id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin');
END;
$$;

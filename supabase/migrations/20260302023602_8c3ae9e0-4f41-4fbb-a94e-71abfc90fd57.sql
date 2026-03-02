
-- 1. Team invitations table
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(team_id, email)
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Team owners can manage invitations
CREATE POLICY "Owners can manage invitations"
  ON public.team_invitations FOR ALL
  USING (is_team_owner(auth.uid(), team_id))
  WITH CHECK (is_team_owner(auth.uid(), team_id));

-- Invited users can read their invitations by email (via edge function with service role)
CREATE POLICY "Users can read own invitations"
  ON public.team_invitations FOR SELECT
  USING (true);

-- 2. Add branding columns to teams
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#6366f1';
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL;

-- 3. Custom tones storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('custom-tones', 'custom-tones', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for custom-tones
CREATE POLICY "Users can upload own tones"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'custom-tones' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own tones"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'custom-tones' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own tones"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'custom-tones' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Add custom_tones column to profiles for storing uploaded tone metadata
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_tones jsonb DEFAULT '[]'::jsonb;

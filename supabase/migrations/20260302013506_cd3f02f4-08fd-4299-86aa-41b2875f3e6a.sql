
CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'referral',
  target_signups integer NOT NULL DEFAULT 20,
  reward_days integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active promotions" ON public.promotions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage promotions" ON public.promotions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Also need a policy so admins can read all referral data for leaderboard
CREATE POLICY "Admins can read all referral codes" ON public.referral_codes
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read all referral signups" ON public.referral_signups
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));


CREATE TABLE public.daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_date date NOT NULL,
  total_schedules integer NOT NULL DEFAULT 0,
  completed_schedules integer NOT NULL DEFAULT 0,
  pending_schedules integer NOT NULL DEFAULT 0,
  category_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  focus_minutes integer NOT NULL DEFAULT 0,
  productivity_score numeric(5,2) NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, report_date)
);

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reports"
  ON public.daily_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON public.daily_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service can manage reports"
  ON public.daily_reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

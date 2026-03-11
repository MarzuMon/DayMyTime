
-- Table to track per-date completion for repeating schedules
CREATE TABLE public.schedule_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES public.schedules(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  completion_date date NOT NULL,
  is_completed boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(schedule_id, completion_date)
);

ALTER TABLE public.schedule_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own completions"
  ON public.schedule_completions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_completions;

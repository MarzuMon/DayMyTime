CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  normalized_text text NOT NULL,
  domain text NOT NULL DEFAULT 'OTHERS',
  module text DEFAULT '',
  screenshot_url text,
  source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'approved',
  submitted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX questions_normalized_text_key ON public.questions(normalized_text);
CREATE INDEX questions_created_at_idx ON public.questions(created_at DESC);
CREATE INDEX questions_domain_idx ON public.questions(domain);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read questions"
  ON public.questions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can submit questions"
  ON public.questions FOR INSERT TO anon, authenticated
  WITH CHECK (length(question) BETWEEN 5 AND 5000 AND length(normalized_text) >= 5);

CREATE POLICY "Admins can update questions"
  ON public.questions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.touch_questions_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_touch_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.touch_questions_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view question images"
  ON storage.objects FOR SELECT USING (bucket_id = 'question-images');

CREATE POLICY "Anyone can upload question images"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'question-images');
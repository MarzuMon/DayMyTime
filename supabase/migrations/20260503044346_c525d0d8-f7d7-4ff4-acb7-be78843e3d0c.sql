-- Edit proposals for community-powered question editing
CREATE TABLE public.question_edit_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  proposed_question text NOT NULL,
  proposed_normalized_text text NOT NULL,
  proposed_domain text NOT NULL DEFAULT 'OTHERS',
  proposed_module text DEFAULT '',
  reason text DEFAULT '',
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  submitted_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  admin_note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_qep_question ON public.question_edit_proposals(question_id);
CREATE INDEX idx_qep_status_created ON public.question_edit_proposals(status, created_at DESC);

ALTER TABLE public.question_edit_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read edit proposals"
  ON public.question_edit_proposals FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can submit edit proposals"
  ON public.question_edit_proposals FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(proposed_question) >= 5
    AND length(proposed_question) <= 5000
    AND length(proposed_normalized_text) >= 5
    AND status = 'pending'
  );

CREATE POLICY "Admins can update edit proposals"
  ON public.question_edit_proposals FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete edit proposals"
  ON public.question_edit_proposals FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Touch updated_at
CREATE TRIGGER touch_qep_updated_at
  BEFORE UPDATE ON public.question_edit_proposals
  FOR EACH ROW EXECUTE FUNCTION public.touch_questions_updated_at();

-- Apply an approved proposal atomically (admin-only)
CREATE OR REPLACE FUNCTION public.apply_question_edit_proposal(_proposal_id uuid, _admin_note text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _p public.question_edit_proposals%ROWTYPE;
  _dup_id uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can apply edit proposals';
  END IF;

  SELECT * INTO _p FROM public.question_edit_proposals WHERE id = _proposal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Proposal not found'; END IF;
  IF _p.status <> 'pending' THEN RAISE EXCEPTION 'Proposal is not pending'; END IF;

  -- Reject if normalized_text would collide with another existing question
  SELECT id INTO _dup_id FROM public.questions
    WHERE normalized_text = _p.proposed_normalized_text AND id <> _p.question_id
    LIMIT 1;
  IF _dup_id IS NOT NULL THEN
    RAISE EXCEPTION 'Proposed text duplicates another existing question';
  END IF;

  UPDATE public.questions
     SET question = _p.proposed_question,
         normalized_text = _p.proposed_normalized_text,
         domain = _p.proposed_domain,
         module = COALESCE(_p.proposed_module, ''),
         status = 'approved',
         updated_at = now()
   WHERE id = _p.question_id;

  UPDATE public.question_edit_proposals
     SET status = 'approved',
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         admin_note = COALESCE(_admin_note, '')
   WHERE id = _proposal_id;
END;
$$;
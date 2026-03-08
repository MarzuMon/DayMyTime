
ALTER TABLE public.schedules 
ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL DEFAULT NULL,
ADD COLUMN repeat_days jsonb DEFAULT NULL;

COMMENT ON COLUMN public.schedules.team_id IS 'Optional team assignment for team category schedules';
COMMENT ON COLUMN public.schedules.repeat_days IS 'Array of day numbers (0=Sun..6=Sat) for custom repeat';

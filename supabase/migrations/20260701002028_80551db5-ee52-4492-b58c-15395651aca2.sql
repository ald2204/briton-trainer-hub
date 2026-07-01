
CREATE TABLE public.trainers (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.trainer_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id TEXT NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trainer_id, snapshot_date)
);

CREATE INDEX trainer_versions_trainer_date_idx
  ON public.trainer_versions (trainer_id, snapshot_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainers TO anon, authenticated;
GRANT ALL ON public.trainers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_versions TO anon, authenticated;
GRANT ALL ON public.trainer_versions TO service_role;

ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open read trainers" ON public.trainers FOR SELECT USING (true);
CREATE POLICY "Open insert trainers" ON public.trainers FOR INSERT WITH CHECK (true);
CREATE POLICY "Open update trainers" ON public.trainers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Open delete trainers" ON public.trainers FOR DELETE USING (true);

CREATE POLICY "Open read versions" ON public.trainer_versions FOR SELECT USING (true);
CREATE POLICY "Open insert versions" ON public.trainer_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Open update versions" ON public.trainer_versions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Open delete versions" ON public.trainer_versions FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.snapshot_trainer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  INSERT INTO public.trainer_versions (trainer_id, snapshot_date, data, updated_at)
  VALUES (NEW.id, CURRENT_DATE, NEW.data, now())
  ON CONFLICT (trainer_id, snapshot_date)
  DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trainers_snapshot
BEFORE INSERT OR UPDATE ON public.trainers
FOR EACH ROW EXECUTE FUNCTION public.snapshot_trainer();

ALTER PUBLICATION supabase_realtime ADD TABLE public.trainers;
ALTER TABLE public.trainers REPLICA IDENTITY FULL;

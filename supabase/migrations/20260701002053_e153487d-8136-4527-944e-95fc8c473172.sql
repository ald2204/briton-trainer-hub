
CREATE OR REPLACE FUNCTION public.snapshot_trainer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
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

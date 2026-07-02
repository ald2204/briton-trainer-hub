GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainers TO authenticated;
GRANT ALL ON public.trainers TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_versions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_versions TO authenticated;
GRANT ALL ON public.trainer_versions TO service_role;

DROP TRIGGER IF EXISTS trainers_snapshot ON public.trainers;
DROP TRIGGER IF EXISTS trainers_set_updated_at ON public.trainers;

CREATE OR REPLACE FUNCTION public.set_trainer_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.snapshot_trainer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.trainer_versions (trainer_id, snapshot_date, data, updated_at)
  VALUES (NEW.id, CURRENT_DATE, NEW.data, now())
  ON CONFLICT (trainer_id, snapshot_date)
  DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trainers_set_updated_at
BEFORE UPDATE ON public.trainers
FOR EACH ROW
EXECUTE FUNCTION public.set_trainer_updated_at();

CREATE TRIGGER trainers_snapshot
AFTER INSERT OR UPDATE ON public.trainers
FOR EACH ROW
EXECUTE FUNCTION public.snapshot_trainer();
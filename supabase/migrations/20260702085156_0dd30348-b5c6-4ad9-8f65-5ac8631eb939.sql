GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainers TO anon, authenticated;
GRANT ALL ON public.trainers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_versions TO anon, authenticated;
GRANT ALL ON public.trainer_versions TO service_role;
ALTER TABLE public.trainers REPLICA IDENTITY FULL;
ALTER TABLE public.trainer_versions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trainer_versions;
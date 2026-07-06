-- Allow trainers to update their own record (matched by email), keep admin full control
DROP POLICY IF EXISTS "Admins can update trainers" ON public.trainers;

CREATE POLICY "Admins or owner can update trainers"
ON public.trainers
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR lower(coalesce(data->>'email', '')) = lower(coalesce(auth.jwt()->>'email', ''))
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR lower(coalesce(data->>'email', '')) = lower(coalesce(auth.jwt()->>'email', ''))
);
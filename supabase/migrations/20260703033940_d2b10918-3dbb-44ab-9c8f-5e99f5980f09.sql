
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Security definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Lock down trainers: anyone can read, only admins can write
DROP POLICY IF EXISTS "Open delete trainers" ON public.trainers;
DROP POLICY IF EXISTS "Open insert trainers" ON public.trainers;
DROP POLICY IF EXISTS "Open read trainers"   ON public.trainers;
DROP POLICY IF EXISTS "Open update trainers" ON public.trainers;

CREATE POLICY "Anyone can read trainers"
  ON public.trainers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert trainers"
  ON public.trainers FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update trainers"
  ON public.trainers FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trainers"
  ON public.trainers FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Lock down trainer_versions similarly (snapshots written by trigger run as owner, unaffected)
DROP POLICY IF EXISTS "Open delete versions" ON public.trainer_versions;
DROP POLICY IF EXISTS "Open insert versions" ON public.trainer_versions;
DROP POLICY IF EXISTS "Open read versions"   ON public.trainer_versions;
DROP POLICY IF EXISTS "Open update versions" ON public.trainer_versions;

CREATE POLICY "Anyone can read versions"
  ON public.trainer_versions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert versions"
  ON public.trainer_versions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update versions"
  ON public.trainer_versions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete versions"
  ON public.trainer_versions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Revoke anon write privileges (RLS blocks, but tighten grants too)
REVOKE INSERT, UPDATE, DELETE ON public.trainers FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.trainer_versions FROM anon;


-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Convenience function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Briefs table (public submissions)
CREATE TABLE public.briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  empresa TEXT,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  tipo_locucao TEXT NOT NULL,
  texto TEXT NOT NULL,
  tom TEXT,
  regiao TEXT,
  periodo TEXT,
  status TEXT NOT NULL DEFAULT 'recebido',
  pago BOOLEAN NOT NULL DEFAULT false,
  audio_url TEXT,
  audio_filename TEXT,
  hash_sha256 TEXT,
  numero_certificado TEXT UNIQUE,
  certificado_url TEXT,
  qr_code_url TEXT,
  brief_recebido BOOLEAN NOT NULL DEFAULT true,
  audio_entregue BOOLEAN NOT NULL DEFAULT false,
  certificado_gerado BOOLEAN NOT NULL DEFAULT false,
  enviado_cliente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

-- Sequence for certificate numbers
CREATE SEQUENCE public.cert_seq START 1;

-- RLS Policies

-- user_roles: only admins can read
CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

-- profiles: users can read own, admins can read all
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- briefs: anyone can insert (public form), only admins can read/update/delete
CREATE POLICY "Anyone can submit brief"
  ON public.briefs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read all briefs"
  ON public.briefs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update briefs"
  ON public.briefs FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete briefs"
  ON public.briefs FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Public certificate verification (anon can read specific fields via function)
CREATE OR REPLACE FUNCTION public.verify_certificate(cert_number TEXT)
RETURNS TABLE (
  numero_certificado TEXT,
  nome TEXT,
  empresa TEXT,
  tipo_locucao TEXT,
  hash_sha256 TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    b.numero_certificado,
    b.nome,
    b.empresa,
    b.tipo_locucao,
    b.hash_sha256,
    CASE WHEN b.certificado_gerado THEN 'Válido' ELSE 'Pendente' END AS status,
    b.created_at
  FROM public.briefs b
  WHERE b.numero_certificado = cert_number
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_briefs_updated_at
  BEFORE UPDATE ON public.briefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-files', 'audio-files', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true);

-- Storage policies
CREATE POLICY "Admins can upload audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'audio-files' AND public.is_admin());

CREATE POLICY "Admins can read audio"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'audio-files' AND public.is_admin());

CREATE POLICY "Anyone can read certificates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

CREATE POLICY "Admins can upload certificates"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'certificates' AND public.is_admin());

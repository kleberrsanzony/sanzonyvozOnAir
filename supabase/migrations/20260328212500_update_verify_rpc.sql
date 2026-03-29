-- Update verify_certificate to include audio_url
-- Drop existing function first because we are changing the return type
DROP FUNCTION IF EXISTS public.verify_certificate(TEXT);

CREATE OR REPLACE FUNCTION public.verify_certificate(cert_number TEXT)
RETURNS TABLE (
  numero_certificado TEXT,
  nome TEXT,
  empresa TEXT,
  tipo_locucao TEXT,
  hash_sha256 TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  audio_url TEXT
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
    b.created_at,
    b.audio_url
  FROM public.briefs b
  WHERE b.numero_certificado = cert_number
$$;

-- Make audio-files bucket public so visitors can hear the certified audio
UPDATE storage.buckets SET public = true WHERE id = 'audio-files';

-- Allow public to read audio files
DROP POLICY IF EXISTS "Anyone can read audio files" ON storage.objects;
CREATE POLICY "Anyone can read audio files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio-files');

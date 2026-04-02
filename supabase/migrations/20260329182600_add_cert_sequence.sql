-- Sequência para numeração de certificados
CREATE SEQUENCE IF NOT EXISTS public.cert_seq START WITH 10;

-- Remover função anterior para evitar conflito de tipo de retorno
DROP FUNCTION IF EXISTS public.nextval_cert_seq();

-- Função RPC para pegar o próximo número
CREATE OR REPLACE FUNCTION public.nextval_cert_seq()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN nextval('public.cert_seq')::int;
END;
$$;

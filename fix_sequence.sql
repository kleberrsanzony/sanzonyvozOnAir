-- Criar a sequência se não existir
CREATE SEQUENCE IF NOT EXISTS cert_seq START 10;

-- Criar a função RPC que o código chama
CREATE OR REPLACE FUNCTION nextval_cert_seq()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN nextval('cert_seq')::int;
END;
$$;

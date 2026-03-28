
-- Function to get next certificate sequence value
CREATE OR REPLACE FUNCTION public.nextval_cert_seq()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nextval('public.cert_seq')
$$;

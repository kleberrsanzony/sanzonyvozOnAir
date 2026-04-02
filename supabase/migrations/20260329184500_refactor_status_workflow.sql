-- Migração para novo fluxo status linear
-- Data: 2026-03-29

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'brief_status') THEN
        CREATE TYPE brief_status AS ENUM (
            'recebido', 
            'visualizado', 
            'negociacao', 
            'aguardando_pagamento', 
            'fila_producao', 
            'em_producao', 
            'em_revisao', 
            'pronto_envio', 
            'entregue'
        );
    END IF;
END $$;

-- 1. Verificamos se a coluna 'status' já existe e se é compatível, senão criamos uma nova ou convertemos
-- No nosso caso, 'status' já é TEXT, vamos atualizá-lo e adicionar uma CHECK CONSTRAINT se necessário.
-- Mas vamos migrar os dados baseados nos booleans primeiro.

-- Mapeamento de retrocompatibilidade
UPDATE public.briefs 
SET status = 'entregue' 
WHERE enviado_cliente = true;

UPDATE public.briefs 
SET status = 'pronto_envio' 
WHERE audio_entregue = true AND enviado_cliente = false;

UPDATE public.briefs 
SET status = 'fila_producao' 
WHERE pago = true AND audio_entregue = false AND enviado_cliente = false;

-- Garantir um status padrão para os que restarem
UPDATE public.briefs 
SET status = 'recebido' 
WHERE status NOT IN ('entregue', 'pronto_envio', 'fila_producao', 'recebido', 'visualizado', 'negociacao', 'aguardando_pagamento', 'em_producao', 'em_revisao');

-- Adicionar a check constraint para garantir integridade
ALTER TABLE public.briefs 
DROP CONSTRAINT IF EXISTS briefs_status_check;

ALTER TABLE public.briefs 
ADD CONSTRAINT briefs_status_check 
CHECK (status IN (
    'recebido', 
    'visualizado', 
    'negociacao', 
    'aguardando_pagamento', 
    'fila_producao', 
    'em_producao', 
    'em_revisao', 
    'pronto_envio', 
    'entregue'
));

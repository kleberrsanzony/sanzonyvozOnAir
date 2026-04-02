-- Update qr_code_url and any mentions of Lovable to the new domain
UPDATE public.briefs 
SET qr_code_url = REPLACE(qr_code_url, 'https://sanzo-voice-certify.lovable.app', 'https://sanzonyvoz.com.br')
WHERE qr_code_url LIKE '%lovable.app%';

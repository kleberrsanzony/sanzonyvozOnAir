import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const NEW_URL = "https://eazwewzslriqzzvjwpjh.supabase.co";
const NEW_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhendld3pzbHJpcXp6dmp3cGpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgwNDU3NiwiZXhwIjoyMDkwMzgwNTc2fQ.4cUGBfrlXATqblQ0KwoJ5EoqtCcioipbe5BvrdncTf4";
const OLD_STORAGE_PUBLIC_BASE = "https://wvlcmcpsiuplwqcceryu.supabase.co/storage/v1/object/public/";

const supabase = createClient(NEW_URL, NEW_SERVICE_KEY);

async function downloadAndUpload(oldUrl, bucket, path) {
  try {
    const encodedUrl = encodeURI(oldUrl);
    console.log(`› Baixando: ${encodedUrl}`);
    const res = await fetch(encodedUrl);
    if (!res.ok) throw new Error(`Falha ao baixar: ${res.statusText}`);
    const buffer = await res.arrayBuffer();

    console.log(`› Enviando para bucket '${bucket}': ${path}`);
    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      upsert: true,
      contentType: oldUrl.endsWith('.pdf') ? 'application/pdf' : 'audio/mpeg'
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`❌ Erro no arquivo ${path}:`, err.message);
    return false;
  }
}

async function start() {
  const csvPath = '/Users/ks/Documents/sanzonyvozOnAir/dadosOld/briefs.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true });

  console.log(`🚀 Iniciando migração de ${records.length} registros...`);

  for (const record of records) {
    console.log(`\n📦 Processando: ${record.numero_certificado} (${record.nome})`);

    // 1. Migrar Áudio
    if (record.audio_url) {
      const oldAudioUrl = `${OLD_STORAGE_PUBLIC_BASE}audio-files/${record.audio_url}`;
      await downloadAndUpload(oldAudioUrl, 'audio-files', record.audio_url);
    }

    // 2. Migrar Certificado (PDF)
    if (record.certificado_url) {
      // O link no CSV é a URL pública completa. 
      // Ex: https://.../storage/v1/object/public/certificates/pdf/SVZ-2026-02-010.pdf
      // Extrair o caminho relativo: pdf/SVZ-2026-02-010.pdf
      const pathPart = record.certificado_url.split('/public/certificates/')[1];
      if (pathPart) {
        await downloadAndUpload(record.certificado_url, 'certificates', pathPart);
        // Atualizar URL para o novo banco
        record.certificado_url = `${NEW_URL}/storage/v1/object/public/certificates/${pathPart}`;
      }
    }

    // 3. Limpar QR Code URL (deve apontar para o novo endereço se houver)
    if (record.qr_code_url) {
        // Assume que a URL era algo como lovable/verificar/...
        // Vamos manter o que está ou atualizar se necessário, mas o principal é o PDF
    }

    // 4. Inserir no Novo Banco
    console.log(`› Salvando registro no banco de dados...`);
    const { error: dbError } = await supabase.from('briefs').upsert(record);
    
    if (dbError) {
      console.error(`❌ Erro ao salvar briefing ${record.numero_certificado}:`, dbError.message);
    } else {
      console.log(`✅ Briefing ${record.numero_certificado} migrado com sucesso!`);
    }
  }

  console.log("\n🏁 Migração finalizada!");
}

start();

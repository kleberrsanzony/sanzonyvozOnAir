// =============================================================================
// WHATSAPP SERVICE — Sanzony.Voz
//
// Architecture: Provider-agnostic with structured telemetry.
// - buildDeliveryMessage() builds the text template.
// - sendViaLink()         opens a wa.me URL (manual fallback).
// - autoSend()            calls Evolution API v2 (/message/sendText).
// - sendPtt()             sends audio as a WhatsApp voice message.
//
// Integration: Evolution API v2 (Local or Cloud)
// =============================================================================

const API_URL = import.meta.env.VITE_EVOLUTION_API_URL;
const API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY;
const INSTANCE = import.meta.env.VITE_EVOLUTION_INSTANCE_NAME;

/**
 * Structured Logger following Sanzony Telemetry standards.
 */
const sanzonyLogger = {
  log: (severity: 'info' | 'warn' | 'error', context: string, message: string, data?: any) => {
    const payload = {
      timestamp: new Date().toISOString(),
      severity,
      context,
      message,
      ...(data && { data }),
      brand: 'Sanzony.Voz™'
    };
    if (severity === 'error') {
      console.error(JSON.stringify(payload, null, 2));
    } else {
      console.log(JSON.stringify(payload, null, 2));
    }
  }
};

export interface DeliveryPayload {
  nome: string;
  whatsapp: string;
  numero_certificado: string | null;
  certificado_url?: string | null;
  audio_url?: string | null;
}

export interface SendResult {
  success: boolean;
  url?: string;
  error?: string;
  humanMessage?: string;
}

// -----------------------------------------------------------------------------
// Message Builder — pure function
// -----------------------------------------------------------------------------
export const buildDeliveryMessage = (payload: DeliveryPayload): string => {
  const { nome, numero_certificado, certificado_url } = payload;
  const verifyUrl = numero_certificado
    ? `https://sanzonyvoz.com.br/verificar/${numero_certificado}`
    : null;

  const lines: string[] = [
    `Olá, ${nome}! 🎙️`,
    ``,
    `Seu áudio locutado pela *Sanzony.Voz™* está pronto e foi entregue com sucesso!`,
    ``,
  ];

  if (numero_certificado && verifyUrl) {
    lines.push(`✅ *Certificado de Autenticidade*`);
    lines.push(`Nº: ${numero_certificado}`);
    lines.push(`🔗 Verifique em: ${verifyUrl}`);
    lines.push(``);
  }

  lines.push(`Foi um prazer trabalhar com você. Qualquer dúvida, é só falar!`);
  lines.push(`— Equipe Sanzony.Voz™`);

  return lines.join('\n');
};

// -----------------------------------------------------------------------------
// Validation helper
// -----------------------------------------------------------------------------
export const isValidWhatsApp = (whatsapp: string | null | undefined): boolean => {
  if (!whatsapp) return false;
  const digits = whatsapp.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

// -----------------------------------------------------------------------------
// Provider: Link (manual click) — fallback
// -----------------------------------------------------------------------------
export const sendViaLink = (payload: DeliveryPayload): SendResult => {
  if (!isValidWhatsApp(payload.whatsapp)) {
    return {
      success: false,
      error: 'WhatsApp inválido',
      humanMessage: 'O número de WhatsApp informado parece estar incompleto.'
    };
  }
  const cleanNumber = payload.whatsapp.replace(/\D/g, '');
  const message = buildDeliveryMessage(payload);
  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  return { success: true, url };
};

// -----------------------------------------------------------------------------
// JID Normalization — Crucial for v1.6.1+ and Brazilian 9th digit
// -----------------------------------------------------------------------------
const normalizeJID = (whatsapp: string): string => {
  let cleanNumber = whatsapp.replace(/\D/g, '');

  if (cleanNumber.length === 10 || cleanNumber.length === 11) {
    cleanNumber = `55${cleanNumber}`;
  }

  /**
   * REGRA DE OURO SANZONY: Trata o dígito 9 do Brasil para JIDs legados da v2
   */
  if (cleanNumber.startsWith('55') && cleanNumber.length === 13) {
    const part1 = cleanNumber.substring(0, 4); // 55 + DDD
    const part2 = cleanNumber.substring(5);    // Os 8 dígitos finais
    cleanNumber = `${part1}${part2}`;
  }

  return cleanNumber.includes('@') ? cleanNumber : `${cleanNumber}@s.whatsapp.net`;
};

// -----------------------------------------------------------------------------
// Provider: Auto Send — Evolution API v2
// -----------------------------------------------------------------------------
export const autoSend = async (payload: DeliveryPayload): Promise<SendResult> => {
  if (!isValidWhatsApp(payload.whatsapp)) {
    return { success: false, error: 'invalid_number', humanMessage: 'Número de WhatsApp ausente ou inválido.' };
  }

  if (!API_URL || !API_KEY || !INSTANCE) {
    sanzonyLogger.log('error', 'whatsappService.autoSend', 'Configuração de API ausente', { API_URL, INSTANCE });
    return { success: false, error: 'config_missing', humanMessage: 'A configuração de envio automático não foi detectada.' };
  }

  const jid = normalizeJID(payload.whatsapp);
  const endpoint = `${API_URL}/message/sendText/${INSTANCE}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
      body: JSON.stringify({
        number: jid,
        text: buildDeliveryMessage(payload),
        delay: 1200,
        linkPreview: true,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Erro ${response.status}: Falha no envio.`);
    }

    sanzonyLogger.log('info', 'whatsappService.autoSend', 'Mensagem enviada com sucesso', { jid });
    return { success: true };
  } catch (error: any) {
    sanzonyLogger.log('error', 'whatsappService.autoSend', 'Falha no envio automático', { error: error.message });
    return { success: false, error: error.message, humanMessage: 'Não conseguimos enviar a mensagem automática. Tente o envio via link.' };
  }
};

/**
 * Sends the audio file as a WhatsApp Voice Message (PTT).
 */
export const sendPtt = async (payload: DeliveryPayload): Promise<SendResult> => {
  if (!payload.audio_url || !isValidWhatsApp(payload.whatsapp)) {
    return { success: false, error: 'invalid_data', humanMessage: 'Arquivo de áudio ou número inválido.' };
  }

  const jid = normalizeJID(payload.whatsapp);
  const SYB_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://eazwewzslriqzzvjwpjh.supabase.co').replace(/\/$/, '');
  const endpoint = `${API_URL}/message/sendMedia/${INSTANCE}`;

  const rawAudioUrl = payload.audio_url.startsWith('http')
    ? payload.audio_url
    : `${SYB_URL}/storage/v1/object/public/audio-files/${payload.audio_url}`;

  const fullAudioUrl = encodeURI(rawAudioUrl);

  try {
    // Tenta extrair o nome original do arquivo da URL (o que vem após a última barra)
    const audioFileName = payload.audio_url.split('/').pop() || 'Locucao_SanzonyVoz.mp3';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
      body: JSON.stringify({
        number: jid,
        mediatype: 'audio', // 'audio' triggers the PTT effect in most v2 installations
        mimetype: 'audio/mpeg',
        media: fullAudioUrl,
        fileName: audioFileName,
        delay: 2000
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Erro ao enviar áudio.');
    }

    sanzonyLogger.log('info', 'whatsappService.sendPtt', 'Áudio PTT enviado com sucesso', { jid });
    return { success: true };
  } catch (error: any) {
    sanzonyLogger.log('error', 'whatsappService.sendPtt', 'Falha ao enviar PTT', { error: error.message });
    return { success: false, error: error.message, humanMessage: 'Ocorreu um problema ao enviar o áudio. O arquivo pode estar indisponível.' };
  }
};

/**
 * Sends a PDF document (Certificate) via WhatsApp.
 */
export const sendDocument = async (payload: DeliveryPayload): Promise<SendResult> => {
  if (!payload.certificado_url || !isValidWhatsApp(payload.whatsapp)) {
    return { success: false, error: 'invalid_doc', humanMessage: 'Certificado não gerado ou número inválido.' };
  }

  const jid = normalizeJID(payload.whatsapp);
  const endpoint = `${API_URL}/message/sendMedia/${INSTANCE}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
      body: JSON.stringify({
        number: jid,
        mediatype: 'document',
        mimetype: 'application/pdf',
        caption: `Certificado de Autenticidade — ${payload.nome}`,
        media: payload.certificado_url,
        fileName: `Certificado_SanzonyVoz_${payload.numero_certificado || 'SVZ'}.pdf`,
        delay: 2000,
      }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Erro ao enviar documento.');

    sanzonyLogger.log('info', 'whatsappService.sendDocument', 'Documento enviado com sucesso', { jid });
    return { success: true };
  } catch (error: any) {
    sanzonyLogger.log('error', 'whatsappService.sendDocument', 'Falha ao enviar documento', { error: error.message });
    return { success: false, error: error.message, humanMessage: 'Não foi possível entregar o certificado PDF automaticamente.' };
  }
};

export const whatsappService = {
  buildDeliveryMessage,
  isValidWhatsApp,
  sendViaLink,
  autoSend,
  sendPtt,
  sendDocument,
  async sendMessage(props: { nome: string; whatsapp: string; numero_certificado: string | null; audio_url?: string }) {
    return sendViaLink(props);
  },
};


// =============================================================================
// WHATSAPP SERVICE — Sanzony.Voz
//
// Architecture: Provider-agnostic.
// - buildDeliveryMessage() builds the text template.
// - sendViaLink()         opens a wa.me URL (current manual flow).
// - autoSend()            calls Evolution API v2 (/message/sendText).
// - sendPtt()             sends audio as a WhatsApp voice message.
//
// Integration: Evolution API v2
// =============================================================================

const API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'https://sanzonyvozonair.fly.dev';
const API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || 'sanzony_voz_master_key_2026';
const INSTANCE_RAW = import.meta.env.VITE_EVOLUTION_INSTANCE_NAME;

// Regra de Autocura: Na v1.6.1 a instância ativa é 'sanzony'. 
// Se a env var estiver vazia ou com o nome antigo 'SanzonyVoz', forçamos a correta.
const INSTANCE = (!INSTANCE_RAW || INSTANCE_RAW === 'SanzonyVoz') ? 'sanzony' : INSTANCE_RAW;

export interface DeliveryPayload {
  nome: string;
  whatsapp: string;
  numero_certificado: string | null;
  certificado_url?: string | null;
  audio_url?: string | null;
}

export interface SendResult {
  success: boolean;
  url?: string;    // returned only for link-based flow
  error?: string;
}

// -----------------------------------------------------------------------------
// Message Builder — pure function, no side effects
// -----------------------------------------------------------------------------
export const buildDeliveryMessage = (payload: DeliveryPayload): string => {
  const { nome, numero_certificado, certificado_url } = payload;
  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const verifyUrl = certificado_url || (numero_certificado ? `${baseOrigin}/verificar/${numero_certificado}` : null);

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
// Provider: Link (manual click) — currently active for web clients
// -----------------------------------------------------------------------------
export const sendViaLink = (payload: DeliveryPayload): SendResult => {
  if (!isValidWhatsApp(payload.whatsapp)) {
    return { success: false, error: 'Número de WhatsApp inválido.' };
  }
  const cleanNumber = payload.whatsapp.replace(/\D/g, '');
  const message = buildDeliveryMessage(payload);
  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  return { success: true, url };
};

// -----------------------------------------------------------------------------
// JID Normalization — Crucial for v1.6.1 and Brazilian 9th digit
// -----------------------------------------------------------------------------
const normalizeJID = (whatsapp: string): string => {
  let cleanNumber = whatsapp.replace(/\D/g, '');

  // Adiciona o prefixo 55 (Brasil) se o número possui apenas DDD + Número
  if (cleanNumber.length === 10 || cleanNumber.length === 11) {
    cleanNumber = `55${cleanNumber}`;
  }

  /**
   * REGRA DE OURO SANZONY: Trata o dígito 9 do Brasil para garantir entrega na v1.6.1
   * Se o número possui 11 dígitos internos (55 + DDD + 9 + 8 dígitos) totalizando 13 caracteres.
   * A v1.6.1 exige o formato JID registrado (muitas vezes sem o 9).
   */
  if (cleanNumber.startsWith('55') && cleanNumber.length === 13) {
    // Tenta remover o dígito 9 abusivo (posição 4 do número limpo)
    const part1 = cleanNumber.substring(0, 4); // 55 + DDD
    const part2 = cleanNumber.substring(5);    // Os 8 dígitos finais
    cleanNumber = `${part1}${part2}`;
  }

  // Garante o sufixo oficial JID para a v1.6.1
  return cleanNumber.includes('@') ? cleanNumber : `${cleanNumber}@s.whatsapp.net`;
};

// -----------------------------------------------------------------------------
// Provider: Auto Send — abstracted for future API integration
// -----------------------------------------------------------------------------
export const autoSend = async (payload: DeliveryPayload): Promise<SendResult> => {
  if (!isValidWhatsApp(payload.whatsapp)) {
    return { success: false, error: 'Número de WhatsApp inválido ou ausente.' };
  }

  if (!API_URL || !API_KEY || !INSTANCE) {
    console.error('[WhatsApp] Configuração da Evolution API ausente no .env');
    return { success: false, error: 'Configuração de API não encontrada.' };
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

    console.log('[WhatsApp] Mensagem enviada via Evolution API:', result);
    return { success: true };
  } catch (error: any) {
    console.error('[WhatsApp] Erro no envio automático:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends the audio file as a WhatsApp Voice Message (PTT).
 * Premium feature: appears with the blue microphone icon.
 */
export const sendPtt = async (payload: DeliveryPayload): Promise<SendResult> => {
  if (!payload.audio_url || !isValidWhatsApp(payload.whatsapp)) {
    return { success: false, error: 'Áudio ou número inválido.' };
  }

  const jid = normalizeJID(payload.whatsapp);

  const SYB_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://eazwewzslriqzzvjwpjh.supabase.co').replace(/\/$/, '');
  const endpoint = `${API_URL}/message/sendMedia/${INSTANCE}`;
  
  // URL absoluta do Supabase com encoding para segurança
  const rawAudioUrl = payload.audio_url.startsWith('http') 
    ? payload.audio_url 
    : `${SYB_URL}/storage/v1/object/public/audio-files/${payload.audio_url}`;
  
  const fullAudioUrl = encodeURI(rawAudioUrl);
  
  console.log('[WhatsApp] URL do áudio preparada:', fullAudioUrl);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
      body: JSON.stringify({
        number: jid,
        mediatype: 'document', // Entrega como arquivo MP3
        mimetype: 'audio/mpeg',
        media: fullAudioUrl,
        fileName: 'Locucao_SanzonyVoz.mp3', // Ele chegará com este nome
        delay: 2000
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('[WhatsApp] API rejeitou o áudio:', result);
      throw new Error(result.message || 'Erro ao enviar áudio.');
    }

    return { success: true };
  } catch (error: any) {
    console.error('[WhatsApp] Erro ao enviar PTT:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a PDF document (Certificate) via WhatsApp.
 */
export const sendDocument = async (payload: DeliveryPayload): Promise<SendResult> => {
  if (!payload.certificado_url || !isValidWhatsApp(payload.whatsapp)) {
    return { success: false, error: 'Certificado ou número inválido.' };
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

    return { success: true };
  } catch (error: any) {
    console.error('[WhatsApp] Erro ao enviar documento:', error.message);
    return { success: false, error: error.message };
  }
};

// -----------------------------------------------------------------------------
// Facade — maintains backward compatibility with service object pattern
// -----------------------------------------------------------------------------
export const whatsappService = {
  buildDeliveryMessage,
  isValidWhatsApp,
  sendViaLink,
  autoSend,
  sendPtt,
  sendDocument,

  /** @deprecated use sendViaLink() */
  async sendMessage(props: { nome: string; whatsapp: string; numero_certificado: string | null; audio_url?: string }) {
    return sendViaLink(props);
  },
};

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

const API_URL = import.meta.env.VITE_EVOLUTION_API_URL;
const API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY;
const INSTANCE = import.meta.env.VITE_EVOLUTION_INSTANCE_NAME;

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
// Provider: Auto Send — abstracted for future API integration
// Swap internals here to use Twilio, Baileys, Z-API, WPPConnect, etc.
// -----------------------------------------------------------------------------
export const autoSend = async (payload: DeliveryPayload): Promise<SendResult> => {
  if (!isValidWhatsApp(payload.whatsapp)) {
    return { success: false, error: 'Número de WhatsApp inválido ou ausente.' };
  }

  if (!API_URL || !API_KEY || !INSTANCE) {
    console.error('[WhatsApp] Configuração da Evolution API ausente no .env');
    return { success: false, error: 'Configuração de API não encontrada.' };
  }

  const cleanNumber = payload.whatsapp.replace(/\D/g, '');
  const endpoint = `${API_URL}/message/sendText/${INSTANCE}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
      body: JSON.stringify({
        number: cleanNumber,
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

  const cleanNumber = payload.whatsapp.replace(/\D/g, '');
  const endpoint = `${API_URL}/message/sendWhatsAppAudio/${INSTANCE}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
      body: JSON.stringify({
        number: cleanNumber,
        audio: payload.audio_url,
        delay: 1500,
      }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Erro ao enviar áudio.');

    return { success: true };
  } catch (error: any) {
    console.error('[WhatsApp] Erro ao enviar PTT:', error.message);
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

  /** @deprecated use sendViaLink() */
  async sendMessage(props: { nome: string; whatsapp: string; numero_certificado: string | null; audio_url?: string }) {
    return sendViaLink(props);
  },
};

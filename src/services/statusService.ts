// =============================================================================
// STATUS SERVICE — Sanzony.Voz
// Single source of truth for the 9-step official production flow.
// =============================================================================

export type BriefStatus =
  | 'recebido'
  | 'visualizado'
  | 'negociacao'
  | 'aguardando_pagamento'
  | 'fila_producao'
  | 'em_producao'
  | 'em_revisao'
  | 'pronto_envio'
  | 'entregue';

export interface StatusConfig {
  label: string;
  /** Tailwind classes for the status badge */
  color: string;
  /** Short label for the primary action button */
  nextAction: string;
  /** Descriptive text shown in the workflow card */
  description: string;
  /** If true, this status should be set automatically by the system */
  isAutomatic?: boolean;
}

/** Ordered array — the canonical sequence. Never reorder. */
export const STATUS_ORDER: BriefStatus[] = [
  'recebido',
  'visualizado',
  'negociacao',
  'aguardando_pagamento',
  'fila_producao',
  'em_producao',
  'em_revisao',
  'pronto_envio',
  'entregue',
];

export const STATUS_FLOW: Record<BriefStatus, StatusConfig> = {
  recebido: {
    label: 'Brief recebido',
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    nextAction: 'Abrir pedido',
    description: 'Novo briefing aguardando triagem.',
    isAutomatic: false,
  },
  visualizado: {
    label: 'Visualizado',
    color: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    nextAction: 'Iniciar negociação',
    description: 'Pedido aberto. Avalie e inicie o contato.',
    isAutomatic: true,
  },
  negociacao: {
    label: 'Em negociação',
    color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    nextAction: 'Aguardar pagamento',
    description: 'Em conversa com o cliente sobre detalhes e valores.',
    isAutomatic: false,
  },
  aguardando_pagamento: {
    label: 'Aguardando pagamento',
    color: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    nextAction: 'Confirmar pagamento',
    description: 'Link de pagamento enviado. Aguardando confirmação.',
    isAutomatic: false,
  },
  fila_producao: {
    label: 'Na fila de produção',
    color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    nextAction: 'Iniciar produção',
    description: 'Pagamento confirmado. Pronto para entrar em estúdio.',
    isAutomatic: false,
  },
  em_producao: {
    label: 'Em produção',
    color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    nextAction: 'Upload do áudio',
    description: 'Áudio sendo gravado/editado. Faça upload ao finalizar.',
    isAutomatic: false,
  },
  em_revisao: {
    label: 'Em revisão',
    color: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    nextAction: 'Validar resultado',
    description: 'Áudio recebido. Gerando certificados e preparando entrega.',
    isAutomatic: true,
  },
  pronto_envio: {
    label: 'Pronto para envio',
    color: 'bg-lime-500/15 text-lime-400 border-lime-500/30',
    nextAction: 'Enviar agora',
    description: 'Tudo validado. Pronto para entrega ao cliente.',
    isAutomatic: false,
  },
  entregue: {
    label: 'Entregue',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    nextAction: 'Ver comprovante',
    description: 'Áudio e certificado enviados com sucesso ao cliente.',
    isAutomatic: true,
  },
};

// =============================================================================
// HELPERS
// =============================================================================

export const getStatusOrder = (status: BriefStatus): number =>
  STATUS_ORDER.indexOf(status);

export const getNextStatus = (current: BriefStatus): BriefStatus | null => {
  const idx = STATUS_ORDER.indexOf(current);
  return idx >= 0 && idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
};

/**
 * Validates whether a transition from `from` to `to` is legally allowed.
 * Only forward-one-step transitions are allowed (plus automatics).
 */
export const isValidTransition = (from: BriefStatus, to: BriefStatus): boolean => {
  const fromIdx = STATUS_ORDER.indexOf(from);
  const toIdx = STATUS_ORDER.indexOf(to);
  // Allow only direct next-step transition
  return toIdx === fromIdx + 1;
};

/**
 * Pre-conditions for advancing past the given status.
 * Returns an error string if something is missing, or null if all good.
 */
export const validatePreConditions = (
  current: BriefStatus,
  brief: {
    whatsapp?: string | null;
    audio_url?: string | null;
    numero_certificado?: string | null;
    certificado_url?: string | null;
  }
): string | null => {
  switch (current) {
    case 'aguardando_pagamento':
      // Moving to fila_producao requires "payment confirmation" — handled by operator click
      return null;

    case 'em_producao':
      // Moving to em_revisao requires audio to be present
      if (!brief.audio_url) return 'É necessário fazer o upload do áudio antes de avançar.';
      return null;

    case 'em_revisao':
      // Moving to pronto_envio requires certificate to be generated
      if (!brief.numero_certificado || !brief.certificado_url)
        return 'O certificado ainda não foi gerado. Aguarde o processamento.';
      return null;

    case 'pronto_envio':
      // Moving to entregue requires valid WhatsApp AND certificate
      if (!brief.whatsapp || brief.whatsapp.replace(/\D/g, '').length < 10)
        return 'Número de WhatsApp inválido ou ausente.';
      if (!brief.numero_certificado || !brief.certificado_url)
        return 'O certificado não está disponível para envio.';
      if (!brief.audio_url)
        return 'O áudio não está disponível para envio.';
      return null;

    default:
      return null;
  }
};

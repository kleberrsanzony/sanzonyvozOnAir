// =============================================================================
// AUTOMATION SERVICE — Sanzony.Voz
//
// Orchestrates the complete post-upload delivery flow:
// [audio saved] → em_revisao → [generate cert] → pronto_envio
//               → [send WhatsApp] → entregue
//
// Failures at any step are isolated, logged, and never corrupt status.
// =============================================================================

import { supabase } from '@/integrations/supabase/client';
import { whatsappService, isValidWhatsApp } from './whatsappService';
import { BriefStatus, validatePreConditions, getNextStatus } from './statusService';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AutomationResult {
  success: boolean;
  message: string;
  finalStatus: BriefStatus;
  error?: string;
  /** Structured log of each step for displaying to the operator */
  steps: AutomationStep[];
}

export interface AutomationStep {
  label: string;
  status: 'ok' | 'error' | 'skipped';
  detail?: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function updateStatus(briefId: string, status: BriefStatus): Promise<void> {
  const { error } = await supabase
    .from('briefs')
    .update({ status })
    .eq('id', briefId);
  if (error) throw new Error(`Falha ao atualizar status para "${status}": ${error.message}`);
}

async function fetchFreshBrief(briefId: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('briefs')
    .select('*')
    .eq('id', briefId)
    .single();
  if (error || !data) throw new Error('Não foi possível recarregar os dados do pedido.');
  return data as Record<string, unknown>;
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export const automationService = {
  /**
   * Full delivery automation triggered after a successful audio upload.
   *
   * Sequence:
   *  1. Validate pre-conditions (payment confirmed, valid contact, audio present)
   *  2. Transition → em_revisao
   *  3. Generate certificate via Edge Function
   *  4. Transition → pronto_envio
   *  5. Send WhatsApp automatically
   *  6. Transition → entregue  (only on WhatsApp success)
   *
   * On any failure: logs the step, leaves status in a coherent state,
   * returns detailed result for UI display. Never throws.
   */
  async runPostUploadFlow(briefId: string, briefSnapshot: Record<string, unknown>): Promise<AutomationResult> {
    const steps: AutomationStep[] = [];
    console.group(`🚀 [Automation] Fluxo pós-upload — Brief ${briefId}`);

    // ── Step 0: Pre-condition validation ───────────────────────────────────
    console.log('› Validando pré-condições...');

    const preCheck = this.validateForAutoDelivery(briefSnapshot);
    if (!preCheck.valid) {
      steps.push({ label: 'Validação inicial', status: 'error', detail: preCheck.reason });
      console.error('✗ Pré-condição inválida:', preCheck.reason);
      console.groupEnd();
      return {
        success: false,
        message: preCheck.reason!,
        finalStatus: (briefSnapshot.status as BriefStatus) || 'em_producao',
        error: preCheck.reason,
        steps,
      };
    }
    steps.push({ label: 'Validação inicial', status: 'ok', detail: 'Todas as pré-condições atendidas.' });

    // ── Step 1: em_revisao ─────────────────────────────────────────────────
    try {
      await updateStatus(briefId, 'em_revisao');
      steps.push({ label: 'Status: Em revisão', status: 'ok' });
      console.log('✓ Status → em_revisao');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      steps.push({ label: 'Status: Em revisão', status: 'error', detail: msg });
      console.error('✗', msg);
      console.groupEnd();
      return { success: false, message: msg, finalStatus: 'em_producao', error: msg, steps };
    }

    // ── Step 2: Generate Certificate ──────────────────────────────────────
    let certData: { certificate?: { numero?: string; url?: string } } | null = null;
    try {
      console.log('› Gerando certificado...');
      const { data, error: certError } = await supabase.functions.invoke('generate-certificate', {
        body: { briefId },
      });

      if (certError) throw new Error(certError.message);
      if (data?.error) throw new Error(data.error);

      certData = data;
      steps.push({
        label: 'Certificado gerado',
        status: 'ok',
        detail: `Nº ${certData?.certificate?.numero}`,
      });
      console.log('✓ Certificado gerado:', certData?.certificate?.numero);
    } catch (err: unknown) {
      const msg = `Certificado: ${err instanceof Error ? err.message : String(err)}`;
      steps.push({ label: 'Geração de certificado', status: 'error', detail: msg });
      console.error('✗', msg);
      console.groupEnd();
      // Stay in em_revisao — do not advance
      return { success: false, message: msg, finalStatus: 'em_revisao', error: msg, steps };
    }

    // ── Step 3: pronto_envio ──────────────────────────────────────────────
    try {
      await updateStatus(briefId, 'pronto_envio');
      steps.push({ label: 'Status: Pronto para envio', status: 'ok' });
      console.log('✓ Status → pronto_envio');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      steps.push({ label: 'Status: Pronto para envio', status: 'error', detail: msg });
      console.error('✗', msg);
      console.groupEnd();
      return { success: false, message: msg, finalStatus: 'em_revisao', error: msg, steps };
    }

    // ── Step 4: WhatsApp Automatic Send ───────────────────────────────────
    // Reload brief to get the freshest data (cert URLs may have been updated)
    let freshBrief: Record<string, unknown> = briefSnapshot;
    try {
      freshBrief = await fetchFreshBrief(briefId);
    } catch {
      // Non-fatal: use snapshot
    }

    const waPayload = {
      nome: (freshBrief.nome as string) || (briefSnapshot.nome as string),
      whatsapp: (freshBrief.whatsapp as string) || (briefSnapshot.whatsapp as string),
      numero_certificado: ((freshBrief.numero_certificado as string) || certData?.certificate?.numero) ?? null,
      certificado_url: (freshBrief.certificado_url as string) || certData?.certificate?.url,
      audio_url: (freshBrief.audio_url as string) || (briefSnapshot.audio_url as string),
    };

    console.log('› Enviando WhatsApp para:', waPayload.whatsapp);
    const waResult = await whatsappService.autoSend(waPayload);

    if (!waResult.success) {
      const msg = `Envio WhatsApp: ${waResult.error || 'Falha desconhecida.'}`;
      steps.push({ label: 'Envio WhatsApp', status: 'error', detail: msg });
      console.error('✗', msg);
      console.groupEnd();
      // Status stays at pronto_envio — operator must manually retry
      return { success: false, message: msg, finalStatus: 'pronto_envio', error: msg, steps };
    }

    steps.push({
      label: 'WhatsApp: Texto enviado',
      status: 'ok',
      detail: `Mensagem enviada para ${waPayload.whatsapp}`,
    });
    console.log('✓ WhatsApp Texto enviado.');

    // ── Step 4.5: WhatsApp PTT (Voice Message) ───────────────────────────
    console.log('› Enviando PTT (Áudio gravado) para:', waPayload.whatsapp);
    const pttResult = await whatsappService.sendPtt(waPayload);

    if (pttResult.success) {
      steps.push({
        label: 'WhatsApp: Áudio enviado (PTT)',
        status: 'ok',
      });
      console.log('✓ WhatsApp PTT enviado.');
    } else {
      // PTT failure is not fatal if text message succeeded
      console.warn('⚠ Falha no envio do PTT:', pttResult.error);
      steps.push({
        label: 'WhatsApp: Áudio PTT',
        status: 'skipped',
        detail: `Falha (não letal): ${pttResult.error}`,
      });
    }

    // ── Step 5: entregue ──────────────────────────────────────────────────
    try {
      await updateStatus(briefId, 'entregue');
      steps.push({ label: 'Status: Entregue', status: 'ok' });
      console.log('✓ Status → entregue');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      steps.push({ label: 'Status: Entregue', status: 'error', detail: msg });
      console.error('✗', msg);
      console.groupEnd();
      // WhatsApp was sent but marking as delivered failed — edge case
      return {
        success: false,
        message: `WhatsApp enviado, mas falha ao marcar como Entregue: ${msg}`,
        finalStatus: 'pronto_envio',
        error: msg,
        steps,
      };
    }

    console.log('🏁 Fluxo completo com sucesso!');
    console.groupEnd();
    return {
      success: true,
      message: 'Áudio entregue ao cliente com sucesso!',
      finalStatus: 'entregue',
      steps,
    };
  },

  /**
   * Validates all pre-conditions required for automated delivery.
   * Call this before starting the flow.
   */
  validateForAutoDelivery(brief: Record<string, unknown>): { valid: boolean; reason?: string } {
    // 1. Payment must be confirmed (status must be em_producao or beyond)
    const paymentStatuses: BriefStatus[] = ['em_producao', 'em_revisao', 'pronto_envio'];
    if (!paymentStatuses.includes(brief.status as BriefStatus)) {
      return {
        valid: false,
        reason: 'Pagamento não confirmado. O pedido deve estar em produção para ativar a automação.',
      };
    }

    // 2. Valid WhatsApp
    if (!isValidWhatsApp(brief.whatsapp as string)) {
      return {
        valid: false,
        reason: 'Número de WhatsApp inválido ou ausente. Edite os dados do cliente antes de continuar.',
      };
    }

    // 3. Audio present
    if (!brief.audio_url) {
      return { valid: false, reason: 'Arquivo de áudio não encontrado no sistema.' };
    }

    return { valid: true };
  },

  /**
   * Helper for manual status advancement from the UI.
   * Validates pre-conditions and transitions.
   */
  async manualAdvance(briefId: string, currentStatus: BriefStatus, brief: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    const preError = validatePreConditions(currentStatus, brief as Parameters<typeof validatePreConditions>[1]);
    if (preError) return { success: false, error: preError };

    try {
      const next = getNextStatus(currentStatus);
      if (!next) return { success: false, error: 'Não há próximo status disponível.' };
      await updateStatus(briefId, next);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
};

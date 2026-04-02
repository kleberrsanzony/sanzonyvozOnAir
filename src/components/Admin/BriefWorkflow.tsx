import { motion } from 'framer-motion';
import {
  CheckCircle2, Circle, Clock, PlayCircle, MessageSquare,
  CreditCard, Loader2, Send, CheckCircle, PackageCheck,
  Search, Upload, Handshake
} from 'lucide-react';
import { BriefStatus, STATUS_FLOW, STATUS_ORDER, getStatusOrder } from '@/services/statusService';
import { Button } from '@/components/ui/button';

interface BriefWorkflowProps {
  status: BriefStatus;
  onActionClick: () => void;
  loading?: boolean;
  /** For em_producao status, renders an upload input instead of a button */
  onAudioUpload?: (file: File) => void;
}

// Maps each status to an icon
const STATUS_ICONS: Record<BriefStatus, React.ElementType> = {
  recebido: MessageSquare,
  visualizado: Search,
  negociacao: Handshake,
  aguardando_pagamento: CreditCard,
  fila_producao: Clock,
  em_producao: PlayCircle,
  em_revisao: Loader2,
  pronto_envio: PackageCheck,
  entregue: CheckCircle,
};

// Condensed labels for the progress bar (space-constrained)
const SHORT_LABELS: Record<BriefStatus, string> = {
  recebido: 'Recebido',
  visualizado: 'Visto',
  negociacao: 'Negoc.',
  aguardando_pagamento: 'Pagto.',
  fila_producao: 'Fila',
  em_producao: 'Produção',
  em_revisao: 'Revisão',
  pronto_envio: 'Envio',
  entregue: 'Entregue',
};

const BriefWorkflow = ({ status, onActionClick, loading, onAudioUpload }: BriefWorkflowProps) => {
  const currentConfig = STATUS_FLOW[status];
  const currentOrder = getStatusOrder(status);
  const isDelivered = status === 'entregue';

  return (
    <div className="space-y-5">
      {/* ── Progress Bar ── */}
      <div className="relative flex items-start justify-between w-full gap-1 px-1">
        {STATUS_ORDER.map((s, idx) => {
          const stepOrder = getStatusOrder(s);
          const isCompleted = currentOrder > stepOrder;
          const isCurrent = status === s;
          const Icon = STATUS_ICONS[s];

          return (
            <div key={s} className="flex flex-col items-center gap-1.5 relative flex-1 min-w-0">
              {/* Connector line (drawn right of each node except the last) */}
              {idx < STATUS_ORDER.length - 1 && (
                <div
                  className={`absolute left-[calc(50%+10px)] top-[14px] right-[-50%] h-[2px] -z-10 transition-colors duration-500 ${
                    isCompleted || isCurrent ? 'bg-primary/50' : 'bg-border/50'
                  }`}
                />
              )}

              {/* Node */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                  isCompleted
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isCurrent
                    ? 'bg-primary/20 border-primary text-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]'
                    : 'bg-secondary border-border text-muted-foreground/40'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Icon className={`h-3 w-3 ${isCurrent && s === 'em_revisao' ? 'animate-spin' : ''}`} />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[9px] font-semibold tracking-tight text-center leading-tight px-0.5 truncate w-full ${
                  isCurrent ? 'text-primary' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/40'
                }`}
              >
                {SHORT_LABELS[s]}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Primary Action Card ── */}
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`relative border rounded-2xl p-5 flex flex-col gap-4 overflow-hidden ${
          isDelivered
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-primary/25 bg-secondary/40'
        }`}
      >
        {/* Left accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${isDelivered ? 'bg-emerald-500' : 'bg-primary'}`} />

        {/* Status badge + description */}
        <div className="ml-1">
          <span
            className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${currentConfig.color}`}
          >
            {currentConfig.label}
          </span>
          <p className="text-sm text-muted-foreground mt-2 leading-snug">
            {currentConfig.description}
          </p>
        </div>

        {/* Primary action */}
        {isDelivered ? (
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>Pedido finalizado e entregue ao cliente!</span>
          </div>
        ) : status === 'em_producao' && onAudioUpload ? (
          // Upload button as primary action when in production
          <label className="cursor-pointer">
            <div
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 border-dashed 
              border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all
              text-primary font-bold text-base ${loading ? 'opacity-60 pointer-events-none' : ''}`}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Upload do áudio final
                </>
              )}
            </div>
            <input
              type="file"
              accept=".mp3,.wav,.aac,.m4a,.ogg"
              className="hidden"
              disabled={loading}
              onChange={(e) => {
                if (e.target.files?.[0]) onAudioUpload(e.target.files[0]);
              }}
            />
          </label>
        ) : (
          <Button
            size="lg"
            onClick={onActionClick}
            disabled={loading || isDelivered}
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 hover:scale-[1.02] active:scale-[0.99] transition-transform shadow-lg shadow-amber-500/20"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              currentConfig.nextAction
            )}
          </Button>
        )}
      </motion.div>
    </div>
  );
};

export default BriefWorkflow;

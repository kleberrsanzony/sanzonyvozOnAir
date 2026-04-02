import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Mic, LogOut, Upload, Award, RefreshCw, Shield,
  ChevronDown, ChevronUp, Trash2, Pencil, Save, X,
  CheckCircle2, AlertTriangle, Loader2, Send, ExternalLink,
  Phone, User, FileText, Info, MessageSquare
} from 'lucide-react';
import AdminStats from '@/components/AdminStats';
import BriefWorkflow from '@/components/Admin/BriefWorkflow';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { BriefStatus, STATUS_FLOW, STATUS_ORDER } from '@/services/statusService';
import { sendViaLink } from '@/services/whatsappService';
import { automationService, AutomationStep } from '@/services/automationService';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Brief {
  id: string;
  nome: string;
  empresa: string | null;
  email: string;
  whatsapp: string;
  tipo_locucao: string;
  texto: string;
  tom: string | null;
  regiao: string | null;
  periodo: string | null;
  status: BriefStatus;
  audio_url: string | null;
  audio_filename: string | null;
  hash_sha256: string | null;
  numero_certificado: string | null;
  certificado_url: string | null;
  qr_code_url: string | null;
  created_at: string;
  updated_at: string;
}

type FilterKey = 'all' | 'fila_producao' | 'negociacao' | 'entregue';

// ── Automation Result Panel ────────────────────────────────────────────────────

interface AutoResultPanelProps {
  steps: AutomationStep[];
  success: boolean;
  message: string;
  onClose: () => void;
}

const AutoResultPanel = ({ steps, success, message, onClose }: AutoResultPanelProps) => (
  <div
    className={`border rounded-xl p-4 space-y-3 text-sm ${
      success ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2 font-bold">
        {success ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
        )}
        <span className={success ? 'text-emerald-400' : 'text-red-400'}>{message}</span>
      </div>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
    <ul className="space-y-1.5 pl-6">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-2">
          {step.status === 'ok' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />}
          {step.status === 'error' && <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />}
          {step.status === 'skipped' && <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground shrink-0 mt-0.5" />}
          <span className={step.status === 'error' ? 'text-red-300' : 'text-muted-foreground'}>
            <span className="font-medium text-foreground">{step.label}</span>
            {step.detail && <> — {step.detail}</>}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

// ── Status badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: BriefStatus }) => {
  const cfg = STATUS_FLOW[status];
  return (
    <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'fila_producao', label: 'Em Produção' },
  { key: 'negociacao', label: 'Negociação' },
  { key: 'entregue', label: 'Entregues' },
];

// =============================================================================
// MAIN PAGE
// =============================================================================

const AdminPage = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [expandedBrief, setExpandedBrief] = useState<string | null>(null);
  const [editingBrief, setEditingBrief] = useState<string | null>(null);
  // useRef avoids stale closure when multiple fields update the same edit state
  const [editData, setEditDataState] = useState<Record<string, Partial<Brief>>>({});
  const editDataRef = useRef<Record<string, Partial<Brief>>>({});
  const setEditData = (briefId: string, update: Partial<Brief>) => {
    setEditDataState((prev) => {
      const next = { ...prev, [briefId]: { ...(prev[briefId] || {}), ...update } };
      editDataRef.current = next;
      return next;
    });
  };
  const [filter, setFilter] = useState<FilterKey>('all');
  /** Per-brief loading state for async actions */
  const [loadingBriefId, setLoadingBriefId] = useState<string | null>(null);
  /** Per-brief automation result panel */
  const [autoResult, setAutoResult] = useState<Record<string, { success: boolean; message: string; steps: AutomationStep[] }>>({});
  const autoViewRef = useRef<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchBriefs = async () => {
    const { data, error } = await supabase
      .from('briefs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao carregar pedidos', description: error.message, variant: 'destructive' });
    } else {
      setBriefs((data as Brief[]) || []);
    }
  };

  // ── Status management ──────────────────────────────────────────────────────

  const updateStatus = async (briefId: string, status: BriefStatus) => {
    const { error } = await supabase.from('briefs').update({ status }).eq('id', briefId);
    if (error) throw error;
  };

  // ── Auto-View: transition recebido → visualizado when brief is opened ──────

  useEffect(() => {
    if (!expandedBrief) return;
    const brief = briefs.find((b) => b.id === expandedBrief);
    if (!brief || brief.status !== 'recebido') return;
    if (autoViewRef.current.has(brief.id)) return;

    autoViewRef.current.add(brief.id);
    console.log('[Auto] Pedido visualizado pela primeira vez:', brief.id);
    updateStatus(brief.id, 'visualizado').then(() => fetchBriefs()).catch(console.error);
  }, [expandedBrief, briefs]);

  // ── Per-brief action loading helper ───────────────────────────────────────

  const withBriefLoading = async (briefId: string, fn: () => Promise<void>) => {
    setLoadingBriefId(briefId);
    try {
      await fn();
    } finally {
      setLoadingBriefId(null);
    }
  };

  // ── Manual status advance ─────────────────────────────────────────────────

  const handleStatusAction = async (brief: Brief) => {
    await withBriefLoading(brief.id, async () => {
      // For pronto_envio, open WhatsApp link if auto-send isn't available
      if (brief.status === 'pronto_envio') {
        const result = sendViaLink({
          nome: brief.nome,
          whatsapp: brief.whatsapp,
          numero_certificado: brief.numero_certificado,
          certificado_url: brief.certificado_url,
        });
        if (result.url) {
          window.open(result.url, '_blank');
        } else {
          toast({ title: 'Erro', description: result.error, variant: 'destructive' });
          return;
        }
        // After opening link, mark as entregue on operator confirmation
        await updateStatus(brief.id, 'entregue');
        await fetchBriefs();
        toast({ title: 'Entregue!', description: 'Pedido marcado como entregue.' });
        return;
      }

      if (brief.status === 'entregue') {
        toast({ title: 'Pedido finalizado', description: 'Este pedido já foi concluído.' });
        return;
      }

      const res = await automationService.manualAdvance(brief.id, brief.status, brief as unknown as Record<string, unknown>);
      await fetchBriefs(); // Always refresh to show exact state even on blocked action
      if (!res.success) {
        toast({ title: 'Ação bloqueada', description: res.error, variant: 'destructive' });
        return;
      }
    });
  };

  // ── Audio Upload & Automation ─────────────────────────────────────────────

  const handleAudioUpload = async (brief: Brief, file: File) => {
    await withBriefLoading(brief.id, async () => {
      const filePath = `${brief.id}/${Date.now()}_${file.name}`;
      toast({ title: 'Enviando áudio…', description: 'Fazendo upload do arquivo.' });

      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
        return;
      }

      // Persist audio reference
      await supabase
        .from('briefs')
        .update({ audio_url: filePath, audio_filename: file.name })
        .eq('id', brief.id);

      toast({ title: 'Áudio salvo!', description: 'Iniciando automação de entrega…' });

      const updatedBrief = { ...brief, audio_url: filePath, audio_filename: file.name };
      const result = await automationService.runPostUploadFlow(brief.id, updatedBrief as unknown as Record<string, unknown>);

      setAutoResult((prev) => ({ ...prev, [brief.id]: result }));
      await fetchBriefs();

      if (result.success) {
        toast({ title: '✅ Entregue com sucesso!', description: 'WhatsApp enviado e certificado gerado.', variant: 'default' });
      } else {
        toast({
          title: '⚠️ Automação incompleta',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };

  // ── Certificate generation (manual) ───────────────────────────────────────

  const generateCertificate = async (briefId: string) => {
    await withBriefLoading(briefId, async () => {
      const { data, error } = await supabase.functions.invoke('generate-certificate', { body: { briefId } });
      if (error || data?.error) {
        toast({ title: 'Erro', description: error?.message || data?.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Certificado gerado!', description: `Nº: ${data.certificate.numero}` });
      await fetchBriefs();
    });
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const deleteBrief = async (briefId: string) => {
    await withBriefLoading(briefId, async () => {
      console.log('[deleteBrief] apagando id:', briefId);
      const { error } = await supabase.from('briefs').delete().eq('id', briefId);
      console.log('[deleteBrief] resultado:', error ?? 'ok');
      if (error) {
        toast({ title: 'Erro ao apagar', description: error.message, variant: 'destructive' });
      } else {
        setExpandedBrief(null);
        toast({ title: '🗑️ Briefing apagado com sucesso!' });
        await fetchBriefs();
      }
    });
  };

  // ── Edit ──────────────────────────────────────────────────────────────────

  const startEditing = (brief: Brief) => {
    const initial: Partial<Brief> = {
      nome: brief.nome,
      empresa: brief.empresa,
      email: brief.email,
      whatsapp: brief.whatsapp,
      tipo_locucao: brief.tipo_locucao,
      texto: brief.texto,
      tom: brief.tom,
      regiao: brief.regiao,
      periodo: brief.periodo,
    };
    editDataRef.current[brief.id] = initial;
    setEditDataState((prev) => ({ ...prev, [brief.id]: initial }));
    setEditingBrief(brief.id);
  };

  const saveEditing = async (briefId: string) => {
    console.debug('[saveEditing] Iniciando salvamento id:', briefId);
    const current = editDataRef.current[briefId] || {};
    
    const payload = {
      nome:         current.nome        ?? '',
      empresa:      current.empresa     ?? null,
      email:        current.email       ?? '',
      whatsapp:     current.whatsapp    ?? '',
      tipo_locucao: current.tipo_locucao ?? '',
      texto:        current.texto       ?? '',
      tom:          current.tom         ?? null,
      regiao:       current.regiao      ?? null,
      periodo:      current.periodo     ?? null,
    };

    console.debug('[saveEditing] Payload:', payload);

    await withBriefLoading(briefId, async () => {
      const { error } = await supabase
        .from('briefs')
        .update(payload)
        .eq('id', briefId);

      if (error) {
        console.error('[saveEditing] Erro Supabase:', error);
        toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      } else {
        console.debug('[saveEditing] Sucesso!');
        toast({ title: 'Dados atualizados!', description: 'O briefing foi salvo com sucesso.' });
        setEditingBrief(null);
        // Clear local edit buffer for ONLY this brief after success
        setEditDataState((prev) => {
          const next = { ...prev };
          delete next[briefId];
          delete editDataRef.current[briefId];
          return next;
        });
        await fetchBriefs();
      }
    });
  };

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) { navigate('/login'); return; }
      setUser(session.user);

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        toast({ title: 'Acesso negado', description: 'Você não tem permissão de admin.', variant: 'destructive' });
        navigate('/'); return;
      }
      setIsAdmin(true);
      await fetchBriefs();
      setPageLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) navigate('/login');
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Filter logic ──────────────────────────────────────────────────────────

  const filteredBriefs = briefs.filter((b) => {
    if (filter === 'fila_producao') return ['fila_producao', 'em_producao', 'em_revisao', 'pronto_envio'].includes(b.status);
    if (filter === 'negociacao') return ['negociacao', 'aguardando_pagamento'].includes(b.status);
    if (filter === 'entregue') return b.status === 'entregue';
    return true;
  });

  // ── Loading gate ──────────────────────────────────────────────────────────

  if (!isAdmin || pageLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Mic className="h-10 w-10 text-primary animate-pulse" />
        <p className="text-muted-foreground animate-pulse tracking-widest uppercase text-xs">Autenticando…</p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg font-bold">
              <span className="text-gradient-gold">SANZONY</span>
              <span className="text-muted-foreground">.VOZ</span>
            </span>
            <span className="ml-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold tracking-wider">ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs hidden md:inline">{user?.email}</span>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold">
              <span className="text-gradient-gold">Pedidos</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{briefs.length} pedido{briefs.length !== 1 ? 's' : ''} no sistema</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter tabs */}
            <div className="flex bg-secondary/30 p-1 rounded-lg border border-border gap-0.5">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filter === tab.key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchBriefs}
              className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary/50"
              title="Recarregar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <AdminStats briefs={briefs} />

        {/* Brief list */}
        {filteredBriefs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum pedido nesta categoria.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBriefs.map((brief) => {
              const isExpanded = expandedBrief === brief.id;
              const isThisLoading = loadingBriefId === brief.id;
              const cfg = STATUS_FLOW[brief.status];
              const thisAutoResult = autoResult[brief.id];

              return (
                <div
                  key={brief.id}
                  className={`bg-card border rounded-xl overflow-hidden transition-all duration-200 ${
                    isExpanded ? 'border-primary/30 shadow-lg shadow-primary/5' : 'border-border hover:border-border/80'
                  }`}
                >
                  {/* ── Card Header (collapsed) ─────────────────────────────── */}
                  <button
                    onClick={() => setExpandedBrief(isExpanded ? null : brief.id)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Status indicator dot */}
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.color.split(' ')[0].replace('/15', '/70')}`} />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold truncate">{brief.nome}</p>
                          {brief.empresa && (
                            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                              · {brief.empresa}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <StatusBadge status={brief.status} />
                          <span className="text-xs text-muted-foreground">{brief.tipo_locucao}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {/* Show next action hint on collapse */}
                      {!isExpanded && brief.status !== 'entregue' && (
                        <span className="text-[10px] text-muted-foreground hidden md:inline">
                          → {cfg.nextAction}
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* ── Expanded Detail ─────────────────────────────────────── */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      {/* Action toolbar (edit/delete) */}
                      <div className="px-5 py-3 flex items-center gap-2 bg-secondary/20 border-b border-border/50">
                        {editingBrief === brief.id ? (
                          <>
                            <Button size="sm" onClick={() => saveEditing(brief.id)} className="bg-gradient-gold text-primary-foreground h-8">
                              <Save className="h-3.5 w-3.5 mr-1" /> Salvar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingBrief(null)} className="h-8">
                              <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => startEditing(brief)} className="h-8">
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar dados
                          </Button>
                        )}

                        <div className="flex-1" />

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Apagar pedido?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação remove permanentemente o briefing de <strong>{brief.nome}</strong>. Não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteBrief(brief.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Apagar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Main content grid */}
                      <div className="p-5 grid md:grid-cols-5 gap-6">
                        {/* LEFT: Workflow (takes most space) */}
                        <div className="md:col-span-3 space-y-5">
                          <BriefWorkflow
                            status={brief.status}
                            onActionClick={() => handleStatusAction(brief)}
                            loading={isThisLoading}
                            onAudioUpload={
                              brief.status === 'em_producao'
                                ? (file) => handleAudioUpload(brief, file)
                                : undefined
                            }
                          />

                          {/* Automation result panel */}
                          {thisAutoResult && (
                            <AutoResultPanel
                              {...thisAutoResult}
                              onClose={() => setAutoResult((prev) => { const n = { ...prev }; delete n[brief.id]; return n; })}
                            />
                          )}

                          {/* Brief text */}
                          <div className="bg-secondary/20 border border-border rounded-xl p-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                              <FileText className="h-3 w-3" /> Texto do Briefing
                            </h3>
                            {editingBrief === brief.id ? (
                              <Textarea
                                value={editData[brief.id]?.texto || ''}
                                onChange={(e) => setEditData(brief.id, { texto: e.target.value })}
                                rows={6}
                                className="text-sm"
                              />
                            ) : (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{brief.texto}</p>
                            )}
                          </div>
                        </div>

                        {/* RIGHT: Customer Info + Secondary Actions */}
                        <div className="md:col-span-2 space-y-4">
                          {/* Customer data */}
                          <div className="bg-secondary/20 border border-border rounded-xl p-4 space-y-3">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                              <User className="h-3 w-3" /> Cliente
                            </h3>

                            {editingBrief === brief.id ? (
                              <div className="space-y-2.5">
                                <div>
                                  <label className="text-[10px] text-muted-foreground uppercase">Nome</label>
                                  <Input value={editData[brief.id]?.nome || ''} onChange={(e) => setEditData(brief.id, { nome: e.target.value })} className="h-8 text-sm mt-1" />
                                </div>
                                <div>
                                  <label className="text-[10px] text-muted-foreground uppercase">E-mail</label>
                                  <Input value={editData[brief.id]?.email || ''} onChange={(e) => setEditData(brief.id, { email: e.target.value })} className="h-8 text-sm mt-1" />
                                </div>
                                <div>
                                  <label className="text-[10px] text-muted-foreground uppercase">WhatsApp</label>
                                  <Input value={editData[brief.id]?.whatsapp || ''} onChange={(e) => setEditData(brief.id, { whatsapp: e.target.value })} className="h-8 text-sm mt-1" />
                                </div>
                                <div>
                                  <label className="text-[10px] text-muted-foreground uppercase">Empresa</label>
                                  <Input value={editData[brief.id]?.empresa || ''} onChange={(e) => setEditData(brief.id, { empresa: e.target.value })} className="h-8 text-sm mt-1" />
                                </div>
                                <div>
                                  <label className="text-[10px] text-muted-foreground uppercase">Tom de voz</label>
                                  <Input value={editData[brief.id]?.tom || ''} onChange={(e) => setEditData(brief.id, { tom: e.target.value })} className="h-8 text-sm mt-1" />
                                </div>
                                <div>
                                  <label className="text-[10px] text-muted-foreground uppercase">Região de veiculação</label>
                                  <Input value={editData[brief.id]?.regiao || ''} onChange={(e) => setEditData(brief.id, { regiao: e.target.value })} className="h-8 text-sm mt-1" />
                                </div>
                                <div>
                                  <label className="text-[10px] text-muted-foreground uppercase">Período de uso</label>
                                  <Input value={editData[brief.id]?.periodo || ''} onChange={(e) => setEditData(brief.id, { periodo: e.target.value })} className="h-8 text-sm mt-1" />
                                </div>
                              </div>
                            ) : (
                              <dl className="space-y-2.5 text-sm">
                                <div>
                                  <dt className="text-[10px] text-muted-foreground uppercase">Nome</dt>
                                  <dd className="font-medium text-primary mt-0.5">{brief.nome}</dd>
                                </div>
                                <div>
                                  <dt className="text-[10px] text-muted-foreground uppercase">E-mail</dt>
                                  <dd className="font-mono text-xs mt-0.5 break-all">{brief.email || <span className="text-muted-foreground/50">—</span>}</dd>
                                </div>
                                <div>
                                  <dt className="text-[10px] text-muted-foreground uppercase flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> WhatsApp</dt>
                                  <dd className="font-mono mt-0.5">{brief.whatsapp || <span className="text-red-400 text-xs">⚠ Não informado</span>}</dd>
                                </div>
                                <div>
                                  <dt className="text-[10px] text-muted-foreground uppercase">Tipo de locução</dt>
                                  <dd className="mt-0.5">{brief.tipo_locucao}</dd>
                                </div>
                                {brief.tom && (
                                  <div>
                                    <dt className="text-[10px] text-muted-foreground uppercase">Tom de voz</dt>
                                    <dd className="mt-0.5">{brief.tom}</dd>
                                  </div>
                                )}
                                {brief.empresa && (
                                  <div>
                                    <dt className="text-[10px] text-muted-foreground uppercase">Empresa</dt>
                                    <dd className="mt-0.5">{brief.empresa}</dd>
                                  </div>
                                )}
                                {brief.regiao && (
                                  <div>
                                    <dt className="text-[10px] text-muted-foreground uppercase">Região de veiculação</dt>
                                    <dd className="mt-0.5">{brief.regiao}</dd>
                                  </div>
                                )}
                                {brief.periodo && (
                                  <div>
                                    <dt className="text-[10px] text-muted-foreground uppercase">Período de uso</dt>
                                    <dd className="mt-0.5">{brief.periodo}</dd>
                                  </div>
                                )}
                              </dl>
                            )}
                          </div>

                          {/* Secondary actions */}
                          <div className="space-y-2">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Ações secundárias</h3>

                            {/* Manual audio upload (always available as secondary) */}
                            <label className={`flex items-center gap-2.5 px-4 py-2.5 bg-card hover:bg-secondary/50 border border-border rounded-lg cursor-pointer transition-colors text-xs group ${isThisLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                              <Upload className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                              <span>{brief.audio_url ? 'Substituir áudio' : 'Upload de áudio'}</span>
                              {brief.audio_filename && (
                                <span className="ml-auto text-muted-foreground/60 truncate max-w-24">{brief.audio_filename}</span>
                              )}
                              <input
                                type="file"
                                accept=".mp3,.wav,.aac,.m4a,.ogg"
                                className="hidden"
                                disabled={isThisLoading}
                                onChange={(e) => e.target.files?.[0] && handleAudioUpload(brief, e.target.files[0])}
                              />
                            </label>

                            {/* Manual certificate generation */}
                            {brief.status !== 'entregue' && (
                              <button
                                onClick={() => generateCertificate(brief.id)}
                                disabled={isThisLoading || !brief.audio_url}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-card hover:bg-secondary/50 border border-border rounded-lg text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Award className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                Gerar certificado manualmente
                              </button>
                            )}

                            {/* Certificate: PDF + Verification */}
                            {brief.certificado_url && (
                              <a
                                href={brief.certificado_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 px-4 py-2.5 bg-card hover:bg-secondary/50 border border-border rounded-lg text-xs transition-colors"
                              >
                                <Award className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                <span>Ver certificado PDF</span>
                                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                              </a>
                            )}

                            {/* Verification link — direct button with cert number */}
                            {brief.numero_certificado && (
                              <a
                                href={`/verificar/${brief.numero_certificado}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 px-4 py-2.5 bg-card hover:bg-secondary/50 border border-emerald-500/30 rounded-lg text-xs transition-colors group"
                              >
                                <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-emerald-400">Verificar autenticidade</span>
                                  <span className="font-mono text-muted-foreground/60 text-[10px] truncate">{brief.numero_certificado}</span>
                                </div>
                                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                              </a>
                            )}

                            {/* Open WhatsApp link manually */}
                            {brief.status !== 'entregue' && brief.whatsapp && (
                              <button
                                onClick={() => {
                                  const res = sendViaLink({ nome: brief.nome, whatsapp: brief.whatsapp, numero_certificado: brief.numero_certificado, certificado_url: brief.certificado_url });
                                  if (res.url) window.open(res.url, '_blank');
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-card hover:bg-secondary/50 border border-border rounded-lg text-xs transition-colors"
                              >
                                <Send className="h-3.5 w-3.5 text-green-400 shrink-0" />
                                Abrir link WhatsApp
                              </button>
                            )}
                          </div>

                          {/* Delivery receipt (if delivered) */}
                          {brief.status === 'entregue' && brief.numero_certificado && (
                            <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                              <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3" /> Comprovante de entrega
                              </h3>
                              <dl className="text-xs space-y-1.5">
                                <div>
                                  <dt className="text-muted-foreground">Nº Certificado</dt>
                                  <dd className="font-mono font-medium">{brief.numero_certificado}</dd>
                                </div>
                                {brief.certificado_url && (
                                  <a href={brief.certificado_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-emerald-400 hover:underline">
                                    <ExternalLink className="h-3 w-3" /> Ver certificado
                                  </a>
                                )}
                              </dl>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs pt-4 pb-8">
          <Shield className="h-3 w-3 text-primary" />
          <span>Painel protegido — Sanzony.Voz™</span>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, LogOut, CheckSquare, Square, Upload, Award, Send,
  RefreshCw, Shield, ChevronDown, ChevronUp, Trash2, Pencil, Save, X,
  Filter
} from "lucide-react";
import AdminStats from "@/components/AdminStats";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { User } from "@supabase/supabase-js";

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
  status: string;
  pago: boolean;
  audio_url: string | null;
  audio_filename: string | null;
  hash_sha256: string | null;
  numero_certificado: string | null;
  certificado_url: string | null;
  qr_code_url: string | null;
  brief_recebido: boolean;
  audio_entregue: boolean;
  certificado_gerado: boolean;
  enviado_cliente: boolean;
  created_at: string;
  updated_at: string;
}

const AdminPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBrief, setExpandedBrief] = useState<string | null>(null);
  const [editingBrief, setEditingBrief] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Brief>>({});
  const [filter, setFilter] = useState<"all" | "pago" | "pendente" | "certificado">("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        navigate("/login");
        return;
      }
      setUser(session.user);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast({ title: "Acesso negado", description: "Você não tem permissão de admin.", variant: "destructive" });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchBriefs();
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) navigate("/login");
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const fetchBriefs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("briefs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setBriefs((data as Brief[]) || []);
    }
    setLoading(false);
  };

  const toggleField = async (briefId: string, field: string, value: boolean) => {
    const { error } = await supabase
      .from("briefs")
      .update({ [field]: value })
      .eq("id", briefId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      fetchBriefs();
    }
  };

  const handleAudioUpload = async (briefId: string, file: File) => {
    const filePath = `${briefId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("audio-files")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      return;
    }

    await supabase
      .from("briefs")
      .update({
        audio_url: filePath,
        audio_filename: file.name,
        audio_entregue: true,
      })
      .eq("id", briefId);

    toast({ title: "Áudio enviado!" });
    fetchBriefs();
  };

  const generateCertificate = async (briefId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    console.log("Chamando geração de certificado para:", briefId);
    const response = await supabase.functions.invoke("generate-certificate", {
      body: { briefId },
    });

    console.log("Resposta da Função:", response);

    if (response.error) {
      console.error("Erro detalhado da Função:", response.error);
      const errorMsg = response.error.message || "Erro desconhecido no servidor";
      toast({ 
        title: "Erro na Geração", 
        description: `Servidor diz: ${errorMsg}`, 
        variant: "destructive" 
      });
      return;
    }
    
    // Check for business logic errors in data
    if (response.data?.error) {
      toast({ 
        title: "Erro de Regra", 
        description: response.data.error, 
        variant: "destructive" 
      });
      return;
    }

    toast({ title: "Certificado gerado!", description: `Nº: ${response.data.certificate.numero}` });
    fetchBriefs();
  };

  const deleteBrief = async (briefId: string) => {
    const { error } = await supabase.from("briefs").delete().eq("id", briefId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Briefing apagado!" });
      setExpandedBrief(null);
      fetchBriefs();
    }
  };

  const startEditing = (brief: Brief) => {
    setEditingBrief(brief.id);
    setEditData({
      nome: brief.nome,
      empresa: brief.empresa,
      email: brief.email,
      whatsapp: brief.whatsapp,
      tipo_locucao: brief.tipo_locucao,
      texto: brief.texto,
      tom: brief.tom,
      regiao: brief.regiao,
      periodo: brief.periodo,
    });
  };

  const saveEditing = async (briefId: string) => {
    const { error } = await supabase
      .from("briefs")
      .update(editData)
      .eq("id", briefId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Briefing atualizado!" });
      setEditingBrief(null);
      fetchBriefs();
    }
  };

  const getWhatsAppMessage = (brief: Brief) => {
    const baseUrl = window.location.origin;
    const verifyUrl = `${baseUrl}/verificar/${brief.numero_certificado}`;
    const message = `Olá ${brief.nome}! Seu áudio foi certificado digitalmente sob nº ${brief.numero_certificado}. Verifique aqui: ${verifyUrl}`;
    return `https://wa.me/${brief.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const CheckItem = ({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) => (
    <button onClick={onClick} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
      {checked ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
      <span className={checked ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </button>
  );

  const isEditing = (id: string) => editingBrief === id;

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-bold">
              <span className="text-gradient-gold">SANZONY</span>
              <span className="text-muted-foreground">.VOZ</span>
            </span>
            <span className="ml-3 text-xs bg-primary/10 text-primary px-2 py-1 rounded">ADMIN</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm hidden md:inline">{user?.email}</span>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl font-bold">
            <span className="text-gradient-gold">Briefings</span>
          </h1>
          <div className="flex bg-secondary/30 p-1 rounded-lg border border-border">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter("pago")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === "pago" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Pagos
            </button>
            <button
              onClick={() => setFilter("pendente")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === "pendente" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setFilter("certificado")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === "certificado" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Certificados
            </button>
          </div>
          <button onClick={fetchBriefs} className="text-muted-foreground hover:text-primary transition-colors">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        <AdminStats briefs={briefs} />

        {briefs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
            <p>Nenhum briefing recebido ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {briefs
              .filter((b) => {
                if (filter === "pago") return b.pago;
                if (filter === "pendente") return !b.pago;
                if (filter === "certificado") return b.certificado_gerado;
                return true;
              })
              .map((brief) => (
              <div key={brief.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedBrief(expandedBrief === brief.id ? null : brief.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">{brief.nome}</p>
                      <p className="text-sm text-muted-foreground">{brief.empresa || "—"} · {brief.tipo_locucao}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {brief.certificado_gerado && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{brief.numero_certificado}</span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${brief.pago ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                      {brief.pago ? "Pago" : "Pendente"}
                    </span>
                    {expandedBrief === brief.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {expandedBrief === brief.id && (
                  <div className="px-6 pb-6 border-t border-border pt-4">
                    {/* Edit / Delete toolbar */}
                    <div className="flex items-center gap-2 mb-4">
                      {isEditing(brief.id) ? (
                        <>
                          <Button size="sm" onClick={() => saveEditing(brief.id)} className="bg-gradient-gold text-primary-foreground">
                            <Save className="h-4 w-4 mr-1" /> Salvar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingBrief(null)}>
                            <X className="h-4 w-4 mr-1" /> Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => startEditing(brief)}>
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4 mr-1" /> Apagar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Apagar briefing</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja apagar este briefing? Esta ação não pode ser desfeita.
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

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Brief details */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Dados do Cliente</h3>
                        {isEditing(brief.id) ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-muted-foreground">Nome</label>
                              <Input value={editData.nome || ""} onChange={(e) => setEditData({ ...editData, nome: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Empresa</label>
                              <Input value={editData.empresa || ""} onChange={(e) => setEditData({ ...editData, empresa: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Email</label>
                              <Input value={editData.email || ""} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">WhatsApp</label>
                              <Input value={editData.whatsapp || ""} onChange={(e) => setEditData({ ...editData, whatsapp: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Tipo de Locução</label>
                              <Input value={editData.tipo_locucao || ""} onChange={(e) => setEditData({ ...editData, tipo_locucao: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Tom</label>
                              <Input value={editData.tom || ""} onChange={(e) => setEditData({ ...editData, tom: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Região</label>
                              <Input value={editData.regiao || ""} onChange={(e) => setEditData({ ...editData, regiao: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Período</label>
                              <Input value={editData.periodo || ""} onChange={(e) => setEditData({ ...editData, periodo: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Texto</label>
                              <Textarea value={editData.texto || ""} onChange={(e) => setEditData({ ...editData, texto: e.target.value })} rows={5} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2 text-sm">
                              <p><span className="text-muted-foreground">Email:</span> {brief.email}</p>
                              <p><span className="text-muted-foreground">WhatsApp:</span> {brief.whatsapp}</p>
                              <p><span className="text-muted-foreground">Tom:</span> {brief.tom || "—"}</p>
                              <p><span className="text-muted-foreground">Região:</span> {brief.regiao || "—"}</p>
                              <p><span className="text-muted-foreground">Período:</span> {brief.periodo || "—"}</p>
                            </div>
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider pt-2">Texto</h3>
                            <p className="text-sm bg-secondary p-3 rounded">{brief.texto}</p>
                          </>
                        )}
                      </div>

                      {/* Checklist & Actions */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Checklist</h3>
                        <div className="space-y-2">
                          <CheckItem checked={brief.brief_recebido} label="Brief recebido" onClick={() => toggleField(brief.id, "brief_recebido", !brief.brief_recebido)} />
                          <CheckItem checked={brief.pago} label="Pago" onClick={() => toggleField(brief.id, "pago", !brief.pago)} />
                          <CheckItem checked={brief.audio_entregue} label="Áudio entregue" onClick={() => toggleField(brief.id, "audio_entregue", !brief.audio_entregue)} />
                          <CheckItem checked={brief.certificado_gerado} label="Certificado gerado" onClick={() => toggleField(brief.id, "certificado_gerado", !brief.certificado_gerado)} />
                          <CheckItem checked={brief.enviado_cliente} label="Enviado ao cliente" onClick={() => toggleField(brief.id, "enviado_cliente", !brief.enviado_cliente)} />
                        </div>

                        {brief.hash_sha256 && (
                          <div className="pt-2">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Hash SHA-256</h3>
                            <p className="text-xs font-mono bg-secondary p-2 rounded break-all mt-1">{brief.hash_sha256}</p>
                          </div>
                        )}

                        {brief.certificado_gerado && brief.certificado_url && (
                          <div className="flex flex-col gap-2 pt-2">
                            <a
                              href={brief.certificado_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-md hover:bg-primary/20 transition-colors text-sm font-semibold"
                            >
                              <Award className="h-4 w-4" />
                              Baixar Certificado PDF
                            </a>
                            {brief.numero_certificado && (
                              <div className="flex items-center gap-3 mt-1">
                                <Shield className="h-4 w-4 text-primary" />
                                <span className="text-xs text-muted-foreground">QR Code incluso no PDF · Verificação: /verificar/{brief.numero_certificado}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col gap-2 pt-4">
                          {/* Upload audio */}
                          <label className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2 rounded-md cursor-pointer hover:bg-secondary/80 transition-colors text-sm">
                            <Upload className="h-4 w-4" />
                            {brief.audio_filename || "Upload Áudio (.mp3/.wav)"}
                            <input
                              type="file"
                              accept=".mp3,.wav"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleAudioUpload(brief.id, file);
                              }}
                            />
                          </label>

                          {/* Generate certificate */}
                          <button
                            onClick={() => generateCertificate(brief.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md hover:opacity-90 transition-opacity text-sm font-semibold ${
                              brief.certificado_gerado ? "bg-secondary text-foreground border border-border" : "bg-gradient-gold text-primary-foreground"
                            }`}
                          >
                            <Award className="h-4 w-4" />
                            {brief.certificado_gerado ? "Regerar Certificado (Update)" : "Gerar Certificado"}
                          </button>

                          {/* WhatsApp - sends text + PDF + audio */}
                          {brief.certificado_gerado && (
                            <a
                              href={getWhatsAppMessage(brief)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => toggleField(brief.id, "enviado_cliente", true)}
                              className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors text-sm"
                            >
                              <Send className="h-4 w-4" />
                              Enviar via WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs mt-12">
          <Shield className="h-3 w-3 text-primary" />
          <span>Painel protegido — Sanzony.Voz™</span>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

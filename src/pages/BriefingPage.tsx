import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, ArrowLeft, Send, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const voiceTypes = [
  "Comercial",
  "Institucional",
  "Publicitária",
  "URA / Espera Telefônica",
  "Documentário",
  "E-learning",
  "Outro",
];

const toneOptions = [
  "Sério / Corporativo",
  "Alegre / Descontraído",
  "Emocional / Dramático",
  "Enérgico / Dinâmico",
  "Calmo / Suave",
  "Autoritário / Confiante",
];

const BriefingPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    email: "",
    whatsapp: "",
    tipo_locucao: "",
    texto: "",
    tom: "",
    regiao: "",
    periodo: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("briefs").insert({
      nome: formData.nome.trim(),
      empresa: formData.empresa.trim() || null,
      email: formData.email.trim(),
      whatsapp: formData.whatsapp.trim(),
      tipo_locucao: formData.tipo_locucao,
      texto: formData.texto.trim(),
      tom: formData.tom || null,
      regiao: formData.regiao.trim() || null,
      periodo: formData.periodo.trim() || null,
    });

    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Brief enviado com sucesso!", description: "Entraremos em contato em até 24 horas." });
      setFormData({ nome: "", empresa: "", email: "", whatsapp: "", tipo_locucao: "", texto: "", tom: "", regiao: "", periodo: "" });
    }
    setLoading(false);
  };

  const inputClasses =
    "w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors";
  const labelClasses = "block text-sm font-medium text-muted-foreground mb-2";

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <Mic className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-bold tracking-wide">
              <span className="text-gradient-gold">SANZONY</span>
              <span className="text-muted-foreground">.VOZ</span>
            </span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 pt-28 pb-16 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="text-center mb-12">
            <p className="text-primary tracking-[0.2em] uppercase text-sm font-medium mb-4">Orçamento</p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Solicite seu <span className="text-gradient-gold">Briefing</span>
            </h1>
            <p className="text-muted-foreground">Preencha os dados abaixo e receba sua proposta em até 24 horas.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Nome completo *</label>
                <input name="nome" value={formData.nome} onChange={handleChange} required className={inputClasses} placeholder="Seu nome" />
              </div>
              <div>
                <label className={labelClasses}>Empresa</label>
                <input name="empresa" value={formData.empresa} onChange={handleChange} className={inputClasses} placeholder="Nome da empresa" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>E-mail *</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} required className={inputClasses} placeholder="seu@email.com" />
              </div>
              <div>
                <label className={labelClasses}>WhatsApp *</label>
                <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} required className={inputClasses} placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Tipo de Locução *</label>
              <select name="tipo_locucao" value={formData.tipo_locucao} onChange={handleChange} required className={inputClasses}>
                <option value="">Selecione...</option>
                {voiceTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Texto para locução *</label>
              <textarea name="texto" value={formData.texto} onChange={handleChange} required rows={5} className={inputClasses} placeholder="Cole aqui o texto que deseja gravar..." />
            </div>
            <div>
              <label className={labelClasses}>Tom de voz desejado</label>
              <select name="tom" value={formData.tom} onChange={handleChange} className={inputClasses}>
                <option value="">Selecione...</option>
                {toneOptions.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Região de veiculação</label>
                <input name="regiao" value={formData.regiao} onChange={handleChange} className={inputClasses} placeholder="Ex: Nacional, São Paulo, etc." />
              </div>
              <div>
                <label className={labelClasses}>Período de uso</label>
                <input name="periodo" value={formData.periodo} onChange={handleChange} className={inputClasses} placeholder="Ex: 30 dias, 1 ano, etc." />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-gold text-primary-foreground py-4 rounded-md font-semibold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 glow-gold disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
              {loading ? "Enviando..." : "Enviar Briefing"}
            </button>
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs mt-4">
              <Shield className="h-3 w-3 text-primary" />
              <span>Seus dados estão protegidos e não serão compartilhados.</span>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default BriefingPage;

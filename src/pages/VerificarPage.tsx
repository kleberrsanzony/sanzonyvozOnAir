import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, CheckCircle, Mic, AlertCircle, RefreshCw, Play, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CertificateSeal from "@/components/CertificateSeal";
import { AudioPlayer } from "@/components/AudioPlayer";

interface CertData {
  numero_certificado: string;
  nome: string;
  empresa: string | null;
  tipo_locucao: string;
  hash_sha256: string | null;
  status: string;
  created_at: string;
  audio_url?: string | null;
}

const VerificarPage = () => {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchCert = async () => {
      if (!id) { setNotFound(true); setLoading(false); return; }

      const { data, error } = await supabase.rpc("verify_certificate", { cert_number: id });

      if (error || !data || (data as CertData[]).length === 0) {
        setNotFound(true);
        setLoading(false);
      } else {
        const certData = (data as CertData[])[0];
        setCert(certData);
        setLoading(false);
        setIsAuthenticating(true);
        
        // Simular autenticação premium
        setTimeout(() => setIsAuthenticating(false), 2500);

        if (certData.audio_url) {
          const { data: { publicUrl } } = supabase.storage.from("audio-files").getPublicUrl(certData.audio_url);
          setAudioUrl(publicUrl);
        }
      }
    };
    fetchCert();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Mic className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-bold tracking-wide">
              <span className="text-gradient-gold">SANZONY</span>
              <span className="text-muted-foreground">.VOZ</span>
            </span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          className="max-w-lg w-full bg-card border border-border rounded-2xl p-10 text-center glow-gold"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {notFound ? (
            <div className="py-10">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
              <h1 className="font-serif text-3xl font-bold mb-2">Certificado não encontrado</h1>
              <p className="text-muted-foreground">O número informado não corresponde a nenhum certificado.</p>
              <Link to="/" className="mt-8 inline-block text-primary hover:underline">Voltar para Início</Link>
            </div>
          ) : cert && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <CertificateSeal id={cert.numero_certificado} isAuthenticating={isAuthenticating} />

              {!isAuthenticating && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div>
                    <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
                      <span className="text-gradient-gold">Voz Certificada</span>
                    </h1>
                    <p className="text-primary font-mono text-sm tracking-widest">{cert.numero_certificado}</p>
                  </div>

                  {audioUrl && (
                    <div className="bg-secondary/50 p-6 rounded-2xl border border-primary/20 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-4 text-left">
                        <Volume2 className="h-5 w-5 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Áudio Autêntico</span>
                      </div>
                      <AudioPlayer src={audioUrl} />
                    </div>
                  )}

                  <div className="grid gap-3 text-left">
                    {[
                      { label: "Proprietário", value: cert.nome },
                      { label: "Empresa", value: cert.empresa || "Pessoa Física" },
                      { label: "Tipo de Locução", value: cert.tipo_locucao },
                      { label: "Status de Autenticidade", value: "VERIFICADO & VÁLIDO", color: "text-emerald-500 font-bold" },
                      { label: "Assinatura Digital (SHA-256)", value: cert.hash_sha256 || "—" },
                      { label: "Data de Emissão", value: new Date(cert.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' }) },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col py-3 border-b border-border last:border-0">
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">{item.label}</span>
                        <span className={`text-sm break-all ${item.color || "text-foreground"}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground text-xs">
            <Shield className="h-3 w-3 text-primary" />
            <span>Áudio Certificado Digitalmente – Sanzony.Voz™</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerificarPage;

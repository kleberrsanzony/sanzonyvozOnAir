import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, CheckCircle, Mic, AlertCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface CertData {
  numero_certificado: string;
  nome: string;
  empresa: string | null;
  tipo_locucao: string;
  hash_sha256: string | null;
  status: string;
  created_at: string;
}

const VerificarPage = () => {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchCert = async () => {
      if (!id) { setNotFound(true); setLoading(false); return; }

      const { data, error } = await supabase.rpc("verify_certificate", { cert_number: id });

      if (error || !data || (data as CertData[]).length === 0) {
        setNotFound(true);
      } else {
        setCert((data as CertData[])[0]);
      }
      setLoading(false);
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
            <>
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
              <h1 className="font-serif text-3xl font-bold mb-2">Certificado não encontrado</h1>
              <p className="text-muted-foreground">O número informado não corresponde a nenhum certificado.</p>
            </>
          ) : cert && (
            <>
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="font-serif text-3xl font-bold mb-2">Certificado Verificado</h1>
              <p className="text-primary font-mono text-lg mb-8">{cert.numero_certificado}</p>

              <div className="space-y-4 text-left">
                {[
                  { label: "Cliente", value: cert.nome },
                  { label: "Empresa", value: cert.empresa || "—" },
                  { label: "Tipo", value: cert.tipo_locucao },
                  { label: "Hash SHA-256", value: cert.hash_sha256 || "—" },
                  { label: "Status", value: cert.status },
                  { label: "Data de Emissão", value: new Date(cert.created_at).toLocaleDateString("pt-BR") },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                    <span className="text-muted-foreground text-sm">{item.label}</span>
                    <span className="font-medium text-sm text-right max-w-[60%] break-all">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
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

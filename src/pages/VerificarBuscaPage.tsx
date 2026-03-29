import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Search, Mic } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const VerificarBuscaPage = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/verificar/${encodeURIComponent(trimmed)}`);
    }
  };

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
          <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="font-serif text-3xl font-bold mb-2">Verificar Certificado</h1>
          <p className="text-muted-foreground mb-8">
            Digite o número do certificado (ex: SVZ-2025-06-001) ou o hash SHA-256 para verificar a autenticidade.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SVZ-2025-06-001 ou hash SHA-256..."
                className="pl-10 h-12 font-mono text-sm"
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90 relative overflow-hidden group">
              <span className="relative z-10">Verificar Autenticidade</span>
              <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground text-xs">
            <Shield className="h-3 w-3 text-primary" />
            <span>Áudio Certificado Digitalmente – Sanzony.Voz™</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerificarBuscaPage;

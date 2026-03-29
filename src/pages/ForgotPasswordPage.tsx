import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, ArrowLeft, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email.toLowerCase() !== "sanzonyvoz@gmail.com") {
      toast({
        title: "E-mail não autorizado",
        description: "A recuperação de senha é permitida apenas para o administrador oficial.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: "Erro ao enviar e-mail",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "E-mail enviado!",
        description: "Confira sua caixa de entrada para redefinir sua senha.",
      });
    }
    setLoading(false);
  };

  const inputClasses =
    "w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-md bg-card border border-border rounded-2xl p-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center gap-2 mb-6">
            <Mic className="h-8 w-8 text-primary" />
            <span className="font-serif text-2xl font-bold">
              <span className="text-gradient-gold">SANZONY</span>
              <span className="text-muted-foreground">.VOZ</span>
            </span>
          </Link>
          <h1 className="font-serif text-2xl font-bold">Recuperar Senha</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Enviaremos um link para o seu e-mail
          </p>
        </div>

        <form onSubmit={handleResetRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Seu e-mail de acesso
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClasses}
              placeholder="exemplo@email.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-gold text-primary-foreground py-3 rounded-md font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {loading ? "Enviando..." : "Enviar Link de Recuperação"}
          </button>
        </form>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors mt-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o Login
        </Link>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;

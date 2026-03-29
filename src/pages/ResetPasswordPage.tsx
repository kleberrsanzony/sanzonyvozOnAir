import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Shield, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have a session (user clicked the link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sessão expirada",
          description: "O link de recuperação parece ser inválido ou expirou.",
          variant: "destructive",
        });
        navigate("/login");
      }
    };
    checkSession();
  }, [navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "As senhas digitadas precisam ser idênticas.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSuccess(true);
      toast({
        title: "Senha atualizada!",
        description: "Sua nova senha já está valendo. Redirecionando...",
      });
      setTimeout(() => navigate("/login"), 3000);
    }
    setLoading(false);
  };

  const inputClasses =
    "w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors";

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
           className="w-full max-w-md bg-card border border-border rounded-2xl p-10 text-center"
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
        >
          <div className="flex justify-center mb-6">
             <CheckCircle className="h-16 w-16 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-bold mb-4">Senha redefinida!</h1>
          <p className="text-muted-foreground mb-8 text-sm">
             Sua nova senha foi salva com sucesso no sistema.
          </p>
          <button
             onClick={() => navigate("/login")}
             className="w-full bg-gradient-gold text-primary-foreground py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
          >
             Voltar ao Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-md bg-card border border-border rounded-2xl p-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <Mic className="h-8 w-8 text-primary" />
            <span className="font-serif text-2xl font-bold">
              <span className="text-gradient-gold">SANZONY</span>
              <span className="text-muted-foreground">.VOZ</span>
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold">Nova Senha</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Digite sua nova senha de acesso
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Nova Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClasses}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={inputClasses}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-gold text-primary-foreground py-3 rounded-md font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Redefinir Minha Senha"}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs mt-6">
          <Shield className="h-3 w-3 text-primary" />
          <span>Acesso Protegido — Sanzony.Voz™</span>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;

import { motion } from "framer-motion";
import { Briefcase, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface Brief {
  id: string;
  status: string;
}

interface AdminStatsProps {
  briefs: Brief[];
}

const AdminStats = ({ briefs }: AdminStatsProps) => {
  const total = briefs.length;
  const inProduction = briefs.filter((b) => b.status === 'em_producao' || b.status === 'fila_producao').length;
  const readyToSend = briefs.filter((b) => b.status === 'pronto_envio').length;
  const delivered = briefs.filter((b) => b.status === 'entregue').length;

  const stats = [
    {
      label: "Total de Briefings",
      value: total,
      icon: Briefcase,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Em Produção",
      value: inProduction,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Prontos p/ Enviar",
      value: readyToSend,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Entregues",
      value: delivered,
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card border border-border p-4 rounded-xl shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {stat.label}
              </p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AdminStats;

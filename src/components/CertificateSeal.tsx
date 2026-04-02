import { motion } from "framer-motion";
import { Mic, ShieldCheck } from "lucide-react";

interface CertificateSealProps {
  id: string;
  isAuthenticating?: boolean;
}

const CertificateSeal = ({ id, isAuthenticating = false }: CertificateSealProps) => {
  return (
    <div className="relative flex items-center justify-center w-64 h-64 mx-auto">
      {/* Outer Glow */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"
      />

      {/* Rotating Border */}
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-rotate-slow" />

      {/* Main Seal Body */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-48 h-48 rounded-full bg-gradient-dark border-4 border-primary shadow-2xl flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Shimmer Overlay */}
        <div className="absolute inset-0 animate-shimmer pointer-events-none" />

        {isAuthenticating ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <ShieldCheck className="h-16 w-16 text-primary/50" />
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center"
            >
              <Mic className="h-12 w-12 text-primary mb-2" />
              <div className="text-center">
                <p className="font-serif text-sm font-bold tracking-tighter text-gradient-gold">
                  SANZONY.VOZ
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
                  Autêntico
                </p>
              </div>
            </motion.div>

            {/* Verification Checkmark */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, type: "spring" }}
              className="absolute -right-2 -top-2 bg-primary text-black p-2 rounded-full shadow-lg"
            >
              <ShieldCheck className="h-6 w-6" />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Certificate ID Tag */}
      {!isAuthenticating && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-secondary border border-border px-4 py-1 rounded-full text-[10px] font-mono whitespace-nowrap"
        >
          ID: {id}
        </motion.div>
      )}
    </div>
  );
};

export default CertificateSeal;

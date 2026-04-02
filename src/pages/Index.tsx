import { motion } from "framer-motion";
import { Mic, Award, Shield, Headphones, FileText, Phone } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import certifiedSeal from "@/assets/certified-seal.png";
import { Link } from "react-router-dom";
import CertificateSeal from "@/components/CertificateSeal";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
    <div className="container mx-auto px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <Mic className="h-6 w-6 text-primary" />
        <span className="font-serif text-xl font-bold tracking-wide">
          <span className="text-gradient-gold">SANZONY</span>
          <span className="text-muted-foreground">.VOZ</span>
        </span>
      </Link>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium">
        <a href="#sobre" className="text-muted-foreground hover:text-primary transition-colors">Sobre</a>
        <a href="#servicos" className="text-muted-foreground hover:text-primary transition-colors">Serviços</a>
        <a href="#como-funciona" className="text-muted-foreground hover:text-primary transition-colors">Como Funciona</a>
        <a href="#certificado" className="text-muted-foreground hover:text-primary transition-colors">Certificado</a>
        <a href="#depoimentos" className="text-muted-foreground hover:text-primary transition-colors">Depoimentos</a>
        <Link to="/verificar" className="text-muted-foreground hover:text-primary transition-colors">Verificar</Link>
        <Link
          to="/briefing"
          className="bg-gradient-gold text-primary-foreground px-5 py-2 rounded-md font-semibold hover:opacity-90 transition-opacity"
        >
          Solicitar Orçamento
        </Link>
      </div>
    </div>
  </nav>
);

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0">
      <img src={heroBg} alt="Studio" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-background/75" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
    </div>
    <div className="relative container mx-auto px-6 text-center pt-20">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} custom={0}>
        <p className="text-primary font-medium tracking-[0.3em] uppercase text-sm mb-6">
          Studio de Locução Comercial & Publicitária
        </p>
      </motion.div>
      <motion.h1
        className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
        initial="hidden" animate="visible" variants={fadeInUp} custom={1}
      >
        <span className="text-gradient-gold">SANZONY</span>
        <span className="text-foreground">.VOZ</span>
      </motion.h1>
      <motion.p
        className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10"
        initial="hidden" animate="visible" variants={fadeInUp} custom={2}
      >
        Locução profissional com certificação digital de autenticidade. 
        Cada áudio é único, registrado e protegido.
      </motion.p>
      <motion.div
        className="flex flex-col sm:flex-row gap-4 justify-center"
        initial="hidden" animate="visible" variants={fadeInUp} custom={3}
      >
        <Link
          to="/briefing"
          className="bg-gradient-gold text-primary-foreground px-8 py-4 rounded-md font-semibold text-lg hover:opacity-90 transition-opacity glow-gold"
        >
          Solicitar Orçamento
        </Link>
        <a
          href="#certificado"
          className="border border-primary/30 text-primary px-8 py-4 rounded-md font-semibold text-lg hover:bg-primary/10 transition-colors"
        >
          Saiba Mais
        </a>
      </motion.div>
      <motion.div
        className="mt-16 flex items-center justify-center gap-3 text-muted-foreground text-sm"
        initial="hidden" animate="visible" variants={fadeInUp} custom={4}
      >
        <Shield className="h-4 w-4 text-primary" />
        <span>Áudio Certificado Digitalmente – Sanzony.Voz™</span>
      </motion.div>
    </div>
  </section>
);

const AboutSection = () => (
  <section id="sobre" className="py-24 bg-gradient-dark">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-primary tracking-[0.2em] uppercase text-sm font-medium mb-4">O Locutor</p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            Voz que transmite <span className="text-gradient-gold">autoridade</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Com anos de experiência em locução comercial e publicitária, o Studio Sanzony.Voz entrega
            produções de áudio com qualidade internacional. Cada projeto é tratado com exclusividade,
            garantindo a interpretação perfeita para sua marca.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Trabalhamos com as maiores agências e marcas, oferecendo não apenas uma voz, mas uma 
            experiência sonora completa com certificação digital de autenticidade.
          </p>
        </motion.div>
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="bg-card rounded-lg p-8 border border-border glow-gold">
            <div className="grid grid-cols-2 gap-6">
              {[
                { num: "500+", label: "Projetos Entregues" },
                { num: "150+", label: "Clientes Ativos" },
                { num: "10+", label: "Anos de Experiência" },
                { num: "100%", label: "Certificados Emitidos" },
              ].map((s, i) => (
                <div key={i} className="text-center p-4">
                  <p className="font-serif text-3xl font-bold text-gradient-gold">{s.num}</p>
                  <p className="text-muted-foreground text-sm mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const services = [
  { icon: Mic, title: "Locução Comercial", desc: "Spots para rádio, TV e mídias digitais com interpretação profissional." },
  { icon: Headphones, title: "Locução Publicitária", desc: "Campanhas publicitárias com voz que vende e convence." },
  { icon: FileText, title: "Locução Institucional", desc: "Vídeos corporativos, apresentações e treinamentos." },
  { icon: Phone, title: "URA & Espera", desc: "Mensagens telefônicas profissionais para sua empresa." },
  { icon: Award, title: "Certificação Digital", desc: "Cada áudio recebe certificado de autenticidade com hash SHA-256." },
  { icon: Shield, title: "Proteção Jurídica", desc: "Documentação completa para proteção dos direitos de uso." },
];

const ServicesSection = () => (
  <section id="servicos" className="py-24">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
        <p className="text-primary tracking-[0.2em] uppercase text-sm font-medium mb-4">Serviços</p>
        <h2 className="font-serif text-4xl md:text-5xl font-bold">
          Soluções em <span className="text-gradient-gold">Locução</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s, i) => (
          <motion.div
            key={i}
            className="bg-card border border-border rounded-lg p-8 hover:border-primary/30 transition-colors group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <s.icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-serif text-xl font-semibold mb-3">{s.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const steps = [
  { num: "01", title: "Briefing", desc: "Envie os detalhes do seu projeto pelo formulário." },
  { num: "02", title: "Proposta", desc: "Receba o orçamento e condições em até 24h." },
  { num: "03", title: "Produção", desc: "Gravação e edição profissional no studio." },
  { num: "04", title: "Certificação", desc: "Áudio certificado digitalmente com hash SHA-256." },
  { num: "05", title: "Entrega", desc: "Receba o áudio + certificado de autenticidade." },
];

const HowItWorksSection = () => (
  <section id="como-funciona" className="py-24 bg-gradient-dark">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
        <p className="text-primary tracking-[0.2em] uppercase text-sm font-medium mb-4">Processo</p>
        <h2 className="font-serif text-4xl md:text-5xl font-bold">
          Como <span className="text-gradient-gold">Funciona</span>
        </h2>
      </div>
      <div className="max-w-3xl mx-auto">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            className="flex gap-6 mb-8 last:mb-0"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">{s.num}</span>
            </div>
            <div className="pt-2">
              <h3 className="font-serif text-xl font-semibold mb-1">{s.title}</h3>
              <p className="text-muted-foreground">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const CertificateSection = () => (
  <section id="certificado" className="py-24">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative flex justify-center"
        >
          <div className="relative group">
            <CertificateSeal id="SVZ-2026-MODEL" />
            <div className="absolute inset-0 glow-gold-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-primary tracking-[0.2em] uppercase text-sm font-medium mb-4">Diferencial</p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            Áudio Certificado <span className="text-gradient-gold">Digitalmente</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Cada locução produzida pelo Studio Sanzony.Voz recebe um certificado digital de 
            autenticidade com tecnologia SHA-256, garantindo a integridade e originalidade do áudio.
          </p>
          <ul className="space-y-3">
            {[
              "Hash SHA-256 único para cada arquivo",
              "Número sequencial rastreável (SVZ-ANO-MES-XXX)",
              "QR Code para verificação pública instantânea",
              "Documento jurídico com validade legal",
              "Proteção contra uso indevido",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-muted-foreground">
                <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  </section>
);

const testimonials = [
  {
    name: "Carlos Mendes",
    company: "Agência Nexus",
    text: "A qualidade da locução e a certificação digital trouxeram um nível de profissionalismo incrível para nossas campanhas.",
  },
  {
    name: "Ana Beatriz",
    company: "Rádio Metropolitana",
    text: "Trabalhamos com o Sanzony há anos. A entrega é sempre impecável e o certificado é um diferencial enorme.",
  },
  {
    name: "Ricardo Oliveira",
    company: "Grupo Mídia Total",
    text: "O sistema de certificação digital nos deu segurança jurídica completa. Recomendo sem hesitar.",
  },
];

const TestimonialsSection = () => (
  <section id="depoimentos" className="py-24 bg-gradient-dark">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
        <p className="text-primary tracking-[0.2em] uppercase text-sm font-medium mb-4">Depoimentos</p>
        <h2 className="font-serif text-4xl md:text-5xl font-bold">
          O que dizem nossos <span className="text-gradient-gold">clientes</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            className="bg-card border border-border rounded-lg p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
          >
            <p className="text-muted-foreground italic leading-relaxed mb-6">"{t.text}"</p>
            <div>
              <p className="font-semibold">{t.name}</p>
              <p className="text-primary text-sm">{t.company}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const CTASection = () => (
  <section className="py-24">
    <div className="container mx-auto px-6">
      <motion.div
        className="bg-card border border-primary/20 rounded-2xl p-12 md:p-16 text-center glow-gold"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
          Pronto para dar <span className="text-gradient-gold">voz</span> ao seu projeto?
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
          Solicite um orçamento sem compromisso e receba sua proposta em até 24 horas.
        </p>
        <Link
          to="/briefing"
          className="inline-block bg-gradient-gold text-primary-foreground px-10 py-4 rounded-md font-semibold text-lg hover:opacity-90 transition-opacity glow-gold relative overflow-hidden group"
        >
          <span className="relative z-10">Solicitar Orçamento Agora</span>
          <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Link>
      </motion.div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          <span className="font-serif text-lg font-bold">
            <span className="text-gradient-gold">SANZONY</span>
            <span className="text-muted-foreground">.VOZ</span>
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} Sanzony.Voz — Studio de Locução. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Shield className="h-3 w-3 text-primary" />
          <span>Áudio Certificado Digitalmente™</span>
        </div>
      </div>
    </div>
  </footer>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <HowItWorksSection />
      <CertificateSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;

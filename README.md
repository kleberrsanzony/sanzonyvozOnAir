# 🎙️ Sanzony.Voz — Studio de Locução & Automação

Bem-vindo ao coração tecnológico do Sanzony.Voz. Este projeto é uma plataforma administrativa de alta performance dedicada à gestão de briefings, faturamento e entrega automatizada de produções de voz.

---

## 🚀 Funcionalidades Principais

- **📦 Gestão de Briefings:** Fluxo completo desde o recebimento até a entrega.
- **⚡ Automação WhatsApp (Evolution API v2):** Disparo automático de mensagens pós-upload.
- **📜 Certificado de Autenticidade:** Geração dinâmica de PDFs com selo de garantia.
- **📂 Entrega MP3:** Sistema de hospedagem e entrega de áudios via link público seguro.
- **🔐 Painel Admin:** Controle total de status (Pendente, Pago, Em Revisão, Entregue).

---

## 🛠️ Stack Tecnológica

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS + Shadcn/UI
- **Backend/DB:** Supabase (Auth, PostgreSQL, Storage)
- **API de Mensagens:** Evolution API v2 (Baileys)
- **Hospedagem:** Vercel

---

## 🤖 Fluxo de Automação de Entrega

O sistema utiliza um motor de automação (`automationService.ts`) que orquestra as seguintes ações simultâneas ao realizar o upload de um áudio:

1. **Upload:** Salva o arquivo no bucket `audio-files` do Supabase.
2. **Certificação:** Gera o PDF de autenticidade SVZ.
3. **Notificação:** Envia o briefing detalhado para o WhatsApp do cliente.
4. **Documentação:** Envia o Certificado PDF diretamente no chat.
5. **Voz:** Envia a locução final em formato `.mp3` para download imediato.

---

## 📖 Documentação Técnica Detalhada

Para detalhes de configuração de API, variáveis de ambiente e troubleshooting, consulte:

- 📑 [Guia de Integração WhatsApp](./WHATSAPP_INTEGRATION.md)

---

## 🛠️ Desenvolvimento Local

1.  Clone o repositório.
2.  Instale as dependências: `npm install`
3.  Configure o arquivo `.env` com as chaves do Supabase e Evolution API.
4.  Rode o ambiente de dev: `npm run dev`

---
🎧 **Sanzony.Voz** — *A voz que marca, a tecnologia que entrega.*

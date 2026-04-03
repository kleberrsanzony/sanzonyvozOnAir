# 🎙️ Sanzony.Voz — Studio de Locução & Automação

Este documento descreve a arquitetura de entrega automatizada do Sanzony.Voz, operando com o motor **Evolution API v2** rodando em **AWS (EC2/Docker)** para garantir máxima latência zero e controle total sobre o processamento de mídias.

---

## 🚀 Funcionalidades Principais

- **📦 Gestão de Briefings:** Fluxo completo desde o recebimento até a entrega.
- **⚡ Automação WhatsApp (AWS v2.0 Stable):** Disparo automático de mensagens via AWS EC2.
- **📜 Certificado de Autenticidade:** Geração dinâmica de PDFs com selo de garantia.
- **📂 Entrega MP3:** Sistema de hospedagem e entrega de áudios via link público seguro.
- **🔐 Painel Admin:** Controle total de status (Pendente, Pago, Em Revisão, Entregue) integrado ao Supabase.

---

## 🛠️ Stack Tecnológica

1.  **💻 Frontend (Vercel):** Hospeda o painel administrativo sanzonyvozOnAir.
2.  **🧠 Motor de Mensagens (AWS):** Hospeda a **Evolution API v2.x** em sua instância EC2.
3.  **🗄️ Backend & Mídias (Supabase):** PostgreSQL para persistência de dados e Storage para áudios/PDFs.

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

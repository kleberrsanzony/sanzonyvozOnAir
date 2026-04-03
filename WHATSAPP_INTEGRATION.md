# 🟢 Guia de Integração WhatsApp - Sanzony.Voz (Local Engine)

Este documento descreve a arquitetura de entrega automatizada do Sanzony.Voz, operando com o motor **Evolution API v2** rodando em **AWS (EC2/Docker)** para garantir máxima latência zero e controle total sobre o processamento de mídias.

---

## 🏛️ Arquitetura de Redes

## 🛠️ Stack Tecnológica

1.  **💻 Frontend (Vercel):** Hospeda o painel administrativo sanzonyvozOnAir (Linkado ao Proxy Cloudflare).
2.  **🧠 Motor de Mensagens (AWS):** Evolution API v2 rodando em Docker na EC2 (`18.207.129.86`).
3.  **🛡️ Segurança (Cloudflare Tunnel):** Bridge HTTPS que resolve o erro de *Mixed Content* entre Vercel (HTTPS) e AWS (HTTP).
4.  **🗄️ Backend & Mídias (Supabase):** PostgreSQL para persistência e Storage para mídias (Áudio/Certificados).

### 7. Branding & Social Preview
A identidade visual do sistema (o que aparece quando você compartilha o link no WhatsApp) é controlada via Meta Tags no `index.html` e uma imagem fixa.

- **Imagem de Preview:** Localizada em `public/og-image.png`.
- **Tamanho Ideal:** 1024x1024 (Quadrado) ou 1200x630 (Retangular).
- **Como trocar:** 
  1. Prepare sua nova imagem (PNG ou JPG).
  2. Renomeie para `og-image.png`.
  3. Substitua o arquivo em `public/og-image.png`.
  4. Faça o Push para o GitHub.
- **Cache do WhatsApp:** Se a imagem não atualizar na hora após o deploy, use o [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) para "forçar uma raspagem" (Scrape Again) da URL `sanzonyvoz.com.br`.

---
# 🟢 Guia Mestre: Integração WhatsApp (Sanzony.Voz) — Cloud AWS

Este é o manual operacional final da infraestrutura da Sanzony.Voz, migrada para a AWS EC2 em Abril de 2026.

---

## 🏛️ Arquitetura de Produção

*   **DNS & Frontend:** Gerenciados pela **Vercel**.
*   **API Principal:** Evolution API v2 em Docker na AWS.
*   **Domínio Oficial da API:** `https://api.sanzonyvoz.com.br`
*   **Certificado:** SSL (Let's Encrypt) ativo via Certbot.

---

## 📍 Credenciais e Endpoints

### 📲 Variáveis de Ambiente (Vercel)
Estas variáveis **DEVEM** estar no dashboard da Vercel para que### 1. Motor de Mensagens (API)
*   **Base URL (Vercel Proxy):** `https://api.sanzonyvoz.com.br`
    *   *Nota:* Use este endereço na variável `VITE_EVOLUTION_API_URL` da Vercel.
    *   *Link de Verificação:* `https://sanzonyvoz.com.br/verificar/{numero_certificado}`
*   **Endereço Físico (AWS):** `http://18.207.129.86:8080` (Acesso direto via HTTP bloqueado por CORS no Chrome).
*   **Master API Key:** `sanzony_voz_master_key_2026`
*   **AWS IP Público:** `18.207.129.86`

---

## 🛰️ Configuração do Servidor (AWS EC2)

### 1. Firewall (Security Groups)
Para o sistema funcionar, as seguintes portas devem estar **Abertas (Inbound)**:
*   `22 (SSH)` -> Para acesso remoto.
*   `80 (HTTP)` -> Para renovação de certificado e redirecionamento.
*   `443 (HTTPS)` -> Para o tráfego seguro da API.
*   `3000 (TCP)` -> Para acesso ao Manager UI (via IP).
*   `8080 (TCP)` -> Porta interna da Evolution API.

### 2. Comandos de Manutenção (SSH)
```bash
# Entrar na pasta do projeto
cd ~/whatsapp-api

# Reiniciar todos os containers (API, Manager, Banco de Dados, Redis)
docker-compose restart

# Ver logs em tempo real
docker-compose logs -f --tail 100
```



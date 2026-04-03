# 🟢 Guia de Integração WhatsApp - Sanzony.Voz (Local Engine)

Este documento descreve a arquitetura de entrega automatizada do Sanzony.Voz, operando com o motor **Evolution API v2** rodando em **AWS (EC2/Docker)** para garantir máxima latência zero e controle total sobre o processamento de mídias.

---

## 🏛️ Arquitetura de Redes

## 🛠️ Stack Tecnológica

1.  **💻 Frontend (Vercel):** Hospeda o painel administrativo sanzonyvozOnAir (Linkado ao Proxy Cloudflare).
2.  **🧠 Motor de Mensagens (AWS):** Evolution API v2 rodando em Docker na EC2 (`18.207.129.86`).
3.  **🛡️ Segurança (Cloudflare Tunnel):** Bridge HTTPS que resolve o erro de *Mixed Content* entre Vercel (HTTPS) e AWS (HTTP).
4.  **🗄️ Backend & Mídias (Supabase):** PostgreSQL para persistência e Storage para mídias (Áudio/Certificados).

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
Estas variáveis **DEVEM** estar no dashboard da Vercel para que o sistema de envio funcione:
*   `VITE_EVOLUTION_API_URL`: `https://api.sanzonyvoz.com.br`
*   `VITE_EVOLUTION_API_KEY`: `sanzony_voz_master_key_2026`
*   `VITE_EVOLUTION_INSTANCE_NAME`: `SanzonyVoz`

### 🔑 Chaves Globais
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



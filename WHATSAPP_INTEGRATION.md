# 🟢 Guia de Integração WhatsApp - Sanzony.Voz (Cloud Architecture)

Este documento descreve a arquitetura de entrega automatizada do Sanzony.Voz, agora operando **100% nas nuvens** (Cloud-to-Cloud) com foco em **Estabilidade Bruta** e **Alta Performance**.

---

## 🏛️ Arquitetura de Redes

A plataforma Sanzony.Voz orquestra três pilares em nuvem para garantir entrega 24/7:

1.  **💻 Frontend (Vercel):** Hospeda o painel administrativo Sanzony.
2.  **🧠 Motor de Mensagens (Fly.io):** Hospeda a **Evolution API v1.6.1 Stable** em `sanzonyvozonair.fly.dev`.
3.  **🗄️ Backend & Mídias (Supabase):** PostgreSQL para persistência de dados e Storage para áudios/PDFs.

---

## 🛠️ Configuração de Produção (Environment Variables)

| Variável | Valor em Produção | Função |
| :--- | :--- | :--- |
| `VITE_EVOLUTION_API_URL` | `https://sanzonyvozonair.fly.dev` | Endereço oficial do motor de Zap |
| `VITE_EVOLUTION_API_KEY` | `sanzony_voz_master_key_2026` | Chave de segurança de mestre |
| `VITE_EVOLUTION_INSTANCE_NAME` | `SanzonyVoz` | Nome da conexão do WhatsApp |

---

## 🚀 Como fazer o Deploy no Fly.io (Manutenção)

Se você precisar atualizar o servidor da API no futuro:

1.  Acesse a pasta `whatsapp-api` via terminal.
2.  Execute o comando: `fly deploy --image atendai/evolution-api:v1.6.1`.

**Importante:** O motor está configurado com **1024MB de RAM dedicada**. Esta configuração é **vital** para garantir que o Baileys não trave ao processar múltiplos áudios simultâneos para o WhatsApp.

---

## 🧭 Troubleshooting (Cloud)

### 1. Mensagens não chegam (API Offline)
- Verifique o status na Fly.io: `fly status -a sanzonyvozonair`.
- Reinicie se necessário: `fly apps restart -a sanzonyvozonair`.

### 2. Painel de Gerenciamento (Manager)
- Endereço: `https://sanzonyvozonair.fly.dev/manager/instances`
- Senha: Use a sua `API_KEY` mestra definida nos Secrets.

---
🎙️ **Sanzony.Voz Cloud** — *Engenharia de som e dados, sempre on-line.*

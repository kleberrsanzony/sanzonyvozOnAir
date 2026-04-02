# 🟢 Guia de Integração WhatsApp - Sanzony.Voz (Cloud Architecture)

Este documento descreve a arquitetura de entrega automatizada do Sanzony.Voz, agora operando **100% nas nuvens** (Cloud-to-Cloud).

---

## 🏛️ Arquitetura de Redes

A plataforma Sanzony.Voz orquestra três pilares em nuvem para garantir entrega 24/7 sem dependência de hardware local:

1.  **💻 Frontend (Vercel):** Hospeda o painel administrativo em `sanzonyvoz.com.br`.
2.  **🧠 Motor de Mensagens (Fly.io):** Hospeda a **Evolution API v2** em `sanzonyvozonair.fly.dev`.
3.  **🗄️ Backend & Mídias (Supabase):** Armazena o banco de dados de briefings e os arquivos `.mp3` e `.pdf`.

---

## 🛠️ Configuração de Produção (Environment Variables)

Para que o sistema funcione corretamente, a Vercel deve estar configurada com os seguintes endereços:

| Variável | Valor em Produção | Função |
| :--- | :--- | :--- |
| `VITE_EVOLUTION_API_URL` | `https://sanzonyvozonair.fly.dev` | Endereço oficial do motor de Zap |
| `VITE_EVOLUTION_API_KEY` | `sanzony_voz_master_key_2026` | Chave de segurança de mestre |
| `VITE_EVOLUTION_INSTANCE_NAME` | `SanzonyVoz` | Nome da conexão do WhatsApp |

---

## 🚀 Como fazer o Deploy no Fly.io (Manutenção)

Se você precisar atualizar o servidor da API no futuro:

1.  Acesse a pasta `whatsapp-api` via terminal.
2.  Garanta que está logado: `fly auth login`.
3.  Execute o comando: `fly deploy`.

**Importante:** O motor utiliza a imagem oficial `atendai/evolution-api:latest` e 512MB de RAM dedicada para processamento de mídias pesadas.

---

## 🧭 Troubleshooting (Cloud)

### 1. Mensagens não chegam (API Offline)
- Verifique o status na Fly.io: `fly status -a sanzonyvozonair`.
- Se as máquinas estiverem paradas, force o início: `fly m start -a sanzonyvozonair`.

### 2. Erro de Banco de Dados (Postgres Connection)
- Verifique se os **Secrets** do Fly.io estão corretos (apontando para o Supabase `etlimw...`).
- Comando: `fly secrets list -a sanzonyvozonair`.

---
🎙️ **Sanzony.Voz Cloud** — *Engenharia de som e dados, sempre on-line.*

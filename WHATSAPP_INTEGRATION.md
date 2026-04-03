# 🟢 Guia de Integração WhatsApp - Sanzony.Voz (Local Engine)

Este documento descreve a arquitetura de entrega automatizada do Sanzony.Voz, operando com o motor **Evolution API v2** rodando em **AWS (EC2/Docker)** para garantir máxima latência zero e controle total sobre o processamento de mídias.

---

## 🏛️ Arquitetura de Redes

A plataforma Sanzony.Voz orquestra três pilares para garantir entrega robusta:

1.  **💻 Frontend (Vercel):** Hospeda o painel administrativo Sanzony.
2.  **🧠 Motor de Mensagens (AWS):** Hospeda a **Evolution API v2.x** em sua instância EC2.
3.  **🗄️ Backend & Mídias (Supabase):** PostgreSQL para persistência de dados e Storage para áudios/PDFs.

---

## 🛠️ Configuração de Desenvolvimento/Produção (.env)

| Variável | Valor Atual | Função |
| :--- | :--- | :--- |
| `VITE_EVOLUTION_API_URL` | `http://18.207.129.86:8080` | Endereço do motor AWS |
| `VITE_EVOLUTION_API_KEY` | `sanzony_voz_master_key_2026` | Chave de segurança global |
| `VITE_EVOLUTION_INSTANCE_NAME` | `SanzonyVoz` | Nome da instância do WhatsApp |

---

## 🚀 Como Iniciar o Motor Local

Para garantir que o sistema de envios funcione, o motor deve estar rodando na máquina:

1.  Acesse a pasta `whatsapp-api`.
2.  Verifique se as dependências estão instaladas: `npm install` ou `bun install`.
3.  Inicie o servidor: `npm run dev:server` ou `npm start`.

**Importante:** Certifique-se de que a instância `SanzonyVoz` foi criada e está com o QR Code pareado.

---

## 🧭 Troubleshooting (Local)

### 1. Mensagens não chegam (API Offline)
- Verifique se o terminal da API está aberto e sem erros.
- Tente acessar `http://localhost:8080/instance/fetchInstances` para ver se a API responde.

### 2. Erro de Permissão (403/401)
- Verifique se a `VITE_EVOLUTION_API_KEY` no seu `.env` é idêntica à `AUTHENTICATION_API_KEY` dentro do `.env` da pasta `whatsapp-api`.

### 3. Painel de Gerenciamento Local
- Se o Manager estiver rodando, acesse em: `http://localhost:3000`.

---
🎙️ **Sanzony.Voz Local** — *Engenharia de som e dados, controle absoluto.*


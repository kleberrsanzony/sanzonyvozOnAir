# 🛡️ Guia de Segurança e Rotação de Chaves — Sanzony.Voz™

Este documento detalha os passos necessários para rotacionar as chaves de segurança do sistema após a exposição acidental do arquivo `.env` no histórico do Git.

## 🚨 Ações Recomendadas (Quando Voltar)

### 1. Rotação das Chaves do Supabase
As chaves do Supabase dão acesso direto ao seu banco de dados e arquivos.
1. Acesse o painel do [Supabase](https://supabase.com).
2. Vá em **Project Settings** > **API**.
3. Clique em **Generate new JWT Secret**.
4. Isso mudará a `SUPABASE_ANON_KEY` e a `SUPABASE_SERVICE_ROLE_KEY`.
5. **Ação no código:** Atualize essas duas chaves no seu arquivo `.env` local e no painel da Vercel.

### 2. Rotação da Master Key da Evolution API (AWS)
A chave mestra controla as instâncias de WhatsApp no seu servidor AWS.
1. **Ação no código:** Mantenha a nova chave (ex: `sanzony_voz_master_key_2026_nova`) no `.env` do seu computador.
2. **Ação no Servidor (AWS):** 
   - Acesse via SSH.
   - Navegue até `~/whatsapp-api`.
   - Edite o `docker-compose.yaml`.
   - Altere o valor de `AUTHENTICATION_API_KEY`.
   - Rode `docker-compose up -d` para aplicar.

### 3. Rotação de Senhas do Banco de Dados
Caso a senha do banco de dados também estivesse no `.env`:
1. Mude a senha no painel do Supabase.
2. Atualize o `DATABASE_URL` no `.env`.

---

## ✅ O que já foi corrigido:
- [x] Arquivo `.env` removido do rastreio do Git (GitHub).
- [x] `.gitignore` atualizado para bloquear `.env`, `.env.*` e arquivos `.pem`.
- [x] Migração final de Projeto Supabase concluída para a REF: **`eazwewzslriqzzvjwpjh`** (Projeto Oficial).
- [x] Blindagem Visual **"Cinema Dark"** implementada (Modo Escuro forçado em todos os dispositivos).
- [x] Repositório sincronizado nas branches `main` e `master`.
- [x] Resiliência de áudio no celular otimizada para interrupções de chamadas.

---
*Documento gerado em 03/04/2026 para fins de auditoria e segurança.*

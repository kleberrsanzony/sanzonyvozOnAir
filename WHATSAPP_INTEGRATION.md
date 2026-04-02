# 🎙️ Sanzony.Voz — Integração WhatsApp (Evolution API v2)

Este guia documenta a integração completa de automação para entrega de briefs, certificados e áudios via WhatsApp.

---

## 🛠️ Arquitetura do Sistema

### 🔵 Projetos Supabase (Dual-Setup)
1. **Mídias (`eazwewzslriqzzvjwpjh`):** Onde os arquivos (Áudios, PDFs) são hospedados. Este projeto DEVE ter os buckets `audio-files` e `certificates` configurados como **Públicos**.
2. **Evolution DB (`etlimwchxuwoebgrsimh`):** Onde o banco de dados da API Evolution está hospedado para persistência de mensagens e instâncias.

### 🟢 API Evolution (Localhost:8080)
- **Instância:** `SanzonyVoz`
- **Master Key:** `sanzony_voz_master_key_2026`
- **Token:** `sanzony_voz_token_2026`

---

## 🚀 Fluxo de Automação (Pós-Upload)

O fluxo é disparado automaticamente assim que o administrador faz o upload do áudio final na página de Admin.

1. **Geração de Certificado:** O sistema gera um PDF de autenticidade no Supabase.
2. **Envio de Texto (WhatsApp):** Envia os detalhes do brief para o cliente.
3. **Envio de PDF (WhatsApp):** Envia o Certificado de Autenticidade como documento.
4. **Envio de Áudio MP3 (WhatsApp):** Envia a locução final como arquivo `.mp3` real.

---

## 📦 Detalhes Técnicos dos Serviços

### URL Dinâmica (Supabase)
O sistema detecta automaticamente o projeto de mídias através da variável `VITE_SUPABASE_URL`.
```typescript
// Exemplo de construção de URL segura
const rawUrl = `${VITE_SUPABASE_URL}/storage/v1/object/public/audio-files/${file_path}`;
const encodedUrl = encodeURI(rawUrl);
```

### Formato de Entrega MP3
Para garantir compatibilidade máxima e permitir download, o áudio é enviado como `mediatype: 'document'`.
- **Rota:** `/message/sendMedia/SanzonyVoz`
- **Mimetype:** `audio/mpeg`
- **Extensão:** `.mp3`

---

## 🛠️ Solução de Problemas (Troubleshooting)

### Erro 400 (Bad Request)
- Geralmente causado por URL mal formada ou bucket privado. 
- Verifique se o bucket `audio-files` no projeto `eazwe...` é público.

### Erro 500 (Internal Server Error)
- A API tentou processar mas falhou. Verifique o arquivo `api.log` para ver logs detalhados de rede ou FFmpeg.

---
**Documentação atualizada em: 02 de Abril de 2026**

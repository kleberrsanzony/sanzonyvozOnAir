# Integração WhatsApp — Sanzony.Voz™ (Evolution API v2)

Este documento descreve a configuração da **Evolution API v2** instalada localmente no ambiente macOS Monterey, integrada ao **Supabase**.

## 🏗️ Arquitetura

- **Frontend (Main App):** Roda na porta `:8081` (Local) ou Vercel.
- **WhatsApp API:** Evolution API v2 rodando localmente na porta `:8080`.
- **Banco de Dados:** PostgreSQL remoto hospedado no **Supabase** (`etlimwchxuwoebgrsimh`).
- **Cache:** Redis local rodando em `localhost:6379`.

---

## 🚀 Como Iniciar o Servidor API

Caso o computador seja reiniciado, você deve reativar o servidor da API seguindo estes passos:

1.  Certifique-se de que o **Redis** está rodando:
    ```bash
    brew services start redis
    ```
2.  Inicie a Evolution API usando o script otimizado:
    ```bash
    ./whatsapp-api/start_api.sh
    ```
    *Isso iniciará o servidor em background e salvará os logs em `whatsapp-api/server.log`.*

---

## 🔑 Credenciais e Endpoints

### API Endpoint: 
`http://localhost:8080`

### Chaves de Autenticação (Master):
- **API Key:** `sanzony_voz_master_key_2026`
- **Global Token:** `sanzony_voz_token_2026`

### Instância Configurada:
- **Nome:** `SanzonyVoz`
- **Integração:** `WHATSAPP-BAILEYS`

---

## 📲 Gerenciamento de Instâncias

### Verificar Status da Conexão:
```bash
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: sanzony_voz_master_key_2026"
```

### Gerar Novo QR Code (se desconectado):
Basta abrir o arquivo `parear.html` na raiz do projeto ou usar:
```bash
curl -X GET http://localhost:8080/instance/connect/SanzonyVoz \
  -H "apikey: sanzony_voz_master_key_2026"
```

---

## 📂 Arquivos Importantes

1.  `whatsapp-api/.env`: Configurações de conexão com o banco de dados Supabase e Redis.
2.  `whatsapp-api/start_api.sh`: Script de inicialização rápida.
3.  `parear.html`: Visualizador gráfico do QR Code no navegador.
4.  `.env` (Raiz): Contém as variáveis que o frontend usa para falar com esta API.

---

## ⚠️ Observações de Segurança
- A senha do banco de dados e as chaves de API estão salvas nos arquivos `.env`. **Nunca remova esses arquivos do `.gitignore`** para evitar exposição pública.
- A Evolution API local não é acessível pela internet externa (Vercel) a menos que você use um túnel (ex: Ngrok). Para uso admin local, a configuração atual é ideal.

---
📅 *Documentação gerada em 01/04/2026 por Antigravity AI.*

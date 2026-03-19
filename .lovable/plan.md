

## Plano: Remoção Completa do UAZapi do Sistema

### Resumo

Remover todas as referências ao UAZapi/UAZap, incluindo código frontend, edge function, componentes e colunas do banco de dados. O sistema de envio de sequências manterá apenas o modo webhook genérico.

### Arquivos a modificar

| Arquivo | Ação |
|---|---|
| `src/components/sequences/WebhookConfig.tsx` | Remover tabs UAZap/Webhook, manter apenas config de webhook simples |
| `src/pages/GroupSequences.tsx` | Remover referências a `sendMode`, `whatsappGroupId`, `whatsappGroupName` |
| `supabase/functions/send-scheduled-posts/index.ts` | Remover função `sendViaUazap`, variáveis UAZAPI, lógica de sendMode uazapi — manter apenas webhook |
| `supabase/config.toml` | Remover seção `[functions.send-scheduled-posts]` (deletar a edge function) |

### Arquivo a deletar

| Arquivo | Motivo |
|---|---|
| `supabase/functions/send-scheduled-posts/index.ts` | Toda a lógica era centrada em UAZapi + webhook; será simplificada ou removida |

### Migração SQL

Remover colunas do banco:
```sql
ALTER TABLE public.sequences DROP COLUMN IF EXISTS send_mode;
ALTER TABLE public.sequences DROP COLUMN IF EXISTS whatsapp_group_id;
ALTER TABLE public.sequences DROP COLUMN IF EXISTS whatsapp_group_name;
ALTER TABLE public.sequences DROP COLUMN IF EXISTS webhook_url;
```

### Detalhes

#### 1. WebhookConfig.tsx — Simplificar ou Deletar

O componente inteiro era para configurar UAZap vs Webhook. Com a remoção do UAZapi e das colunas de webhook/whatsapp da tabela `sequences`, este componente não tem mais função. **Será deletado**.

#### 2. GroupSequences.tsx

- Remover import do `WebhookConfig`
- Remover campos `webhookUrl`, `whatsappGroupId`, `whatsappGroupName`, `sendMode` da interface `Sequence`
- Remover o bloco `<WebhookConfig>` do JSX
- Remover referências a esses campos no carregamento de sequências salvas

#### 3. send-scheduled-posts Edge Function

- Remover toda a função `sendViaUazap`
- Remover variáveis `UAZAPI_URL` e `UAZAPI_TOKEN`
- Remover lógica de `sendMode === "uazapi"`
- Manter apenas o envio via webhook genérico (sem referência a grupo WhatsApp)
- Ou, se preferir, deletar completamente a edge function já que sem UAZapi o envio automático perde o propósito principal

#### 4. admin-credentials/index.ts

- Remover `'send-scheduled-posts'` da lista de funções

#### 5. supabase/config.toml

- Remover `[functions.send-scheduled-posts]`

#### 6. types.ts

- Será atualizado automaticamente após a migração SQL remover as colunas


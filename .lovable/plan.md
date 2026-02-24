

## Configurar Token de Segurança do Webhook Kiwify

### O que será feito

Adicionar o secret `KIWIFY_WEBHOOK_TOKEN` no Supabase para proteger o endpoint do webhook contra requisições não autorizadas.

### Passos

1. **Solicitar o token** -- Vou pedir para você definir um valor para o secret `KIWIFY_WEBHOOK_TOKEN` usando a ferramenta de adicionar secrets do Supabase. Você pode escolher qualquer senha/token seguro.

2. **O webhook já está preparado** -- O código da Edge Function `kiwify-webhook` já valida esse token automaticamente. Ele verifica o header `x-webhook-token`, o header `authorization`, ou os campos `signature`/`token` no body da requisição.

3. **Configuração na Kiwify** -- Depois de salvar o secret, você precisará:
   - Acessar o painel da Kiwify
   - Ir em Configuracoes > Webhooks
   - Adicionar a URL: `https://fucghvojmptamtloggae.supabase.co/functions/v1/kiwify-webhook`
   - Configurar o mesmo token no campo de autenticação/signature da Kiwify
   - Selecionar os eventos: compra aprovada, reembolso, chargeback, cancelamento

### Detalhes Técnicos

- O secret será armazenado de forma segura no Supabase e acessível apenas pelas Edge Functions via `Deno.env.get("KIWIFY_WEBHOOK_TOKEN")`
- Nenhuma alteração de código é necessária, pois a validação já existe no `kiwify-webhook/index.ts`


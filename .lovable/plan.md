

## Plano: Correção de Segurança e Bugs — Auditoria Completa

### Resumo

A análise identificou **1 vulnerabilidade crítica** e **2 problemas menores** que precisam de correção imediata.

### Vulnerabilidade Crítica: Edge Functions aceitam `userId` do cliente

**O problema**: As edge functions `sales-strategist`, `conversation-analyzer`, `sequence-generator` e `persona-generator` recebem `userId` no body da requisição enviado pelo frontend. Qualquer usuário pode:
- Enviar `userId: null` e **pular verificação de limites**
- Enviar o `userId` de outra pessoa e **drenar a cota alheia** ou **acessar dados de persona de outro usuário**

**A correção**: Extrair o `userId` do JWT (Authorization header) no servidor, nunca do body.

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `supabase/functions/sales-strategist/index.ts` | Extrair userId do JWT via `getUser(token)`, remover userId do body |
| `supabase/functions/conversation-analyzer/index.ts` | Idem |
| `supabase/functions/sequence-generator/index.ts` | Idem |
| `supabase/functions/persona-generator/index.ts` | Idem |
| `src/hooks/useChat.ts` | Enviar `session.access_token` no header Authorization, remover `userId` do body |
| `src/hooks/useConversationAnalysis.ts` | Idem |
| `src/hooks/usePersonaProfile.ts` | Idem |
| `src/pages/GroupSequences.tsx` | Usar `supabase.functions.invoke` que já envia auth automaticamente, remover `userId` do body |

### Detalhes Técnicos

#### 1. Padrão de autenticação nas Edge Functions

Cada edge function receberá este bloco no início do handler:

```typescript
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response(JSON.stringify({ error: "Não autorizado" }), {
    status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

const token = authHeader.replace("Bearer ", "");
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const { data: { user }, error: authError } = await supabase.auth.getUser(token);
if (authError || !user) {
  return new Response(JSON.stringify({ error: "Token inválido" }), {
    status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
const userId = user.id; // Seguro — vem do JWT
```

O campo `userId` será removido do `req.json()` em todas as funções.

#### 2. Frontend — enviar token de sessão

Os hooks que fazem `fetch()` direto passarão a usar o `session.access_token` no header:

```typescript
const { data: { session } } = await supabase.auth.getSession();
const resp = await fetch(URL, {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({ messages, mode }), // sem userId
});
```

Para `GroupSequences.tsx` que já usa `supabase.functions.invoke`, basta remover `userId` do body — o SDK envia o token automaticamente.

#### 3. Problema com `track_token_usage` e `increment_usage`

Essas funções SQL usam `auth.uid() != p_user_id` como guard. Quando chamadas via service role key, `auth.uid()` retorna `null`, então a validação falhará. Solução: chamar o RPC usando um client construído com o token do usuário (não service role) para que `auth.uid()` funcione corretamente. Alternativamente, criar versões `_admin` dessas funções sem o guard para uso interno.

A abordagem mais simples: criar um supabase client com o anon key + token do usuário para as chamadas de RPC.

#### 4. Bug menor: `ai-mentor-chat` sem limites de uso

Esta edge function não verifica limites de uso nem autenticação. Será adicionado o mesmo padrão de auth + usage check.

### Impacto

- Corrige a vulnerabilidade de impersonação (nível: **crítico**)
- Corrige bypass de limites de uso
- Protege dados de persona contra exfiltração
- Adiciona controle de uso à Mentora Gi


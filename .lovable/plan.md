# Plano revisado: Remover WhatsApp + isolamento total por usuário + guard de CI

Mantém tudo do plano anterior e incorpora os 3 reforços pedidos.

---

## 1. Remoção de WhatsApp (igual ao plano anterior)

- Deletar `src/pages/WhatsAppHub.tsx` e `src/pages/WhatsAppStrategies.tsx`
- Remover rotas `/whatsapp` e `/privado/scripts` em `src/App.tsx` (mantendo redirect para `/privado` por compat)
- Remover item da sidebar (`AppSidebar.tsx`) e cards/labels do `Dashboard.tsx`
- Trocar copy do `Index.tsx` ("vendas pelo WhatsApp" → "vendas da sua loja/Instagram")
- Limpar menções textuais em componentes de prompt/glossário/onboarding e em system prompts das edge functions (`sales-strategist`, `sequence-generator`, `ad-creator`, `conversation-analyzer`, `ai-mentor-chat`, `persona-generator`, `carousel-generator`)

### 1.1. Guard de CI contra reintrodução

Criar **`scripts/check-no-whatsapp.mjs`**:

```text
- Roda ripgrep (ou fallback Node) procurando /whats?app/i em:
    src/**/*.{ts,tsx,js,jsx,html,css}
    supabase/functions/**/*.{ts,js,json}
- Ignora explicitamente:
    supabase/migrations/**     (histórico imutável)
    scripts/check-no-whatsapp.mjs  (este próprio arquivo)
    node_modules, dist, build
- Se encontrar qualquer match → imprime arquivo:linha e exit 1
- Se zero matches → exit 0 com "OK: no whatsapp references"
```

Integrar em **`package.json`**:
```text
"scripts": {
  "check:no-whatsapp": "node scripts/check-no-whatsapp.mjs",
  "prebuild": "node scripts/check-no-whatsapp.mjs"   // roda automaticamente antes de `vite build`
}
```

Assim qualquer build (local ou CI) quebra se "whatsapp" voltar ao código.

---

## 2. Namespacing centralizado de cache por usuário

### 2.1. Helper central — `src/lib/userScopedKey.ts` (novo)

Responsabilidade única: gerar chaves prefixadas com o usuário atual e oferecer wrappers de Storage seguros.

```text
- currentUserIdRef: { value: string | null }   (módulo singleton)
- setCurrentUserId(id: string | null): void
    → atualiza ref e dispara CustomEvent('app:user-changed', {detail:{id}})
- getCurrentUserId(): string | null
- scopedKey(base: string): string
    → retorna `u:${id ?? 'anon'}::${base}`
- scopedSession / scopedLocal: wrappers com get/set/remove/clearAllForCurrentUser/clearAllForAnyUser
    → todas as escritas passam por scopedKey
    → clearAllForCurrentUser varre storage e remove tudo que casa /^u:${currentId}::/
    → clearAllForAnyUser varre storage e remove tudo que casa /^u:[^:]+::/
```

### 2.2. Integração com `useAuth`

Em `src/hooks/useAuth.ts`:
- Ao receber sessão (boot e `onAuthStateChange`): `setCurrentUserId(session?.user?.id ?? null)` **antes** de qualquer fetch.
- Ao deslogar: `setCurrentUserId(null)` após o `clearCaches()`.

### 2.3. Migrar TODAS as chaves de storage para o helper

Refatorar para usar `scopedSession`/`scopedLocal` (não mais `sessionStorage.setItem` / `localStorage.setItem` direto):

- `src/hooks/useSessionPersistence.ts` (todo o módulo: persistência de formulários)
- `src/lib/response-cache.ts` (`CACHE_KEY` → `scopedKey('ai_response_cache')`)
- `src/components/carousel/ImageLibraryPicker.tsx` (`CACHE_PREFIX` agora derivado de `scopedKey`)
- `src/components/carousel/CarouselEditor.tsx` (rascunhos)
- `src/components/manychat/ManyChatApiConfig.tsx` (config local do ManyChat)
- `src/hooks/useMissionAutoComplete.ts` (`pending_lesson_completion`, `coming_from_learning`)
- `src/components/learning/MissionChecklist.tsx` e `FinishMissionButton.tsx`

**Não migrar:** `src/integrations/supabase/client.ts` — o token Supabase **deve** continuar em `localStorage` puro (gerenciado pela própria SDK; namespacing quebraria login).

### 2.4. Listener de evento `app:user-changed`

`src/lib/clearUserScopedCaches.ts` (novo) escuta `app:user-changed` para chamar:
- `scopedLocal.clearAllForAnyUser()` quando id antigo ≠ id novo
- `queryClient.clear()` (ver §3)

---

## 3. Limpeza completa do React Query

### 3.1. Expor o `queryClient`

Mover a criação do `queryClient` de `src/App.tsx` para **`src/lib/queryClient.ts`** (novo) e exportá-lo. `App.tsx` apenas importa e passa ao `QueryClientProvider`. Assim pode ser importado de qualquer lugar (incluindo `useAuth`).

### 3.2. Em `useAuth.ts`

Adicionar tracking de `lastUserIdRef` e três pontos de limpeza:

```text
import { queryClient } from '@/lib/queryClient';
import { clearUserScopedCaches } from '@/lib/clearUserScopedCaches';
import { setCurrentUserId } from '@/lib/userScopedKey';

// dentro de onAuthStateChange:
const newId = session?.user?.id ?? null;
const oldId = lastUserIdRef.current;
if (oldId && newId && oldId !== newId) {
  // Troca de usuário detectada (ex: login com outra conta sem logout)
  clearUserScopedCaches({ allUsers: true });
  queryClient.clear();
}
lastUserIdRef.current = newId;
setCurrentUserId(newId);

// após signIn bem-sucedido:
queryClient.clear();   // descarta qualquer query do estado anônimo/anterior

// dentro de signOut, ANTES de supabase.auth.signOut():
clearUserScopedCaches({ allUsers: true });
queryClient.clear();
queryClient.removeQueries();    // garante remoção de queries inativas em cache
queryClient.cancelQueries();    // cancela queries em voo
setCurrentUserId(null);
```

`clearUserScopedCaches({ allUsers: true })` remove todas as chaves prefixadas com `u:` em `localStorage` e `sessionStorage`, mais chaves específicas legadas (`pending_lesson_completion`, `coming_from_learning`, etc.).

### 3.3. Boot defensivo

No `useAuth.ts`, após `getSession()`:
```text
const bootedId = session?.user?.id ?? null;
const lastSeenId = localStorage.getItem('last_user_id');
if (bootedId && lastSeenId && bootedId !== lastSeenId) {
  clearUserScopedCaches({ allUsers: true });
  queryClient.clear();
}
if (bootedId) localStorage.setItem('last_user_id', bootedId);
else localStorage.removeItem('last_user_id');
```

Cobre o caso "abro a aba novamente como outro usuário" antes que qualquer componente monte.

---

## Critérios de aceitação

**Guard CI:**
- `npm run check:no-whatsapp` falha (exit 1) se eu adicionar a string "whatsapp" em qualquer arquivo de `src/` ou `supabase/functions/`.
- O build (`vite build`) é interrompido pelo `prebuild` se houver match.
- Migrations antigas são ignoradas (não falsos positivos).

**Namespacing:**
- Após login do usuário B, inspecionar `localStorage`/`sessionStorage` mostra apenas chaves `u:<idB>::*` (e o token Supabase nativo). Nenhuma chave `u:<idA>::*` ou chave "solta" sem prefixo.
- Hooks `useSessionPersistence`, `response-cache`, `ImageLibraryPicker` etc. não acessam mais `sessionStorage`/`localStorage` diretamente — todos vão pelo helper.

**React Query:**
- Logout → todos os dados (persona, conversas, métricas) desaparecem imediatamente.
- Login com outra conta no mesmo navegador (sem logout intermediário) → caches limpos automaticamente; primeiro fetch traz dados do novo usuário.
- Boot da aba com usuário diferente do `last_user_id` → caches limpos antes de qualquer render.

## Arquivos criados
- `scripts/check-no-whatsapp.mjs`
- `src/lib/userScopedKey.ts`
- `src/lib/clearUserScopedCaches.ts`
- `src/lib/queryClient.ts`

## Arquivos editados
- `package.json` (script `prebuild` + `check:no-whatsapp`)
- `src/App.tsx` (importa queryClient externo, remove rotas WhatsApp)
- `src/hooks/useAuth.ts` (limpeza + tracking de troca + setCurrentUserId)
- `src/hooks/useSessionPersistence.ts`, `src/hooks/useMissionAutoComplete.ts`
- `src/lib/response-cache.ts`
- `src/components/carousel/ImageLibraryPicker.tsx`, `src/components/carousel/CarouselEditor.tsx`
- `src/components/manychat/ManyChatApiConfig.tsx`
- `src/components/learning/MissionChecklist.tsx`, `FinishMissionButton.tsx`
- `src/components/layout/AppSidebar.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Index.tsx`
- Componentes/edge functions com texto "WhatsApp" (substituições de copy)

## Arquivos deletados
- `src/pages/WhatsAppHub.tsx`
- `src/pages/WhatsAppStrategies.tsx`

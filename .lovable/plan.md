## Objetivo

Fazer com que a Central Financeira e todos os ajustes recentes (importação seletiva de catálogo, badges de origem, tela de revisão, edição inline, aplicar na Calculadora, diff visual) cheguem a 100% dos usuários — antigos e novos — assim que a versão for publicada na Vercel/Lovable, sem que sessões antigas restauradas no `sessionStorage` "congelem" a UI numa versão desatualizada.

## Diagnóstico

A mensagem **"Sessão anterior restaurada"** vem do `useSessionPersistence`, que guarda o estado de formulários no `sessionStorage` por usuário (`u:<userId>::<chave>`). Isso está correto para preservar dados digitados, mas hoje:

1. Não há **versionamento de schema** das chaves — se mudamos a forma de um objeto (ex.: novos campos da revisão de serviços), o estado antigo restaurado pode não bater com o novo componente.
2. O Service Worker / cache do navegador pode segurar bundles antigos do Vite após deploy, fazendo o usuário continuar na versão anterior até dar hard-refresh.
3. Não existe um sinal de "nova versão disponível" para forçar reload suave.

A visibilidade de publicação já está pública (passo anterior). O que falta é garantir **frescor da build** e **compatibilidade do estado persistido**.

## Mudanças

### 1. Versionar as chaves de sessão (`useSessionPersistence`)
- Adicionar uma constante `SESSION_SCHEMA_VERSION` (ex.: `"v2"`) embutida no nome da chave: `scopedKey(`${key}::${SESSION_SCHEMA_VERSION}`)`.
- Ao bootar, varrer chaves antigas (sem o sufixo de versão atual) e removê-las silenciosamente.
- Resultado: quando publicarmos qualquer mudança estrutural, basta bumpar a versão e nenhum usuário vê estado quebrado — formulários começam limpos, mas todos os **dados de banco** (Calculadora salva, catálogos, persona, etc.) continuam intactos.

### 2. Versão da app + detector de "nova versão publicada"
- Gerar `APP_VERSION` em build time via `vite.config.ts` (`define: { __APP_VERSION__: JSON.stringify(Date.now().toString()) }`).
- Servir `/version.json` estático com a mesma versão.
- Hook `useAppVersionCheck` que faz `fetch('/version.json', { cache: 'no-store' })` a cada 5 min e quando a aba volta ao foco; se a versão mudou, mostra um toast discreto: *"Nova versão disponível. Atualizar agora."* com botão que faz `location.reload()`.
- Isso resolve o caso clássico Vercel: usuário com aba aberta há horas continua na build velha.

### 3. Cache-busting de assets
- Confirmar no `index.html` que não há `<meta http-equiv="Cache-Control">` agressivo.
- Adicionar `<meta name="version" content="__APP_VERSION__">` para inspeção rápida.
- Garantir headers corretos no deploy (Vercel já faz hash dos assets do Vite — o ponto crítico é o `index.html`, que deve ser `no-cache`). Adicionar `vercel.json` (se ainda não existir) com:

```text
headers:
  /index.html  → Cache-Control: no-cache, must-revalidate
  /version.json → Cache-Control: no-cache, must-revalidate
  /assets/*    → Cache-Control: public, max-age=31536000, immutable
```

### 4. Indicador de sessão restaurada com opção de "começar do zero"
- O `SessionIndicator` já tem botão de limpar — apenas reforçar o copy: *"Sessão anterior restaurada. Limpar para usar a versão mais nova."*
- Nenhuma mudança de lógica de dados; só UX.

### 5. Verificação pós-deploy
- Após publicar, abrir o preview público em janela anônima e validar:
  - Central Financeira carrega com todos os campos novos.
  - Importação de catálogo de serviços abre a tela de revisão com edição inline e diff.
  - Botão "Aplicar na Calculadora" funciona.
  - Toast de "nova versão" aparece se eu mantiver duas abas e republicar.

## Detalhes técnicos

- Arquivos editados:
  - `src/hooks/useSessionPersistence.ts` — adiciona `SESSION_SCHEMA_VERSION` e limpeza de chaves órfãs.
  - `src/hooks/useAppVersionCheck.ts` *(novo)* — polling de `/version.json`.
  - `src/components/AppVersionToast.tsx` *(novo)* — UI do toast.
  - `src/App.tsx` — monta `useAppVersionCheck` no root.
  - `vite.config.ts` — `define: __APP_VERSION__` + plugin que escreve `public/version.json` no build.
  - `vercel.json` *(novo, se faltar)* — headers de cache.
  - `src/components/SessionIndicator.tsx` — pequeno ajuste de copy.

- Sem alterações de schema do banco, sem mudanças em RLS, sem mexer em Edge Functions. Nada que afete dados já salvos por usuários antigos.

## Fora do escopo

- Não vamos invalidar cache de dados do React Query além do que já é feito na troca de usuário.
- Não vamos forçar logout de ninguém.
- Não mudaremos a visibilidade de publicação (já está pública).

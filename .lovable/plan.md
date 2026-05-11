## Objetivo

Três melhorias coordenadas na seção **Comunidade**:

1. **Player Vimeo embutido** — quando o admin colar uma URL do Vimeo em "Materiais", o usuário assiste dentro do app (sem abrir aba externa).
2. **Aviso de "novidades"** no Dashboard inicial sempre que houver materiais ainda não vistos.
3. **Destaque da Comunidade** — atalho rápido no Dashboard e item promovido no menu lateral (sair do submenu "Mais").

---

## 1. Player Vimeo embutido em Materiais

### Detecção e ingest
- No diálogo "Adicionar Material" (`src/pages/Community.tsx`), detectar automaticamente URLs do Vimeo (`vimeo.com/<id>`, `player.vimeo.com/video/<id>`, links privados `vimeo.com/<id>/<hash>`).
- Quando detectado, definir `file_type = 'vimeo'` automaticamente (substituindo o select manual nesse caso) e exibir badge "Vídeo Vimeo" no preview do diálogo antes de salvar.
- Guardar a URL original em `file_url` (sem alterar schema).

### Reprodução in-app
- Criar `src/components/community/VimeoPlayer.tsx` que recebe a URL, extrai o ID + hash e renderiza um `<iframe>` responsivo (`src="https://player.vimeo.com/video/{id}?h={hash}&dnt=1"`) com `allow="autoplay; fullscreen; picture-in-picture"` e wrapper `aspect-video`.
- Em `Community.tsx`, na lista de materiais, quando `file_type === 'vimeo'`:
  - Substituir o botão "Abrir" por **"Assistir aqui"** que abre um `Dialog` com o `VimeoPlayer` em tela larga.
  - Mostrar miniatura/ícone de vídeo no card.
- Manter comportamento atual (`window.open`) para `pdf` / `link` / outros tipos.

### Marcar como visto
- Ao abrir o player, registrar localmente que o material foi visto (ver seção 2).

---

## 2. Aviso de novidades no Dashboard

### Estado de "visto" (sem migration)
- Persistir em `localStorage` com chave por usuário (`useUserScopedKey`) o timestamp da última visita à aba **Materiais** da Comunidade — `community_materials_last_seen_at`.
- Atualizar esse timestamp quando o usuário entra em `/comunidade` e seleciona a tab "Materiais" (ou abre um material).

### Hook `useCommunityNewMaterials`
- Novo hook em `src/hooks/useCommunityNewMaterials.ts`:
  - Busca `community_materials` ordenados por `created_at desc` (limite 20).
  - Compara com `last_seen_at` e devolve `{ count, latest }`.
  - Realtime opcional via canal Supabase em `community_materials` para refletir novos itens sem refresh.

### UI no Dashboard (`src/pages/Dashboard.tsx`)
- Banner discreto no topo (estilo destaque) quando `count > 0`:
  - Texto: *"Novidades na Comunidade — N novo(s) material(is)"* + botão **"Ver agora"** que navega para `/comunidade?tab=materials`.
- Adicionar suporte a query string `?tab=` em `Community.tsx` para pré-selecionar a tab.
- Badge numérico no atalho rápido da Comunidade (ver seção 3).

---

## 3. Destaque da Comunidade

### Sidebar (`src/components/layout/AppSidebar.tsx`)
- Mover **"Comunidade"** do submenu "Mais" para o grupo **principal** (logo abaixo de "Conquistas" ou "Aprendizado").
- Usar ícone `MessageSquare` mantido, com badge vermelho mostrando número de novos materiais (vindo do hook acima).
- Remover do array `moreItems` para evitar duplicação.

### Atalho rápido no Dashboard
- Adicionar um `FeatureCard` destacado "Comunidade" na grade principal do Dashboard com:
  - Ícone, título, descrição curta ("Conversa, materiais e aulas novas").
  - Badge "Novidade" quando `count > 0`.
  - Click → `/comunidade`.

---

## Arquivos afetados

- `src/components/community/VimeoPlayer.tsx` — **novo**, iframe responsivo.
- `src/pages/Community.tsx` — detecção Vimeo, dialog player, leitura de `?tab=`, registro de "visto".
- `src/hooks/useCommunityNewMaterials.ts` — **novo**, contagem de materiais não vistos.
- `src/pages/Dashboard.tsx` — banner de novidades + FeatureCard de atalho.
- `src/components/layout/AppSidebar.tsx` — promover Comunidade para o grupo principal + badge.

## Notas

- Sem migrations: tipo `'vimeo'` cabe em `file_type` (text). "Visto" fica em `localStorage` por usuário — simples e suficiente para o caso.
- Vídeos privados do Vimeo precisam que o admin cole a URL com hash (`vimeo.com/123456/abc123`) ou tenham domínio do app autorizado nas permissões do vídeo no painel do Vimeo. Vou incluir uma nota visual no diálogo de upload sobre isso.

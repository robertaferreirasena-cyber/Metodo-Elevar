

# Plano: Carrossel — Persistência reforçada, controle total de imagem e mobile sólido

## 1. Diálogo "Manter o atual" — zero perda

**Estado atual:** já está OK no que diz respeito a `templateApplyMode`, `slides`, `giMessages` (todos persistidos via `useSessionPersistence`). Mas há uma sutileza: ao chegar um novo `initialTopic`, o `useEffect` dispara independentemente; se o usuário clicar "Manter o atual", o `lastAppliedInitialTopic` é atualizado para evitar reabrir, mas se a mesma URL voltar com o mesmo tema depois, o diálogo não reabre — bom. Reforços:

- **Garantir que "Manter o atual" não toque em nada** além de marcar `lastAppliedInitialTopic`. Confirmado no código atual — manter.
- **Adicionar opção "Salvar atual e começar novo"** no diálogo: clona o carrossel atual em `localStorage` sob uma chave de "rascunhos" e abre o novo. Visualmente um terceiro botão.
- **Persistir também `selectedTemplate` completo** (já é via `selectedTemplateId`) e o `topic` recém-digitado mas ainda não gerado.

## 2. Trocar SÓ o template visual sem perder textos/imagens

**Estado atual:** já existem 3 modos:
- `Todos slides`: aplica template em todos (sobrescreve cores/fontes/layout, **mantém títulos/corpos/imagens**).
- `Slide atual`: aplica só no slide ativo.
- `Preservar formatação`: troca background/layout, mantém ajustes manuais de cor/tamanho.

**Verificação no código:** nas funções `applyTemplateToAll` e `applyTemplatePreservingFormatting`, os campos `title`, `body`, `imageUrl`, `bgImageUrl`, `imageUrls`, `profileName`, `profileImageUrl` **nunca são tocados** — então textos e imagens já são preservados. ✅

**Melhorias para deixar isso óbvio para o usuário:**
- Renomear os 3 modos com tooltips claros: "Aplicar visual em todos (mantém textos)", "Aplicar só neste slide", "Trocar fundo (manter ajustes manuais)".
- Adicionar uma faixa informativa ao escolher template: "✓ Seus textos e imagens serão mantidos."
- Adicionar **undo** simples: salvar snapshot do `slides` antes de aplicar template; botão "Desfazer última troca de template" aparece por 10s via toast.

## 3. Controle TOTAL de imagem (fundo + layout)

**Adicionar ao `SlideData`:**

```ts
// Ajustes por imagem
bgImagePositionX?: number;  // 0–100 (%) – padrão 50
bgImagePositionY?: number;  // 0–100 (%) – padrão 50
bgImageScale?: number;      // 1–3 (zoom) – padrão 1
bgImageBlur?: number;       // 0–20 (px) – padrão 0
bgImageBrightness?: number; // 50–150 (%) – padrão 100
bgImageContrast?: number;   // 50–150 (%) – padrão 100
// Mesmos campos para imageUrl (image-bg / editorial)
imagePositionX?, imagePositionY?, imageScale?, imageBlur?, imageBrightness?, imageContrast?
```

**Renderização (em `SlidePreview.tsx`):**
- Trocar `background: url(...) center/cover` por estilo composto:
  ```ts
  backgroundImage: `url(${url})`,
  backgroundSize: `${(scale ?? 1) * 100}%`,
  backgroundPosition: `${posX ?? 50}% ${posY ?? 50}%`,
  backgroundRepeat: "no-repeat",
  filter: `blur(${blur ?? 0}px) brightness(${bright ?? 100}%) contrast(${contrast ?? 100}%)`,
  ```

**Editor — Painel "Ajustar imagem":**
Aparece quando há `bgImageUrl` ou `imageUrl`. Contém:
- **Mini-preview interativo** (~200px) com a imagem; usuário **arrasta com o dedo/mouse** para reposicionar (atualiza `positionX/Y` em tempo real).
- **Slider de zoom** (1× → 3×).
- **Sliders de brilho, contraste e desfoque (blur)**.
- **Slider já existente de overlay (sombra)** — manter.
- Botão **"Resetar ajustes"** que zera os 6 campos.

Funciona para os dois alvos: imagem de fundo (bgImageUrl) e imagem do layout (imageUrl em image-bg/editorial). Abas internas: "Fundo" / "Imagem do layout" quando ambas existem.

**Touch-friendly:** o mini-preview de arraste usa eventos `pointerdown/move/up` (funciona em desktop e mobile).

## 4. Mobile sólido

- **Toolbar de ação (Apresentar / PNG / Baixar todos)**: virar barra `sticky bottom-0` no mobile com fundo `bg-background/95 backdrop-blur` e safe-area, visível mesmo com chat aberto.
- **Preview**: já tem `max-w-full overflow-hidden`. Adicionar `max-h-[60vh]` no mobile para não empurrar a toolbar para fora.
- **Botão Apresentar no mobile**: o modo fullscreen atual usa `maxWidth:90vw, maxHeight:85vh` no slide → ✅ já responsivo. Garantir que botões de "Sair" e setas tenham `min-w-11 min-h-11` (touch target) e ficam **sempre visíveis** (hoje a top bar tem `opacity-0 hover:opacity-100` — no mobile não há hover, então botão "Sair" some). **Fix:** sempre visível no mobile (`md:opacity-0 md:hover:opacity-100`).
- **Exportar PNG**: já funciona; só garantir que o usuário consegue tocar o botão. Adicionar feedback visual (loading no próprio botão, não só "Baixar Todos").
- **Chat da Mentora**: quando aberto no mobile, ficar em Sheet inferior em vez de `Collapsible` inline empurrando a toolbar.

## Arquivos modificados

- `src/components/carousel/CarouselTemplates.ts` — novos campos opcionais em `SlideData`.
- `src/components/carousel/SlidePreview.tsx` — nova função `renderImage(url, opts)` que aplica position/scale/blur/brightness/contrast em todos os pontos onde imagens são usadas (bg, image-bg, editorial, photo-grid items).
- `src/components/carousel/CarouselEditor.tsx`:
  - Novo painel "Ajustar imagem" (drag, sliders).
  - Diálogo de substituição com terceira opção "Salvar atual e começar novo".
  - Snapshot/Undo de troca de template.
  - Sticky bottom toolbar no mobile + chat em Sheet no mobile.
  - Tooltips/labels mais claros nos modos de template + faixa "textos preservados".
- `src/components/carousel/ImageAdjustPanel.tsx` (novo) — componente reutilizável de ajuste com pan + sliders.

Sem mudanças no banco de dados. Sem novas dependências (uso `pointerdown/move/up` nativo).



# Plano: Refinos finais da Coleção Journaling

Quatro ajustes pontuais no fluxo já implementado, sem mexer no design dos templates.

## 1. "Aplicar Coleção" preservando conteúdo do usuário

**Arquivo:** `src/components/carousel/CarouselEditor.tsx`

Hoje o botão "Aplicar Coleção Journaling" sobrescreve `title`/`body` com texto-modelo. Vou:

- Trocar o botão único por um **grupo de 2 botões** no painel da Coleção:
  - `✨ Aplicar coleção (manter meu texto)` — **default, recomendado**
  - `🔄 Aplicar coleção + texto modelo` — comportamento atual
- Nova função `applyJournalCollection(opts: { keepContent: boolean })`:
  1. Garante `slideCount = 6` (se menor, cria slides vazios; se maior, mantém os 6 primeiros — confirmar via toast antes de truncar).
  2. Para cada índice `i` de 0..5, faz `updateSlide(i, patch)` onde `patch` aplica:
     - `layout: JOURNAL_LAYOUT_SEQUENCE[i]`
     - cores da paleta atual via `applyPaletteToSlide(slide, palette)` (apenas `bgColor`/`textColor`/`accentColor`/`highlightBgColor`).
     - Se `keepContent === true`: **NÃO** toca `title`, `body`, `imageUrl`, `bgImageUrl`. Só preenche `body` com texto-modelo se estiver vazio E o layout exigir corpo (ex.: `journal-tape-cover` aceita só título).
     - Se `keepContent === false`: aplica `getJournalSampleSlides(palette)[i]` inteiro.
  3. Snapshot de Undo antes de aplicar.
  4. Toast: "Coleção aplicada — seu conteúdo foi preservado" / "Coleção aplicada com texto modelo".

## 2. Persistência correta de `currentJournalPaletteId`

**Arquivos:** `src/components/carousel/CarouselEditor.tsx`

Hoje o id é salvo na sessão, mas em alguns fluxos (trocar template, refresh) o `currentJournalPalette` (objeto) é recomputado a partir do default em vez do id persistido.

Ajustes:
- Substituir o state `currentJournalPalette: JournalPalette` por **derivado** do `currentJournalPaletteId` persistido:
  ```ts
  const currentJournalPalette = useMemo(
    () => JOURNAL_PALETTES.find(p => p.id === sessionState.currentJournalPaletteId) ?? JOURNAL_PALETTES[0],
    [sessionState.currentJournalPaletteId]
  );
  ```
- Setter único `setJournalPaletteId(id)` que atualiza apenas `sessionState.currentJournalPaletteId` (já passa pelo debounce de `useSessionPersistence`).
- Garantir `currentJournalPaletteId` no `EMPTY_CAROUSEL_STATE` (default `"terracota"`) para que o tipo nunca fique `undefined`.
- Ao trocar de template (qualquer `selectTemplate`), **NÃO resetar** o paletteId. Só aplicar a paleta no slide atual se o novo template for da família Journaling.
- No mount: se `selectedTemplate` é Journaling e `currentJournalPaletteId` veio da sessão, reaplicar a paleta nos slides existentes que ainda usem cores do template default (detectar via flag `slide._paletteApplied` que `applyPaletteToSlide` passa a setar).

## 3. Mini-thumbnails reais (120×120) no painel da Coleção

**Arquivos:** `src/components/carousel/CarouselEditor.tsx` (+ reuso do `SlidePreview`)

Substituir os placeholders por mini-renders fiéis:

- Para cada layout em `JOURNAL_LAYOUT_SEQUENCE`, renderizar um `<SlidePreview>` em container 120×120 com a mesma técnica do `TemplatePreviewTooltip`:
  ```tsx
  <div style={{ width: 120, height: 120, overflow: "hidden", borderRadius: 8 }}>
    <div style={{
      width: 1080, height: 1080,
      transform: "scale(0.1111)",
      transformOrigin: "top left",
      pointerEvents: "none",
    }}>
      <SlidePreview slide={thumbSlide} aspectRatio="1:1" slideIndex={i} totalSlides={6} />
    </div>
  </div>
  ```
- `thumbSlide` vem de `buildJournalSampleSlides(currentJournalPalette)[i]` mas com `title` curto ("Título exemplo") e `body` truncado em 60 chars para caber visualmente bem.
- Memoizar (`useMemo`) o array de 6 thumbSlides por `currentJournalPaletteId` para evitar re-render pesado a cada keystroke.
- Click no thumb → aplica **apenas** o `layout` correspondente ao slide atual + paleta atual (não cria slides novos).
- Hover mostra o nome do layout via `Tooltip`.
- Lazy mount: só montar a grade quando o accordion "📓 Coleção Journaling" estiver aberto, para não pagar 6 SlidePreview em todo render.

## 4. Export 1080×1080 estável (mesmo com fonts lentas)

**Arquivo:** `src/components/carousel/CarouselEditor.tsx` (função `exportJournalCollection`)

Garantir captura consistente:

- **Fontes**: antes de capturar, `await document.fonts.ready` E também aguardar fontes específicas usadas pelos templates (Playfair, Caveat, Inter):
  ```ts
  await Promise.all([
    document.fonts.load('700 64px "Playfair Display"'),
    document.fonts.load('400 48px "Caveat"'),
    document.fonts.load('400 32px "Inter"'),
    document.fonts.ready,
  ]);
  ```
- **Imagens**: para cada nó, antes de `toPng`, `await Promise.all([...node.querySelectorAll('img')].map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = r; })))`.
- **Dimensões fixas**: passar para `toPng` opções explícitas para evitar que escala/zoom do browser interfira:
  ```ts
  toPng(node, {
    width: 1080,
    height: 1080,
    canvasWidth: 1080,
    canvasHeight: 1080,
    pixelRatio: 1,
    style: { transform: "none", margin: "0", width: "1080px", height: "1080px" },
    backgroundColor: undefined, // preserva fundo do slide
    cacheBust: true,
  })
  ```
- **Container do exporter**: forçar `width: 1080px`, `height: 1080px` por slide (não deixar `marginBottom: 4` que pode capturar área extra), e `box-sizing: border-box` com `padding: 0; border: 0`.
- **Warm-up**: capturar um frame "descartável" do primeiro slide ANTES do loop oficial — primeira renderização do html-to-image às vezes falha em fonts. Resultado vai pro lixo.
- **Validação pós-captura**: para cada PNG, criar `Image` em memória e checar `naturalWidth === 1080 && naturalHeight === 1080`. Se falhar, retry 1x. Se persistir, log warning + continua (não trava o ZIP).
- **README.txt do ZIP** passa a incluir: paleta usada, data, dimensões, créditos das stock photos (se houver `imageUrl` com `data-attribution`).

## Arquivos tocados

**Editados apenas:**
- `src/components/carousel/CarouselEditor.tsx` — botões duplos, paleta derivada do id, grade de thumbs, export robusto.
- `src/components/carousel/CarouselTemplates.ts` — opcional: helper `applyPaletteToSlide` marca `_paletteApplied` e `getJournalThumbSlides(palette)` para conteúdo curto dos thumbs.
- `src/components/carousel/JournalCollectionExporter.tsx` — remover `marginBottom`, garantir wrapper 1080×1080 estrito.

## Resultado esperado

- "Aplicar coleção (manter meu texto)" troca só layouts e cores, preservando títulos/corpos e imagens já editados pelo usuário.
- Trocar template ou recarregar a página mantém a paleta Journaling exatamente como o usuário escolheu.
- Painel da Coleção mostra 6 mini-previews 120×120 idênticos ao render real, com hover de nome e clique aplicando o layout no slide atual.
- ZIP exportado tem 6 PNGs 1080×1080 exatos, sem bordas, com fontes carregadas e imagens prontas — confiável mesmo em conexões lentas.

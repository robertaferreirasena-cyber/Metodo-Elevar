

# Plano: Captura real da coleção, fallbacks robustos, Banco de Imagens no slide e painel Journaling completo

Vou refatorar a parte que ainda estava parcial (export por placeholder, ausência de UI para palettes/library/coleção e fallbacks fracos) e deixar tudo cabeado de ponta a ponta.

## 1. Captura REAL dos 6 layouts da Coleção Journaling (substituir export atual)

**Arquivo:** `src/components/carousel/CarouselEditor.tsx` + novo `src/components/carousel/JournalCollectionExporter.tsx`

Hoje `exportJournalCollection()` gera um HTML genérico — não representa o design real. Vou substituir por:

- Novo componente `<JournalCollectionExporter>` que renderiza, fora da tela (`position:fixed; left:-99999px; top:0`), 6 instâncias reais de `<SlidePreview nativeSize aspectRatio="1:1">`, uma por layout em `JOURNAL_LAYOUT_SEQUENCE`, recebendo:
  - `slide` montado com a paleta atual (state `currentJournalPalette`),
  - título/corpo de exemplo (mesmos textos para comparação justa),
  - `profileHandle` da persona (se houver),
  - índice `i` e `total = 6`.
- O exporter expõe um `ref` por layout (`exportRefs`).
- `exportJournalCollection()` passa a:
  1. Montar o exporter (state `mountExporter=true`) e aguardar `requestAnimationFrame` + `document.fonts.ready` + 300ms.
  2. Capturar cada ref com `html-to-image / toPng` em 1080×1080, `pixelRatio: 1`.
  3. Adicionar cada PNG ao `JSZip` com nome `01-journal-tape.png` … `06-journal-envelope.png`.
  4. Incluir um `README.txt` no zip (paleta usada + créditos).
  5. Baixar `colecao-journaling-{paletaId}.zip`.
  6. Desmontar o exporter.

Resultado: ZIP com PNGs idênticos ao que aparece no preview, fiéis ao design.

## 2. Fallbacks robustos para `journal-photo-card` e `journal-torn-paper`

**Arquivo:** `src/components/carousel/SlidePreview.tsx`

Hoje já existem fallbacks, mas são fracos (fundo cinza `#444` com ícone). Vou trocar por placeholders coerentes com a paleta:

- Quando `!photoUrl`:
  - **journal-photo-card**: fundo com gradiente `linear-gradient(135deg, slide.bgColor, mix-darker(slide.bgColor))` + textura `PAPER_TEXTURES.linen` por cima a 30% opacidade + ícone `ImagePlus` discreto canto inferior esquerdo + selo `<GoldStamp>` decorativo. O card de título e o mini-card de body continuam renderizando normalmente.
  - **journal-torn-paper**: já tem gradiente; vou adicionar textura `PAPER_TEXTURES.kraft` e ícone `ImagePlus` semi-transparente atrás do papel rasgado para sinalizar "adicione foto" sem quebrar.
- Adicionar badge no editor (controle de imagem desses layouts): `📸 Foto recomendada — sem foto, este layout usa fundo decorativo`.

Validação no export: como o fallback é puramente CSS/SVG, garante que o PNG nunca sai quebrado.

## 3. Renderização correta dos 6 templates Journaling ao selecionar a coleção

**Arquivo:** `src/components/carousel/CarouselEditor.tsx`

Hoje `applyTemplateToAll` já distribui `JOURNAL_LAYOUT_SEQUENCE` em sequência quando o template é da família. Vou complementar:

- **Botão único "Aplicar Coleção Journaling"** no painel da coleção (ver §5) que, em 1 clique:
  1. Define `slideCount = 6` se atualmente for diferente.
  2. Se já houver slides, redistribui os 6 layouts em ordem (`JOURNAL_LAYOUT_SEQUENCE`).
  3. Aplica paleta atual (default: Terracota).
  4. Para slides sem `body`, preenche com texto-modelo.
- Garantir que `createSlidesFromTemplate` para qualquer ID journal-* receba também o layout em sequência (não apenas o `template.layout` único).
- Adicionar mini-thumbnails reais dos 6 layouts no seletor (mini-render de `SlidePreview` em 120×120) para o usuário ver antes de aplicar.

## 4. Botão "Banco de Imagens" dentro de cada slide

**Arquivo:** `src/components/carousel/CarouselEditor.tsx`

Adicionar botões `🖼 Banco de imagens` ao lado de cada upload existente:

- Ao lado de **"Imagem de fundo"** → abre `<ImageLibraryPicker>` com `libraryTarget="bg"`.
- Ao lado de **"Imagem do layout"** (visível em `image-bg`, `editorial`, `journal-photo-card`, `journal-torn-paper`) → abre com `libraryTarget="image"`.
- `onSelect(dataUrl, attribution)`:
  - Se `libraryTarget === "bg"`: `updateSlide(currentSlide, { bgImageUrl: dataUrl })`.
  - Se `"image"`: `updateSlide(currentSlide, { imageUrl: dataUrl })`.
  - Em ambos: snapshot para Undo + toast com a atribuição.
- Sugestão automática de query: usar `topic` + nicho da persona como `suggestedQuery`.
- `orientation` enviado para o picker = `selectedTemplate.aspectRatio`.
- Ampliar `IMAGE_LAYOUTS` para incluir `journal-photo-card` e `journal-torn-paper` para que `showImageUpload` ative o botão neles.

## 5. Painel "Coleção Journaling" no seletor de templates

**Arquivo:** `src/components/carousel/CarouselEditor.tsx` (dentro do bloco Template selector)

Quando `isJournalTemplate(selectedTemplate.id)` (ou usuário expandir um accordion "📓 Coleção Journaling"), mostrar um sub-painel sticky com:

```
┌─────────────────────────────────────────────────┐
│ 📓 Coleção Journaling                          │
│                                                  │
│ Paleta:                                          │
│ [🟫 Terracota] [🌿 Sálvia] [🍷 Borgonha]        │
│ [🌊 Marinho] [🍑 Pêssego] [🤎 Creme] [🎲]      │
│                                                  │
│ Layouts (6):                                     │
│ [thumb1] [thumb2] [thumb3] [thumb4] [thumb5] [thumb6]
│                                                  │
│ [✨ Aplicar Coleção (6 slides)]                 │
│ [📥 Exportar prévia da coleção (.zip)]          │
└─────────────────────────────────────────────────┘
```

- **6 swatches de paleta**: chips circulares 32×32 com `background: palette.swatch`, label sob hover. Clique → `applyJournalPalette(palette)` + persiste em `currentJournalPalette` no session state.
- **Botão 🎲 Aleatório**: escolhe paleta aleatória.
- **6 thumbnails de layouts**: mini-renderizações estáticas (80×80) usando paleta atual + texto curto exemplo. Clique aplica somente aquele layout no slide atual.
- **Botão "Aplicar Coleção"**: roda fluxo do §3.
- **Botão "Exportar prévia"**: roda fluxo do §1, com loading spinner (`exportingCollection`).
- Persistir `currentJournalPalette` em `CarouselSessionState`.

## 6. Tipos / persistência

**Arquivo:** `src/components/carousel/CarouselEditor.tsx`

Adicionar ao `CarouselSessionState`:
- `currentJournalPaletteId: string` (default `"terracota"`).

Carregar/salvar no `useSessionPersistence` existente (sem mudar storage, só novos campos).

## Arquivos tocados

**Novos:**
- `src/components/carousel/JournalCollectionExporter.tsx` — host off-screen com 6 SlidePreview reais.

**Editados:**
- `src/components/carousel/CarouselEditor.tsx` — substitui export, painel Journaling, botões library, persistência paleta.
- `src/components/carousel/SlidePreview.tsx` — fallbacks ricos em photo-card/torn-paper.
- `src/components/carousel/CarouselTemplates.ts` — exporta helper `getJournalSampleSlides(palette)` para o exporter usar conteúdo padrão.

## Resultado esperado

- Clicar "Exportar prévia da coleção" gera um ZIP com **6 PNGs idênticos ao preview** (não mais um placeholder genérico).
- `journal-photo-card` e `journal-torn-paper` sem foto exibem fundo decorativo coerente com a paleta — nunca quebram o export.
- Selecionar qualquer template Journaling mostra o painel da coleção com 6 paletas, 6 thumbnails, botão "Aplicar Coleção" e "Exportar prévia".
- Cada slide tem botão "🖼 Banco de imagens" ao lado de cada upload, que aplica a foto escolhida em `imageUrl` ou `bgImageUrl` automaticamente.
- Estado da paleta atual persiste entre sessões.


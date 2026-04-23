

# Plano: Família de templates "Journaling" (6 novos layouts) — render fiel aos modelos

## Visão geral
Os 6 modelos enviados pertencem à mesma família visual: **papelaria orgânica** — fundos texturizados (papel kraft, linho, juta, parede pintada), folhas de caderno presas com **fita adesiva / clipe metálico / selo dourado**, **cards de destaque** retangulares (vermelho, cobre, verde-oliva), tipografia **serif itálica** (Cormorant/Playfair) com sublinhados sutis e marca d'água `@suamarca` no rodapé.

Vou criar **1 nova família de layouts** com **6 variantes** (uma por modelo), cada uma renderizando perfeitamente o conteúdo da IA (`title` + `body`) na estrutura visual exata. Cada slide do carrossel pode usar uma variante diferente, e quando o usuário escolhe a "Coleção Journaling", o sistema **distribui automaticamente as variantes em sequência** para manter ritmo visual.

## 1. Novos `CarouselLayout`

Adicionar em `CarouselTemplates.ts`:

```ts
export type CarouselLayout =
  | ...existentes
  | "journal-note"        // modelo_6 — folha de caderno + selo dourado, fundo texturizado
  | "journal-tape"        // modelo_7 (sup) — folha presa com fita + card vermelho
  | "journal-photo-card"  // modelo_7 (mid) / modelo1 — foto de fundo + card colorido sobreposto
  | "journal-binder"      // modelo_2 (sup-esq) / modelo_5 (inf-esq) — espiral metálico no topo
  | "journal-torn-paper"  // modelo_3 — papel rasgado sobre foto de natureza
  | "journal-envelope";   // modelo_5 (sup-esq) — envelope aberto + selo de cera
```

## 2. Estrutura de cada layout (renderização fiel)

### `journal-note` (modelo_6)
```text
┌─────────────────────────────┐  fundo: textura papel/linho (cor de fundo do template)
│  · · · MICRO HEADER · · ·   │  topo: 1/N + tagline opcional
│      ╭──────────────╮       │
│      │ ●  selo ouro │       │  card branco quadriculado (grid lines sutis)
│      │              │       │  rotação leve (-1.5deg)
│      │  TÍTULO em   │       │  borda esquerda: faixa vermelha 8px
│      │  serif italic│       │
│      ╰──────────────╯       │
│   ┌─ card destaque ─┐       │  card colorido (accent) com body
│   │ corpo do texto  │       │  rotação +1deg, fita adesiva no canto
│   └─────────────────┘       │
│        @suamarca            │
└─────────────────────────────┘
```
- `title` → dentro do card branco, serif itálica, sublinhado em "destaque"
- `body` → dentro do card colorido (accent), sans-serif, branco
- Decorações SVG inline: selo dourado circular, fita washi, linhas de caderno

### `journal-tape` (modelo_7 superior)
- Fundo vermelho/cobre liso
- Folha de caderno **rotacionada -3deg**, presa por **2 pedaços de fita washi** (SVG) nos cantos superiores
- Título serif italic dentro da folha
- Card menor **rotacionado +2deg** sobreposto no canto inferior direito com `body`
- Seta desenhada à mão (SVG curvo) apontando do título para o card

### `journal-photo-card` (modelo_7 meio + modelo1)
- **Foto de fundo full-bleed** (usa `imageUrl` do slide) com leve overlay
- **Card retangular sólido** (cor accent: vermelho/oliva) sobreposto, centralizado ou alinhado à esquerda
- Título serif italic dentro do card, branco
- **Mini-card secundário** (papel branco quadriculado) abaixo com `body`, rotacionado
- Selo dourado decorativo

### `journal-binder` (modelo_2 + modelo_5)
- Fundo texturizado cor sólida
- **Espiral metálico horizontal** no topo (SVG: anéis circulares + barra)
- Folha de papel pendurada nele, ocupando 75% da altura
- Título centralizado serif italic
- Card accent abaixo com body
- Numeração 1/N no topo

### `journal-torn-paper` (modelo_3)
- **Foto de fundo** (paisagem/natureza) — usa `bgImageUrl`
- **Forma de papel rasgado** (SVG path orgânico, bordas irregulares) sobreposta no centro
- Título grande serif italic dentro do papel rasgado
- Body em fonte menor abaixo
- Caneta ou objeto decorativo opcional (SVG)

### `journal-envelope` (modelo_5)
- Fundo cobre/marrom liso
- **Envelope SVG aberto** desenhado, com aba superior dobrada
- **Selo de cera vermelho** (círculo SVG com textura) no centro do envelope
- Título serif italic emergindo do envelope
- Faixa horizontal vermelha embaixo com `body` em branco

## 3. Renderização no `SlidePreview.tsx`

Adicionar 6 novos blocos `{layout === "journal-XXX" && (...)}`. Cada um:
1. Usa `padPx`, `fontScale`, `titleStyle`, `bodyStyle` já existentes (consistência).
2. Decorações **100% SVG inline** (selo, fita, espiral, envelope, papel rasgado, linhas de caderno) — sem imagens externas, garantindo export PNG perfeito.
3. Texturas de fundo: gradientes CSS sutis simulando papel/linho (`repeating-linear-gradient` para grid, `radial-gradient` para grão).
4. Suporta as imagens do slide (`imageUrl`, `bgImageUrl`) com os mesmos controles de pan/zoom/filtro já implementados no `ImageAdjustPanel`.
5. Respeita `aspectRatio` (todos funcionam em 1:1 e 9:16).
6. Footer `@profileHandle` discreto no rodapé (já presente no `SlideData`).

## 4. Os 6 novos `CarouselTemplate` (catálogo)

Em `CAROUSEL_TEMPLATES`, adicionar bloco "Coleção Journaling":

| id | Nome | Layout | bg | accent | Fonte título |
|---|---|---|---|---|---|
| `journal-cream` | 📓 Caderno Cream | `journal-note` | `#f5e9d5` (linho creme) | `#b94a3a` | Cormorant Garamond |
| `journal-rust` | 📓 Caderno Rust | `journal-tape` | `#a23e2e` (vermelho terra) | `#f0e6d2` | Playfair Display |
| `journal-olive` | 🌿 Caderno Olive | `journal-photo-card` | `#6b7a3a` (oliva) | `#fefdf8` | Cormorant Garamond |
| `journal-copper` | ✉️ Caderno Copper | `journal-envelope` | `#b8693d` (cobre) | `#7a1f15` | Playfair Display |
| `journal-forest` | 🌱 Caderno Forest | `journal-torn-paper` | foto fundo | `#fefdf8` | Cormorant Garamond |
| `journal-binder` | 📎 Caderno Espiral | `journal-binder` | `#e85a2a` (laranja) | `#fefdf8` | Cormorant Garamond |

Todos com `titleSize: 38`, `bodySize: 18`, `align: "center"`, `aspectRatio: "1:1"`.

## 5. "Coleção" — distribuição automática em sequência

No `CarouselEditor.tsx`, ao aplicar um template do grupo Journaling com modo **"Aplicar a todos"**, em vez de copiar o **mesmo** layout em todos os slides, **rotaciona** entre as 6 variantes na ordem:
```
slide 0 → journal-tape (capa impactante)
slide 1 → journal-note
slide 2 → journal-photo-card
slide 3 → journal-binder
slide 4 → journal-torn-paper
slide 5+ → journal-envelope (CTA / encerramento)
```
Lógica: `JOURNAL_SEQUENCE[slideIndex % JOURNAL_SEQUENCE.length]`, sobrescrevendo apenas `layout`, mantendo paleta/fonte do template escolhido. Isso garante que uma carrossel de 6 slides **automaticamente** parece um conjunto coerente como nas referências.

Modos `current` e `preserve` continuam aplicando uma única variante (a do template clicado).

## 6. UI — Nova seção no painel de templates

Em `CarouselEditor.tsx`, agrupar templates por categoria (já existem grupos implícitos). Adicionar header **"📓 Coleção Journaling — papelaria orgânica"** com badge "Novo" antes dos 6 cards. Tooltip explica: "Carrossel inteiro vira um caderno: cada slide ganha uma variação visual em sequência."

## 7. Decorações SVG (componentes reutilizáveis)

Criar `src/components/carousel/journalDecorations.tsx` exportando:
- `<WashiTape angle x y color />` — fita adesiva
- `<WaxSeal color />` — selo de cera vermelho com textura
- `<GoldStamp />` — selo dourado circular
- `<SpiralBinder />` — espiral metálico horizontal
- `<TornPaperPath fill />` — `<path>` SVG de papel rasgado
- `<EnvelopeShape color />` — envelope aberto
- `<NotebookLines color />` — grid de linhas de caderno
- `<HandDrawnArrow />` — seta desenhada à mão

Tudo SVG puro → exporta perfeito em PNG via `html-to-image`.

## 8. Texturas de fundo (CSS puro)

```ts
const PAPER_TEXTURES = {
  linen: "repeating-linear-gradient(0deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 3px)",
  kraft: "radial-gradient(circle at 30% 20%, rgba(0,0,0,0.04), transparent 60%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.03), transparent 50%)",
  notebook: "repeating-linear-gradient(0deg, transparent 0px, transparent 28px, rgba(180,30,30,0.15) 28px, rgba(180,30,30,0.15) 29px)",
};
```
Aplicadas como camada extra atrás do conteúdo.

## 9. Persistência e mobile (sem regressão)

- Os novos layouts entram no mesmo `SlideData` — **nenhum campo novo** necessário (reaproveita `imageUrl`, `bgImageUrl`, `profileHandle`, ajustes de imagem).
- Persistência via `useSessionPersistence` continua funcionando.
- Ajustes de imagem (zoom/pan/brilho) aplicáveis ao `journal-photo-card`, `journal-torn-paper` e `journal-binder`.
- Safe-area mobile e export PNG/ZIP já cobrem qualquer layout novo automaticamente.

## 10. Arquivos tocados

- `src/components/carousel/CarouselTemplates.ts` — +6 layouts no type, +6 templates no catálogo, constante `JOURNAL_SEQUENCE`, helper `PAPER_TEXTURES`.
- `src/components/carousel/SlidePreview.tsx` — +6 blocos de renderização.
- `src/components/carousel/journalDecorations.tsx` (novo) — componentes SVG decorativos.
- `src/components/carousel/CarouselEditor.tsx` — agrupamento visual "Coleção Journaling" + lógica de distribuição automática em sequência ao aplicar a todos.

## Resultado esperado

Ao clicar em qualquer template Journaling e escolher "Aplicar a todos", o carrossel inteiro vira um conjunto visualmente narrativo idêntico às referências enviadas — capa com fita, slides com folhas e selos, slides com foto e card sobreposto, e fechamento em envelope com selo de cera. Conteúdo da IA (`title` + `body`) entra automaticamente nos lugares certos de cada variante.


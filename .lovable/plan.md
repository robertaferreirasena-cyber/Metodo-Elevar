

# Plano: Editor lateral funcional + correção de overflow nos templates Journaling

## Problema 1 — Color pickers ignorados nos layouts Journaling

Hoje os 6 layouts journal (`journal-note`, `journal-tape`, `journal-photo-card`, `journal-binder`, `journal-torn-paper`, `journal-envelope`) **hardcodam** as cores do título e do corpo:

- Título usa `color: slide.accentColor` ou `color: slide.bgColor` direto, **ignorando `slide.titleColor`**.
- Caixa de corpo usa `background: "#fefdf8"` (papel fixo) ou `background: slide.accentColor` fixo, **ignorando qualquer ajuste**.
- Texto do corpo usa `color: slide.bgColor` ou `color: "#fefdf8"` fixo, **ignorando `slide.bodyColor`**.

Resultado: trocar "Cor do Título" / "Cor do Corpo" / "Cor de Destaque" no painel lateral não muda nada visualmente.

### Correção em `src/components/carousel/SlidePreview.tsx`

Para cada um dos 6 layouts journal, trocar os valores fixos por uma cadeia de fallback que respeita o que o usuário escolheu no painel:

```
titleColor → slide.titleColor ?? slide.accentColor   (ou cor original do layout)
bodyTextColor → slide.bodyColor ?? slide.textColor
cardBg (caixa destaque) → slide.highlightBgColor ?? slide.accentColor
paperBg (folha de caderno) → "#fefdf8" (mantém — é a "folha", parte da identidade)
```

Mais especificamente, por layout:

| Layout | Antes (hardcoded) | Depois (respeita picker) |
|---|---|---|
| `journal-note` | título: `slide.accentColor`; card-body bg: `slide.accentColor`; texto: `#fefdf8` | título: `slide.titleColor ?? slide.accentColor`; card-body bg: `slide.highlightBgColor ?? slide.accentColor`; texto: `slide.bodyColor ?? "#fefdf8"` |
| `journal-tape` | título: `slide.bgColor`; card-body bg: `#fefdf8`; texto: `slide.bgColor` | título: `slide.titleColor ?? slide.bgColor`; card-body bg: `slide.highlightBgColor ?? "#fefdf8"`; texto: `slide.bodyColor ?? slide.bgColor` |
| `journal-photo-card` | título: `#fefdf8` em card `slide.accentColor`; texto: `#3a1a12` em card `#fefdf8` | título: `slide.titleColor ?? "#fefdf8"`; card-title bg: `slide.highlightBgColor ?? slide.accentColor`; texto: `slide.bodyColor ?? "#3a1a12"` |
| `journal-binder` | título: `slide.accentColor`; card-body bg: `slide.accentColor`; texto: `#fefdf8` | título: `slide.titleColor ?? slide.accentColor`; card-body bg: `slide.highlightBgColor ?? slide.accentColor`; texto: `slide.bodyColor ?? "#fefdf8"` |
| `journal-torn-paper` | título: `slide.textColor`; texto: `slide.textColor` opacity 0.8 | título: `slide.titleColor ?? slide.textColor`; texto: `slide.bodyColor ?? slide.textColor` |
| `journal-envelope` | título: `#fefdf8`; card-body bg: `slide.accentColor`; texto: `#fefdf8` | título: `slide.titleColor ?? "#fefdf8"`; card-body bg: `slide.highlightBgColor ?? slide.accentColor`; texto: `slide.bodyColor ?? "#fefdf8"` |

Cor de fundo do slide (`slide.bgColor`) **já é usada** em todos esses layouts — então o picker de fundo já funciona; só os outros três (título, corpo, destaque) estavam quebrados.

## Problema 2 — Caixa de corpo "ultrapassada" (overflow visual)

No print enviado (template Rust com layout `journal-tape`), a caixa amarronzada do corpo está **cortada na borda inferior do slide**. Causa raiz:

- Cards são posicionados com `bottom: spec.height * 0.10` mas têm **altura automática** baseada no conteúdo.
- Não existe `maxHeight` nem `overflow` nem auto-shrink por tamanho de texto.
- `getJournalScale()` só ajusta para Stories 9:16, não para 1:1 com texto longo.

### Correção em `src/components/carousel/SlidePreview.tsx`

Adicionar 3 ajustes uniformes em todos os layouts journal que renderizam um "card de corpo" (`note`, `tape`, `photo-card`, `binder`, `envelope`):

1. **Auto-shrink por comprimento de corpo** (estender `getJournalScale` em `journalScaleHelpers.ts`):
```text
bodyMul (1:1) atual: aplica só se >320 chars → 0.85
novo: >280 chars → 0.85, >180 chars → 0.92  (também para 1:1)
```

2. **Constrain do card no slide** — em cada card de corpo:
```text
maxHeight: spec.height * 0.32           // nunca passa de 32% da altura do slide
maxWidth: spec.width * 0.88             // safety horizontal
overflow: "hidden"                      // garante que se passar, corta visualmente em vez de vazar
boxSizing: "border-box"
```

3. **Reposicionamento defensivo** — substituir `bottom: spec.height * 0.10` por:
```text
bottom: Math.max(spec.height * 0.06, safePadY)   // sobe um pouco se texto for grande
```
e em `journal-tape` especificamente, o card menor da direita também recebe `maxHeight: spec.height * 0.28` com `overflow: hidden`.

4. **Padding interno proporcional** — o padding do card vira `clamp` baseado em `bodyMul`:
```text
padding: `${(18 * fontScale) * j.bodyMul}px ${(22 * fontScale) * j.bodyMul}px`
```
Assim, texto longo → padding menor → mais espaço para conteúdo.

Resultado: a caixa nunca mais sai da área visível do slide; quando o texto é muito longo, ela encolhe a fonte e o padding antes de cortar; e se mesmo assim sobrar, `overflow: hidden` evita o vazamento visual mostrado no print.

## Problema 3 — Falta de controle no painel lateral para ajustar a caixa

Adicionar no `CarouselEditor.tsx`, **só quando o slide atual usa um layout journal**, dois controles novos no painel "Cores e estilo":

1. **Slider "Tamanho da caixa de destaque"** (0.7× a 1.3×, default 1.0×)
   - Persistido em novo campo `slide.highlightScale?: number` em `SlideData`.
   - Multiplica `cardW` e `padding` dos cards de corpo nos 6 layouts journal.

2. **Slider "Posição vertical da caixa"** (-15% a +15%, default 0%)
   - Persistido em `slide.highlightOffsetY?: number`.
   - Soma a `bottom` calculado nos 5 layouts com card flutuante.

Esses dois controles dão à usuária a "alça" que ela pediu ("não tem um detalhe que eu possa ajustar pra ficar bonito o formato") sem precisar mexer em código.

## Critérios de aceitação

- Selecionar qualquer template Journaling → mudar "Cor do Título" no painel → o título do slide journal muda imediatamente.
- Mudar "Cor do Corpo" → o texto dentro da caixa de destaque muda.
- Mudar "Cor de Destaque" → o fundo da caixa de destaque (selo / card) muda.
- Texto longo (>280 caracteres no corpo) no template Rust → fonte encolhe automaticamente, card permanece **inteiro** dentro do slide, sem vazar para fora da borda.
- Novos sliders "Tamanho da caixa" e "Posição vertical" aparecem **apenas** quando o slide ativo usa layout journal e ajustam o card em tempo real.

## Arquivos editados

- `src/components/carousel/SlidePreview.tsx` (refatoração de cores + clamps de overflow nos 6 layouts journal)
- `src/components/carousel/journalScaleHelpers.ts` (auto-shrink mais agressivo para 1:1)
- `src/components/carousel/CarouselTemplates.ts` (novos campos opcionais `highlightScale`, `highlightOffsetY` em `SlideData`)
- `src/components/carousel/CarouselEditor.tsx` (2 sliders condicionais no painel quando layout é journal)


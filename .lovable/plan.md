
# Plano: Cache de imagens, temas offline para "Texto exemplo" e persistência da paleta Journaling

Três ajustes pontuais e independentes nas peças já existentes da Coleção Journaling.

## 1. Cache de resultados no "Banco de imagens"

**Arquivo:** `src/components/carousel/ImageLibraryPicker.tsx`

Adicionar cache client-side em `sessionStorage` (complementa o cache de 5min que já existe no edge worker, mas elimina até a chamada de rede quando o usuário alterna entre layouts):

- Chave: `img_lib_cache_v1::${query}::${orientation}::${page}`
- TTL: 10 minutos
- Estrutura: `{ ts: number, images: ImageItem[] }`
- Tamanho máximo: 30 entradas (LRU simples por timestamp)

Fluxo na função `search()`:
1. Normaliza `term` (lowercase + trim).
2. Lê `sessionStorage` — se houver hit válido, `setResults(cached.images)` e retorna sem chamar fetch.
3. Em miss, chama o edge function como hoje, e ao receber resposta `ok` grava no cache.
4. Em erro, NÃO grava no cache.

Também: ao abrir o dialog com `suggestedQuery`, dispara `search(suggestedQuery)` automaticamente uma vez (hoje exige clique). Isso aproveita o cache imediatamente quando o usuário troca de layout no mesmo tema.

Helpers internos (`getCached`, `setCached`, `pruneCache`) ficam no próprio arquivo — sem nova lib.

## 2. Seletor de tema para "📋 Texto exemplo"

**Arquivos:**
- `src/components/carousel/CarouselTemplates.ts` — exportar `JOURNAL_SAMPLE_THEMES`
- `src/components/carousel/CarouselEditor.tsx` — UI do seletor

**Em `CarouselTemplates.ts`:** criar e exportar 4 temas pré-prontos compatíveis com `buildJournalSampleSlides(palette, themeId)`:

```ts
export const JOURNAL_SAMPLE_THEMES = [
  { id: "autoestima",   label: "Autoestima",          slides: [...6 títulos+corpos...] },
  { id: "rotina",       label: "Rotina matinal",      slides: [...] },
  { id: "produtividade",label: "Produtividade leve",  slides: [...] },
  { id: "vendas",       label: "Vendas com leveza",   slides: [...] },
];
```

`buildJournalSampleSlides(palette, themeId?)` aceita `themeId` opcional; quando ausente, mantém o conteúdo genérico atual (compat).

**No painel da Coleção em `CarouselEditor.tsx`:** o botão "📋 Texto exemplo" vira um pequeno cluster:

```text
[Tema: ▼ Autoestima ] [📋 Aplicar texto exemplo]
```

- `Select` shadcn com as 4 opções + "Genérico" (default).
- Estado local `sampleThemeId` (não precisa persistir).
- Ao clicar "Aplicar", chama `buildJournalSampleSlides(currentJournalPalette, sampleThemeId)` + distribui `JOURNAL_LAYOUT_SEQUENCE` + `setSlides(...)` + Undo + toast.

## 3. Persistência robusta de `currentJournalPaletteId`

**Arquivo:** `src/components/carousel/CarouselEditor.tsx`

Hoje a paleta já é persistida em `localStorage` (chave `journal_palette_id`), mas existem dois pontos onde ela pode "voltar diferente":

**3.1.** Ao trocar de template Journaling, hoje algumas branches resetam o id para o default da paleta da template. Vou:
- Centralizar a leitura inicial num `useState(() => localStorage.getItem("journal_palette_id") || JOURNAL_PALETTES[0].id)`.
- No `useEffect` que reage a mudança de template, NÃO sobrescrever `currentJournalPaletteId` se já houver um valor válido salvo (verificar se o id ainda existe em `JOURNAL_PALETTES`); só fazer fallback para o default quando o id salvo for inválido.

**3.2.** Garantir gravação imediata em todo `setCurrentJournalPaletteId`:
- Trocar chamadas diretas por um wrapper `updateJournalPaletteId(id)` que faz `setCurrentJournalPaletteId(id)` + `localStorage.setItem("journal_palette_id", id)` na mesma linha.
- Aplicar o wrapper em: `applyJournalPalette`, clique nos swatches, `applyJournalCollection` (todas as variantes), `generateJournalCollection`, `applyJournalLayoutToCurrent`.

**3.3.** No mount inicial do editor, após hidratar `currentJournalPaletteId` do storage, disparar uma vez `applyJournalPalette(palette, { onlyMissing: true })` para reaplicar as cores da paleta nos slides Journaling existentes que ainda não tenham `bgColor`/`textColor` customizados — sem sobrescrever o que o usuário editou.

## Critérios de aceitação

- Trocar entre layouts Journaling com o "Banco de imagens" aberto e a mesma busca: segundo open mostra resultados instantaneamente, sem chamada de rede (verificável no DevTools).
- Painel da Coleção mostra "Tema: [Select] [📋 Aplicar texto exemplo]"; cada um dos 4 temas gera 6 slides coerentes naquele tom, com layouts distribuídos.
- Escolher paleta "Pôr do sol", recarregar a página → paleta volta como "Pôr do sol" e os slides Journaling renderizam com as cores certas.
- Trocar de template Journaling A → B → A: a paleta escolhida persiste em todas as transições.
- Cores customizadas pelo usuário (via color pickers) não são sobrescritas pela reaplicação automática da paleta no mount.

## Arquivos editados
- `src/components/carousel/ImageLibraryPicker.tsx`
- `src/components/carousel/CarouselTemplates.ts`
- `src/components/carousel/CarouselEditor.tsx`

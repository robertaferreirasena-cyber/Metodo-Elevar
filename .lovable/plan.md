
# Plano: Coleção Journaling consistente com geração da Mentora Gi + correções

## 1. Fix runtime error no `ImageAdjustPanel`
**Arquivo:** `src/components/carousel/ImageAdjustPanel.tsx` (linha 32)

`v = { ...DEFAULTS, ...values }` quebra quando `values` contém `scale: undefined` explicitamente (spread sobrescreve com `undefined`, e `v.scale.toFixed(2)` crasha). Vou trocar por merge seguro que ignora `undefined`:

```ts
const v = (Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]).reduce((acc, k) => {
  acc[k] = values[k] ?? DEFAULTS[k];
  return acc;
}, {} as Required<ImageAdjustValues>);
```

## 2. Fix do "Banco de imagens" (CORS + erro de chamada)
**Arquivo:** `supabase/functions/image-library-search/index.ts`

Adicionar `apikey` e `x-supabase-*` no `Access-Control-Allow-Headers` (faltam os `x-supabase-client-*` que o navegador envia hoje, causando preflight fail):

```ts
"Access-Control-Allow-Headers":
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
```

Também:
- Trocar a auth manual por `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).auth.getUser(token)` (mais robusto, igual aos outros functions).
- Garantir mensagens de erro claras quando `UNSPLASH_ACCESS_KEY`/`PEXELS_API_KEY` faltarem ou retornarem 401 (logar status e devolver `{ error }` legível para o toast no client mostrar).

**Arquivo:** `src/components/carousel/ImageLibraryPicker.tsx` — adicionar header `apikey: VITE_SUPABASE_PUBLISHABLE_KEY` nas duas chamadas (search + fetch) para passar pelo gateway do Supabase consistentemente.

Redeploy automático da function.

## 3. Templates Journaling se comportam como os outros (texto da Mentora Gi + layouts distribuídos)

**Arquivo:** `src/components/carousel/CarouselTemplates.ts`

Atualizar `createSlidesFromTemplate` para detectar templates Journaling e distribuir os 6 layouts da `JOURNAL_LAYOUT_SEQUENCE` em vez de aplicar sempre `template.layout`:

```ts
export function createSlidesFromTemplate(template, content) {
  const isJournal = isJournalTemplate(template.id);
  return content.map((c, i) => ({
    title: c.title, body: c.body,
    bgColor: template.bgColor, textColor: template.textColor, accentColor: template.accentColor,
    titleSize: template.titleSize, bodySize: template.bodySize,
    fontFamily: template.fontFamily, align: template.align, bgGradient: template.bgGradient,
    layout: isJournal
      ? JOURNAL_LAYOUT_SEQUENCE[i % JOURNAL_LAYOUT_SEQUENCE.length]
      : template.layout,
    highlightBgColor: template.highlightBgColor,
  }));
}
```

Resultado: ao escolher um template Journaling + clicar **"Gerar Carrossel com Mentora Gi"**, o carrossel sai com os títulos/corpos gerados pela IA E com os 6 layouts narrativos distribuídos automaticamente — exatamente como os outros templates, mas com a riqueza visual da coleção.

## 4. "Aplicar com texto modelo" agora gera com IA baseado no tema

**Arquivo:** `src/components/carousel/CarouselEditor.tsx`

Hoje o botão usa `buildJournalSampleSlides()` (texto genérico estático). Vou:

- Renomear/atualizar o botão para **"🪄 Gerar coleção com texto da Mentora Gi"**.
- Adicionar nova função `generateJournalCollection()` que:
  1. Valida `topic` (se vazio, abre toast "Informe o tema do carrossel acima").
  2. Faz a mesma chamada que `generateContent`, mas forçando `slideCount = 6` e adicionando ao prompt instrução específica:
     > "Os 6 slides serão renderizados em layouts visuais distintos de uma coleção 'Journaling' (capa com fita, página de caderno, foto + card, espiral, papel rasgado, envelope/CTA). Mantenha consistência narrativa entre eles."
  3. No retorno, chama `createSlidesFromTemplate(journalTemplate, slides)` (que agora distribui os 6 layouts), aplica `applyPaletteToSlide` com a paleta atual em cada um e seta `setSlides(...)`.
  4. Toast de sucesso + Undo.
- Manter o botão **"✨ Aplicar coleção (manter meu texto)"** como está (preserva conteúdo, troca só layouts/paleta).
- Manter um terceiro botão menor **"📋 Usar texto exemplo"** para fallback offline (usa `buildJournalSampleSlides` atual).

Layout dos botões no painel da Coleção:
```text
[🪄 Gerar com Mentora Gi] [✨ Manter meu texto] [📋 Texto exemplo]
[📥 Exportar prévia da coleção]
```

## 5. Autonomia total de edição em templates Journaling

**Arquivo:** `src/components/carousel/CarouselEditor.tsx`

Verificação: o painel direito (sliders de fonte, color pickers de título/corpo/accent/fundo, alinhamento, negrito/itálico, upload de imagem, ajustes de imagem) já é renderizado para qualquer template — não há guard escondendo controles para Journaling. O problema percebido vem do `applyPaletteToSlide` que zerava `titleColor`/`bodyColor` sempre que a paleta era aplicada, sobrescrevendo o que o usuário escolheu.

Ajustes:
- Em `applyJournalPalette` e `applyJournalLayoutToCurrent`: **só** zerar `titleColor`/`bodyColor` se ainda forem `undefined` (preservar customizações do usuário).
- Adicionar ao painel direito, quando o slide atual for layout Journaling, um mini-bloco **"🎨 Cores do Journaling"** com 4 color pickers diretos (`bgColor`, `textColor`, `accentColor`, `highlightBgColor`) + botão "Resetar para paleta". Isso deixa explícito que tudo é editável.
- Garantir que `bgImageUrl`/`imageUrl`/ajustes de imagem (zoom, brilho, contraste, blur, posição) já existentes funcionem nos layouts `journal-photo-card` e `journal-torn-paper` (já funcionam — só verificar que o painel `ImageAdjustPanel` aparece quando `bgImageUrl` está setado, mesmo em layouts journal).

## Arquivos editados
- `src/components/carousel/ImageAdjustPanel.tsx` — fix do undefined merge
- `supabase/functions/image-library-search/index.ts` — CORS headers + auth
- `src/components/carousel/ImageLibraryPicker.tsx` — header `apikey`
- `src/components/carousel/CarouselTemplates.ts` — `createSlidesFromTemplate` distribui layouts journal
- `src/components/carousel/CarouselEditor.tsx` — `generateJournalCollection`, novos botões, painel "Cores do Journaling", preserva customizações de cor

## Resultado esperado
- Slider de zoom da imagem volta a funcionar sem crash.
- Banco de imagens abre, busca e aplica fotos do Unsplash/Pexels nos slides sem erro.
- Selecionar um template Journaling + digitar tema + clicar "Gerar Carrossel com Mentora Gi" produz 6 slides com **textos gerados pela IA** distribuídos nos **6 layouts narrativos** da coleção.
- Novo botão "🪄 Gerar coleção com texto da Mentora Gi" no painel da Coleção faz o mesmo de forma direta para quem já está editando.
- Color pickers de fundo, título, corpo, destaque funcionam normalmente em qualquer slide journal — sem reset automático nem locks.

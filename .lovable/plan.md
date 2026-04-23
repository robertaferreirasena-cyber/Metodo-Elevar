

# Plano: Validação, exportação, variações de paleta, mobile-safe + Banco de Imagens (Unsplash/Pexels)

Vou implementar **6 melhorias** no Gerador de Carrossel + adicionar uma **biblioteca de imagens grátis** (estilo Canva) integrada ao editor.

> ⚠️ **Nota sobre os "novos modelos que eu acabei de enviar"**: nesta mensagem não chegaram imagens novas. Vou tratar isso como pendência — assim que você enviar as referências em uma próxima mensagem, eu rendero como novos templates. Confirme isso ou anexe as imagens.

---

## 1. Validação de imagem nos layouts que dependem de foto

**Arquivo:** `src/components/carousel/SlidePreview.tsx`

Nos layouts `journal-photo-card` e `journal-torn-paper`, quando `imageUrl`/`bgImageUrl` estiverem vazios:
- Renderizar **placeholder visual elegante** (gradiente em tons da paleta + ícone `ImagePlus` + texto "Adicione uma foto neste slide").
- Sem foto, o layout ainda fica visualmente coeso (não quebra).

Adicionar também badge sutil no editor ("Foto recomendada") quando esses layouts forem selecionados sem imagem.

## 2. Exportar prévia ZIP/PNG da Coleção Journaling

**Arquivo:** `src/components/carousel/CarouselEditor.tsx` (+ helper)

Botão novo no painel de templates Journaling: **"📥 Exportar prévia da coleção"**.

Fluxo:
1. Renderiza off-screen 6 slides (1 por variante) usando título e corpo de exemplo:
   - Título: *"Como dobrar seu faturamento sem dobrar a jornada"*
   - Corpo: *"Três pilares que aplicamos com nossas mentoradas para escalar com leveza."*
2. Captura cada um via `html-to-image` em 1080×1080.
3. Empacota com `jszip` em `colecao-journaling-{variacao}.zip` contendo 6 PNGs.
4. Opção secundária: "Baixar mosaico único" (3×2 grid em 1 PNG 3240×2160).

## 3. Variação de paleta (1 clique gera estilos)

**Arquivos:** `CarouselTemplates.ts` + `CarouselEditor.tsx`

Adicionar constante `JOURNAL_PALETTES` com 5 variações harmônicas (mantém layout/textura, troca apenas `bgColor`, `accentColor`, `textColor` e cor de fita/selo):

| Paleta | Fundo | Accent | Selo |
|---|---|---|---|
| Terracota (atual) | `#a23e2e` | `#f0e6d2` | `#d4a574` |
| Sálvia | `#7a8b6a` | `#f5ede0` | `#c9a35a` |
| Borgonha | `#5a1f1f` | `#e8d4b0` | `#d4a574` |
| Marinho | `#1f3a5a` | `#f0ebe0` | `#c9965a` |
| Pêssego Nude | `#e8a87c` | `#3a1a12` | `#7a1f15` |

UI: novo painel com 5 chips coloridos circulares + botão "🎲 Aleatório". Clicar aplica a paleta a todos os slides Journaling preservando layout, textos, fotos e ajustes.

Persiste a paleta atual no `useSessionPersistence`.

## 4. Safe-area + escalonamento automático em 9:16

**Arquivos:** `SlidePreview.tsx` + helper novo `journalScaleHelpers.ts`

Quando `aspectRatio === "9:16"`:
- Multiplicar `padPx` por 1.4 (mais respiração nas bordas).
- Reservar 8% do topo e 8% da base como **safe-area** (zonas onde o Instagram sobrepõe UI no Stories).
- Auto-escalar `titleSize` e `bodySize` quando o texto exceder altura útil:
  ```ts
  const measureAndScale = (textLength, baseSize, maxHeight) => 
    textLength > 120 ? baseSize * 0.85 : baseSize;
  ```
- Decorações SVG (fita, espiral, envelope) reposicionadas para ficarem dentro da safe-area.
- Aplicar regra a **todos os 6 layouts journaling** + adicionar testes visuais via export PNG.

## 5. Banco de Imagens grátis integrado (Unsplash + Pexels)

**Novo componente:** `src/components/carousel/ImageLibraryPicker.tsx`
**Nova Edge Function:** `supabase/functions/image-library-search/index.ts`

Recursos disponíveis (gratuitos, sem custo para o usuário):
- **Unsplash API** (50 req/h grátis) — fotos profissionais
- **Pexels API** (200 req/h grátis) — fotos + vídeos
- **Pixabay API** (opcional) — ilustrações

**UX:**
1. Em todos os pontos onde há "Upload de imagem" (slide, fundo, grid), adicionar tab **"🖼 Banco de imagens"** ao lado de "Upload" e "URL".
2. Modal com:
   - Busca por palavra-chave (ex: "café", "yoga", "produto")
   - Filtros: Orientação (quadrada/vertical/horizontal), Cor dominante
   - Sugestões automáticas baseadas no tema do carrossel + nicho da Persona
   - Grid infinito com lazy-load
   - Atribuição automática (footer discreto: "Foto: {autor} via Unsplash")
3. Ao selecionar: imagem é baixada via Edge Function (proxy CORS), convertida em data URL e atribuída ao slide.

**Edge Function `image-library-search`:**
- JWT-auth
- Aceita: `{ query, orientation?, page?, source?: "unsplash"|"pexels" }`
- Retorna: `{ images: [{ url, thumbUrl, author, sourceUrl, source }] }`
- Cache simples em memória por query (5 min) para reduzir chamadas
- Tratamento 429 → fallback para outra fonte automaticamente

**Secrets necessários:**
- `UNSPLASH_ACCESS_KEY` — você cria grátis em https://unsplash.com/developers
- `PEXELS_API_KEY` — grátis em https://www.pexels.com/api/

> Eu vou solicitar essas chaves quando começar a implementação.

## 6. Render de novos modelos enviados pelo usuário

Como **as imagens não chegaram nesta mensagem**, deixarei isso como passo final. Após você reenviar:
- Analiso cada modelo (estrutura, paleta, tipografia, decorações)
- Adiciono novos `CarouselLayout` + entradas no catálogo
- Renderizo blocos no `SlidePreview.tsx`
- Integro à seção Journaling (ou cria nova coleção, se forem outro estilo)

---

## Arquivos tocados

**Novos:**
- `src/components/carousel/ImageLibraryPicker.tsx` — modal de busca de fotos
- `src/components/carousel/journalScaleHelpers.ts` — auto-scale 9:16
- `supabase/functions/image-library-search/index.ts` — proxy para Unsplash/Pexels

**Editados:**
- `src/components/carousel/CarouselTemplates.ts` — `JOURNAL_PALETTES`, helper `applyJournalPalette`
- `src/components/carousel/CarouselEditor.tsx` — botões de exportar coleção, swatches de paleta, integração ImageLibraryPicker
- `src/components/carousel/SlidePreview.tsx` — fallbacks em layouts photo, safe-area 9:16
- `src/hooks/useSessionPersistence.ts` — não muda; nova chave dentro do estado existente

## Resultado esperado

- Layouts com foto nunca quebram (placeholder elegante).
- 1 clique exporta ZIP com 6 PNGs da coleção Journaling.
- 5 paletas + aleatório dão variações infinitas mantendo identidade.
- Stories 9:16 sempre cabem texto no export PNG, sem cortes.
- Usuário tem milhares de fotos profissionais grátis dentro do app, igual Canva, com busca, sugestões automáticas e atribuição correta.
- Pronto para receber suas novas referências e adicioná-las como templates.


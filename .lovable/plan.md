
# Plano: Cache em localStorage + seção dedicada "Coleção Journaling" no painel de templates

Dois ajustes pontuais e independentes.

## 1. Cache do "Banco de imagens" também em localStorage

**Arquivo:** `src/components/carousel/ImageLibraryPicker.tsx`

Hoje o cache vive só em `sessionStorage` (some quando o navegador fecha). Vou espelhar tudo em `localStorage` mantendo o mesmo TTL (10 min) e o mesmo limite (30 entradas).

Mudanças nas funções `getCached`, `setCached`, `pruneCache`:
- **`getCached`**: tenta `sessionStorage` primeiro (mais rápido). Se miss, lê de `localStorage`. Se hit em `localStorage` ainda válido, re-popula `sessionStorage` (warm) e retorna.
- **`setCached`**: grava nos DOIS storages em paralelo, com o mesmo `{ ts, images }`.
- **`pruneCache`**: roda em ambos os storages (mesma lógica de TTL e LRU por timestamp). 30 entradas em cada.
- Se `localStorage` lançar `QuotaExceededError` (cota cheia), faz `pruneCache` agressivo e retenta uma vez; se ainda falhar, ignora silenciosamente sem quebrar a busca.
- Versão da chave continua `img_lib_cache_v1::` para invalidar caches antigos quando precisar.

Resultado: usuária fecha o navegador, abre amanhã, busca "café" de novo → retorno instantâneo do cache local (se < 10 min) ou nova busca (se TTL expirou).

## 2. Seção destacada "Coleção Journaling" no topo do painel de templates

**Arquivo:** `src/components/carousel/CarouselEditor.tsx`

**Problema real:** os 6 templates Journaling existem no código (`journal-cream`, `journal-rust`, `journal-olive`, `journal-copper`, `journal-forest`, `journal-binder`) e renderizam corretamente, mas estão **enterrados no fim de uma lista de ~32 templates**, sem agrupamento visual. Quem abre o painel não os encontra com facilidade.

**Solução:** adicionar uma faixa dedicada **logo acima** do grid `filteredTemplates`, sempre visível quando `formatFilter === "all"` ou `"1:1"`:

```text
┌─ ✨ Coleção Journaling (6 layouts narrativos) ────┐
│ [Rust] [Cream] [Olive] [Espiral] [Forest] [Copper]│
│   Mini-previews 110×110 reais (SlidePreview)      │
└───────────────────────────────────────────────────┘
```

Detalhes:
- Renderizar os 6 cards em grid `grid-cols-3 md:grid-cols-6`, cada um com mini-preview real (mesmo padrão usado em `TemplatePreviewTooltip`: `SlidePreview` em 1080×1080 escalado para ~110px).
- Hover no card mostra o tooltip atual (`TemplatePreviewTooltip`); clique aplica o template usando o `templateApplyMode` ativo (mesma lógica de `applyTemplateToAll` / `applyTemplatePreservingFormatting` / `applyTemplateToSlide` que já roda no grid principal).
- Card selecionado ganha `ring-2 ring-primary/30` igual aos outros.
- Container com fundo âmbar suave (`bg-amber-50/30`) e borda âmbar para diferenciar visualmente da grade geral.
- A seção continua aparecendo no grid grande `filteredTemplates` (não duplica esforço — só adiciona um atalho). Para evitar duplicação visual, **filtra os journals fora do grid principal** quando a seção dedicada está visível: `filteredTemplates.filter(t => !isJournalTemplate(t.id))`.
- Quando `formatFilter === "9:16"` ou `"16:9"`, a seção dedicada não aparece (journals são todos 1:1) e o filtro do grid principal volta ao normal.

## Critérios de aceitação

- Fechar o navegador, reabrir, buscar a mesma palavra antes de 10 min → resultados instantâneos sem chamada de rede (verificável no DevTools/Network).
- Ao abrir o Gerador de Carrossel com filtro "Todos" ou "1:1", a seção "✨ Coleção Journaling" aparece no topo do painel de templates com 6 mini-previews visíveis e clicáveis.
- Clicar em qualquer card da Coleção aplica o template seguindo o modo selecionado (Aplicar a todos / Slide atual / Preservar ajustes), idêntico ao grid principal.
- Os 6 templates Journaling somem do grid principal apenas quando aparecem na seção dedicada (sem duplicação na mesma tela).

## Arquivos editados
- `src/components/carousel/ImageLibraryPicker.tsx`
- `src/components/carousel/CarouselEditor.tsx`

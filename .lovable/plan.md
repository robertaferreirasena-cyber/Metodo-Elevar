

## Plano: Adicionar 3 Novos Templates de Carrossel

### Arquivo: `src/components/carousel/CarouselTemplates.ts`

Adicionar 3 novos templates ao array `CAROUSEL_TEMPLATES`:

| Template | Estilo | Cores | Aspect |
|---|---|---|---|
| **Depoimentos** | Fundo escuro elegante com aspas decorativas, tom pessoal e confiável | `#1B1B2F` fundo, `#E2E8F0` texto, `#F59E0B` destaque (dourado) | 1:1 |
| **Antes/Depois** | Gradiente verde→azul, layout contrastante para transformação | `#065F46` fundo, `#FFFFFF` texto, `#34D399` destaque (verde claro) | 1:1 |
| **Lista de Benefícios** | Fundo azul profundo com accent amarelo, estilo checklist | `#1E3A5F` fundo, `#FFFFFF` texto, `#FBBF24` destaque (amarelo) | 1:1 |

### Arquivo: `src/components/carousel/SlidePreview.tsx`

Adicionar tratamento visual especial para os novos templates baseado no `accentColor` e estilo — por exemplo, aspas decorativas para o template de depoimentos (detectado pelo accent dourado ou via prop adicional). Os elementos decorativos já existentes no SlidePreview serão suficientes para os templates Antes/Depois e Benefícios, que seguem a mesma estrutura título+corpo.

### Resumo de Mudanças

- **1 arquivo editado**: `CarouselTemplates.ts` — adicionar 3 objetos ao array
- Nenhum arquivo novo necessário — os templates usam a mesma interface `CarouselTemplate` já existente


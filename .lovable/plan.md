

## Plano: Editor Completo de Carrossel + Geração Unificada via Mentora Gi

### Problema Atual
1. O editor de slides tem controles limitados — sem formatação de texto (negrito, itálico), sem efeitos, sem upload de imagem de fundo para todos os layouts
2. A geração de copy usa uma edge function separada (`carousel-generator`), gastando uma chamada de API extra. O sistema da Mentora Gi (`ai-mentor-chat`) já existe e pode gerar as copies diretamente com tool calling

### Solução

#### 1. Editor Completo de Formatação

Adicionar ao painel de edição do slide:

- **Formatação de texto**: Negrito, itálico, sublinhado no título e corpo (armazenado como propriedades `titleBold`, `titleItalic`, `bodyBold`, `bodyItalic`, `bodyUnderline` no SlideData)
- **Cor do título separada**: Seletor de cor independente para título vs corpo
- **Efeitos de texto**: Sombra no texto (`textShadow`) e opacidade do corpo
- **Imagem de fundo universal**: Upload de imagem de fundo disponível para TODOS os layouts (não apenas image-bg/editorial), com overlay configurável
- **Imagem no slide**: Upload de imagem decorativa que aparece junto ao texto em qualquer layout

Arquivos modificados:
- `src/components/carousel/CarouselTemplates.ts` — Adicionar campos: `titleBold`, `titleItalic`, `bodyBold`, `bodyItalic`, `bodyUnderline`, `titleColor`, `textShadow`, `overlayOpacity`, `bgImageUrl`
- `src/components/carousel/SlidePreview.tsx` — Renderizar formatação (font-weight, font-style, text-decoration, text-shadow) e imagem de fundo universal com overlay
- `src/components/carousel/CarouselEditor.tsx` — Adicionar controles de formatação, upload de imagem de fundo para todos os layouts, seletor de efeitos

#### 2. Geração Unificada via Mentora Gi

Modificar o `carousel-generator` para reutilizar o prompt da Mentora Gi (persona copywriter) internamente com tool calling, em vez de ter um prompt separado. O sistema já usa o mesmo gateway e modelo.

Mudança na prática:
- O `carousel-generator` já tem o prompt da Mentora Gi embutido (foi atualizado na iteração anterior). O que falta é **eliminar a chamada dupla** no frontend — quando o usuário usa o mini-chat da Gi para melhorar copies E depois gera novamente
- Solução: O botão "Gerar Carrossel" passará a chamar `ai-mentor-chat` com persona `copywriter` + um prompt estruturado que pede a resposta em formato JSON de slides, eliminando a necessidade do `carousel-generator` como function separada
- Parsing do JSON no frontend a partir da resposta streamed da Gi

Arquivos modificados:
- `src/components/carousel/CarouselEditor.tsx` — Substituir chamada ao `carousel-generator` por chamada ao `ai-mentor-chat` com persona `copywriter` e parsing de JSON da resposta

### Detalhes Técnicos

**Novos campos no SlideData:**
```typescript
titleBold?: boolean;
titleItalic?: boolean;
bodyBold?: boolean;
bodyItalic?: boolean;
bodyUnderline?: boolean;
titleColor?: string; // cor separada do título
textShadow?: string;
overlayOpacity?: number; // 0-1 para overlay sobre imagem de fundo
bgImageUrl?: string; // imagem de fundo universal (todos layouts)
```

**Geração via ai-mentor-chat:**
O prompt enviará instruções para retornar JSON no formato:
```
Retorne APENAS um JSON: {"slides": [{"title": "...", "body": "..."}]}
```
O frontend fará parsing do JSON da resposta streamed completa.

### Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/components/carousel/CarouselTemplates.ts` | Adicionar campos de formatação ao SlideData |
| `src/components/carousel/SlidePreview.tsx` | Renderizar formatação, efeitos, imagem de fundo universal |
| `src/components/carousel/CarouselEditor.tsx` | Editor completo + geração via ai-mentor-chat |


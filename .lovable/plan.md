

## Plano: Gerador de Carrossel Visual Completo

### Visão Geral

Transformar o atual "Criador de Carrossel" (que hoje só gera texto placeholder) em um gerador completo com:
- IA gerando o conteúdo real dos slides via edge function
- Preview visual editável de cada slide (estilo Instagram/Twitter)
- Editor inline: cor de fundo, cor de fonte, tamanho de texto, template
- Templates virais pré-configurados
- Exportação dos slides como imagens

### Parte 1: Templates Virais Pré-configurados

Definir 5-6 templates com estilos visuais distintos:

| Template | Estilo | Cores |
|---|---|---|
| Twitter Thread | Fundo escuro, texto branco, avatar no topo | `#15202B` / `#FFFFFF` |
| Instagram Educativo | Gradiente colorido, texto bold centralizado | Gradientes rosa/roxo |
| Instagram Minimalista | Fundo claro, tipografia limpa | `#FAFAFA` / `#1A1A1A` |
| Carrossel Bold | Cores vibrantes alternadas, texto grande | Paleta vibrante |
| Storytelling | Fundo escuro com accent color, narrativo | `#0A0A0A` / accent |
| Dicas Rápidas | Cards com ícone + texto curto, numerados | Branco + cor primária |

Cada template define: `bgColor`, `textColor`, `accentColor`, `fontFamily`, `fontSize`, `layout` (posição do texto, alinhamento).

### Parte 2: Geração de Conteúdo via IA

Chamar a edge function `sales-strategist` (já existente) com um prompt especializado que instrui a IA a retornar um JSON com array de slides, cada um com `title` e `body`. O prompt incluirá o tema do usuário, quantidade de slides, tom de voz e formato (Twitter/Instagram).

Alternativa: criar uma nova chamada direta à API de IA dentro do próprio componente, usando o mesmo endpoint gateway (`ai.gateway.lovable.dev`), mas com system prompt dedicado a carrosséis virais.

### Parte 3: Editor Visual de Slides

Novo componente `CarouselEditor` com:

1. **Preview dos slides** — renderizados como divs estilizadas (aspect-ratio 1:1 para Instagram, 16:9 para Twitter) com o conteúdo gerado
2. **Navegação entre slides** — setas ou thumbnails laterais
3. **Barra de edição por slide**:
   - Input de cor de fundo (color picker)
   - Input de cor de texto (color picker)
   - Slider de tamanho de fonte (14px–48px)
   - Textarea para editar o texto do slide diretamente
   - Seletor de alinhamento (esquerda/centro)
4. **Barra de edição global**:
   - Trocar template (aplica estilo a todos os slides)
   - Aplicar cor a todos os slides de uma vez
5. **Exportação**: Botão para baixar cada slide como imagem usando `html-to-image` ou canvas API

### Parte 4: Integração no Fluxo

- Substituir o `CarouselCreator` atual em `LearningModules.tsx` pelo novo componente completo
- Manter o fluxo: tema → selecionar template → gerar → editar → exportar
- Adicionar seletor de formato (Instagram 1:1, Twitter 16:9) antes da geração

### Arquivos a criar/editar

| Arquivo | Ação |
|---|---|
| `src/components/carousel/CarouselEditor.tsx` | Novo — editor visual de slides com preview e controles |
| `src/components/carousel/CarouselTemplates.ts` | Novo — definição dos templates virais (cores, fontes, layouts) |
| `src/components/carousel/SlidePreview.tsx` | Novo — componente de preview individual do slide |
| `src/pages/LearningModules.tsx` | Substituir `CarouselCreator` pelo novo editor completo |

### Detalhes Técnicos

- **Renderização dos slides**: Divs com `aspect-ratio: 1/1`, styled inline com as propriedades do template selecionado, contendo título + corpo
- **Geração de conteúdo**: POST para `sales-strategist` com mensagem especial tipo "Gere um carrossel de X slides sobre [tema] no formato JSON: [{title, body}]" — reusa a infraestrutura existente sem criar nova edge function
- **Exportação de imagem**: Usar `html-to-image` (toPng) para capturar cada slide div como PNG baixável
- **Estado**: Array de objetos `{title, body, bgColor, textColor, fontSize, fontFamily}` — cada slide editável independentemente
- **Dependência nova**: `html-to-image` para exportação dos slides como imagens


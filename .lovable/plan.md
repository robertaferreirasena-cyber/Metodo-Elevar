

## Plano: Corrigir dimensões Instagram e troca dinâmica de formato/template

### Problemas atuais

1. **Dimensões incorretas**: O preview usa `maxWidth` arbitrários (480px para feed, 320px para stories). O Instagram exige **1080×1080** (feed) e **1080×1920** (stories). Na exportação PNG, o tamanho final fica errado.
2. **Trocar formato exige regenerar**: Se o usuário gerou em Feed e quer mudar para Stories, precisa gerar tudo de novo.
3. **Trocar template perde contexto de formato**: O `applyTemplateToAll` já preserva conteúdo, mas não permite trocar o `aspectRatio` independente do template.

### Solução

#### 1. Dimensões reais do Instagram no SlidePreview

Definir constantes de resolução real e usar escala (`transform: scale`) para caber no container:

| Formato | Resolução real | Aspecto |
|---------|---------------|---------|
| Feed 1:1 | 1080×1080 | 1/1 |
| Stories 9:16 | 1080×1920 | 9/16 |
| Wide 16:9 | 1920×1080 | 16/9 |

O slide renderiza na resolução real e escala para caber. A exportação PNG captura na resolução real (alta qualidade).

**Arquivo: `SlidePreview.tsx`**
- Renderizar o slide em dimensões fixas (ex: 1080×1080 para feed)
- Usar `transform: scale()` calculado pelo container para preview
- Ajustar `titleSize` e `bodySize` proporcionalmente ao formato (ex: stories precisa de fontes maiores para compensar o espaço vertical)

#### 2. Botões de formato ao vivo (sem regenerar)

**Arquivo: `CarouselEditor.tsx`**
- Adicionar botões "Feed 1:1" / "Stories 9:16" / "Wide 16:9" **na área do editor** (após geração), não apenas no filtro de templates
- Ao clicar, muda o `aspectRatio` de todos os slides existentes sem perder conteúdo
- Ajusta `titleSize`/`bodySize` automaticamente para o novo formato (feed usa 32/20, stories usa 38/22, wide usa 28/18)
- O `selectedTemplate` atualiza seu `aspectRatio` mas mantém cores, fontes e layout

#### 3. Troca de template preservando conteúdo

**Arquivo: `CarouselEditor.tsx`**
- O `applyTemplateToAll` já preserva `title` e `body` — funciona
- Remover a restrição do filtro de formato no seletor de templates pós-geração (mostrar todos os templates disponíveis)
- Ao trocar template com aspectRatio diferente, aplicar ajuste automático de font sizes

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `SlidePreview.tsx` | Renderizar em dimensões reais com escala; receber prop de resolução |
| `CarouselEditor.tsx` | Botões de formato ao vivo no editor; ajuste automático de fonts ao trocar formato/template; exportação em resolução real |
| `CarouselTemplates.ts` | Adicionar constantes de resolução por formato |

### Resultado esperado

- Preview mostra slides nas proporções exatas do Instagram
- Exportação PNG sai em 1080×1080 (feed) ou 1080×1920 (stories)
- Usuário troca formato com 1 clique, sem regenerar
- Usuário troca template e o conteúdo se adapta automaticamente


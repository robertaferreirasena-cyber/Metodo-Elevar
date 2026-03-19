

## Plano: Persistência de Sessão em Todo o App

### Situação Atual

6 páginas já têm persistência. 5 páginas com conteúdo gerado **perdem tudo** ao navegar:

| Página | Tipo de Estado | Risco de Perda |
|---|---|---|
| `Index.tsx` | Chat (useChat) | Médio — já usa useChat mas não mostra SessionIndicator |
| `ManyChatFlows.tsx` | Formulário + resultado gerado | Alto |
| `TrafficAds.tsx` | Formulário + resultado gerado | Alto |
| `PriceCalculator.tsx` | Formulário complexo + dados financeiros | Alto |
| `CarouselEditor.tsx` | Slides + tema + template | Alto |

Páginas como `MentorChat`, `SalesGoals` e `InstaProGenerator` já salvam no banco de dados — não precisam de sessão local.

### Implementação

#### 1. Index.tsx
- Adicionar `hasRestoredSession` na desestruturação do `useChat()`
- Adicionar `SessionIndicator` no topo da área de chat

#### 2. ManyChatFlows.tsx
- Usar `useSessionPersistence` para salvar o state do formulário (`flowType`, `product`, `audience`, `objective`, `tone`, `keyword`, `steps`) e o `result` gerado
- Adicionar `SessionIndicator` na aba "create"

#### 3. TrafficAds.tsx
- Mesmo padrão: `useSessionPersistence` para formulário (`platform`, `objective`, `product`, `audience`, `budget`, `tone`) e `result`
- Adicionar `SessionIndicator`

#### 4. PriceCalculator.tsx
- Usar `useSessionPersistence` para salvar os arrays de custos fixos, variáveis, produtos e serviços (as principais entradas do usuário)
- Adicionar `SessionIndicator` no topo

#### 5. CarouselEditor.tsx
- Usar `useSessionPersistence` para salvar `slides`, `topic`, `selectedTemplate`, `format`
- Adicionar `SessionIndicator` no editor

### Padrão Comum

Cada página receberá:
1. Import de `useSessionPersistence` e `SessionIndicator`
2. State inicial extraído do sessionStorage via hook
3. Banner discreto "Sessão anterior restaurada" com botão de limpar
4. Debounce de 500ms para não sobrecarregar o storage

### Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/pages/Index.tsx` | Adicionar SessionIndicator + hasRestoredSession |
| `src/pages/ManyChatFlows.tsx` | useSessionPersistence para form + result |
| `src/pages/TrafficAds.tsx` | useSessionPersistence para form + result |
| `src/pages/PriceCalculator.tsx` | useSessionPersistence para dados financeiros |
| `src/components/carousel/CarouselEditor.tsx` | useSessionPersistence para slides |


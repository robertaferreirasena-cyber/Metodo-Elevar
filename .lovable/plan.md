

## Plano: Simulador Completo do Gerenciador de Anúncios (Padrão Meta Ads 2026)

### Problemas Identificados

O simulador atual está simplificado demais em relação ao gerenciador real:
1. **Anúncios**: Não mostram formato do criativo, descrição, briefing visual, roteiro — apenas nome e headline
2. **Público**: Mostra apenas uma descrição resumida — faltam campos detalhados (interesses, localizações, faixa etária, gênero, Advantage+)
3. **Posicionamentos**: Só badges genéricos — sem detalhamento por plataforma/dispositivo
4. **Copiar para Meta Ads**: Nenhuma funcionalidade de copiar campo individual
5. **Edge Function**: Não gera campos suficientes no JSON (falta `detailed_targeting`, `custom_audiences`, `optimization_goal`)

### O que será feito

#### 1. Expandir a estrutura JSON da Edge Function

Adicionar ao prompt e schema da `ad-structure-generator`:
- `audience.detailed_targeting` (interesses, comportamentos, dados demográficos — como no Meta Ads 2026)
- `audience.custom_audiences` (sugestões de públicos personalizados/lookalike)
- `audience.advantage_plus` (flag indicando se recomenda Advantage+ Audience)
- `ads[].creative_format_label` (ex: "Vídeo Vertical 9:16", "Imagem Estática 1080x1080", "Carrossel 3 cards")
- `ads[].creative_description` (descrição detalhada do criativo)
- `ads[].recommended_dimensions` (dimensões recomendadas)
- `optimization_goal` no ad_set (ex: "Conversões", "Cliques no link", "Alcance")

#### 2. Redesenhar o Simulador com cards detalhados

Substituir a tabela simplificada por um layout com cards expandíveis que replica a experiência do Meta Ads Manager 2026:

**Card do Conjunto de Anúncios** mostrará:
- Público detalhado com todos os campos (gênero, idade, localização, interesses, comportamentos)
- Posicionamentos detalhados com ícones
- Objetivo de otimização
- Orçamento e programação
- Botão "Copiar Configuração" para cada seção

**Card do Anúncio** mostrará:
- Formato do criativo com badge visual (🎬 Vídeo, 🖼 Imagem, 📱 Carrossel)
- Dimensões recomendadas
- Texto principal completo (com botão copiar)
- Headline (com botão copiar)
- Descrição (com botão copiar)
- CTA
- Briefing visual / Roteiro de vídeo
- Preview lado a lado

#### 3. Botões "Copiar" em cada campo

Cada campo importante terá um ícone de copiar ao lado para o usuário copiar direto para colar no Meta Ads:
- Headline, Texto principal, Descrição, CTA, Interesses, Localizações

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/components/traffic/AdManagerSimulator.tsx` | Redesenhar com cards detalhados, seções expandíveis para público/criativo/posicionamento, botões copiar por campo |
| `src/components/traffic/AdPreviewMock.tsx` | Adicionar informações do criativo (formato, dimensões) ao preview |
| `supabase/functions/ad-structure-generator/index.ts` | Expandir prompt e schema com campos detalhados (detailed_targeting, creative_format_label, optimization_goal, etc.) |

### Detalhes Técnicos

**Edge Function** — O prompt será atualizado para gerar campos adicionais no JSON:

```typescript
// Novos campos no audience
"detailed_targeting": {
  "interests": ["Empreendedorismo", "Marketing Digital"],
  "behaviors": ["Compradores online frequentes"],
  "demographics": ["Proprietários de pequenos negócios"]
},
"custom_audiences": ["Lookalike 1% - Compradores", "Visitantes do site 30 dias"],
"advantage_plus": true,
"optimization_goal": "Conversões"

// Novos campos no ad
"creative_format_label": "Vídeo Vertical 9:16",
"creative_description": "Vídeo com storytelling emocional mostrando a transformação...",
"recommended_dimensions": "1080x1920px"
```

**Simulador** — Cada conjunto de anúncios terá seções colapsáveis:
- 📊 **Configuração** (objetivo de otimização, orçamento, programação)
- 👥 **Público-alvo** (gênero, idade, localização, interesses detalhados, Advantage+)
- 📍 **Posicionamentos** (lista visual por plataforma)
- 📄 **Anúncios** (cards com formato, textos completos, preview)

Cada texto copiável terá helper `copyToClipboard(text, label)` que copia e mostra toast.


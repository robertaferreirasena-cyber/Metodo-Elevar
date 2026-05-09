
## Objetivo

Três melhorias coordenadas em `src/pages/PriceCalculator.tsx` e na edge function `catalog-price-analyzer`:

1. **Importação resiliente de catálogo** — extrair todos os produtos mesmo com dados faltando, preencher defaults inteligentes e organizar dentro da Calculadora de Produtos.
2. **Custos fixos do Mapa Financeiro nos dois modos do Produto** (Revendo / Eu produzo), com mesma UX da Calculadora de Serviços.
3. **Persistência completa das 5 etapas** (incluindo passo ativo) tanto em Produtos quanto em Serviços.

---

## 1. Importação tolerante de catálogos incompletos

### Edge function `catalog-price-analyzer`
- Reforçar prompt: instruir a IA a **sempre retornar todos os produtos detectados**, mesmo quando faltarem preço, custo, frete ou margem. Para campos faltantes deve devolver `null` em vez de pular o produto.
- Garantir `cost_source: "estimated"` quando a IA não encontrar custo no documento (já existe parcialmente).
- Aumentar tolerância no parser: se algum produto vier com campos ausentes mas tiver `name`, mantém na lista.

### Front (`productFromDetected` em `PriceCalculator.tsx`)
Hoje só preenche frete/embalagem com fallback. Expandir para defaults inteligentes em todos os campos quando faltarem:

| Campo faltando | Default aplicado |
|---|---|
| `estimated_cost` | 50% do `detected_price` (margem padrão de revenda) |
| `suggested_price`/`detected_price` | `cost * 2` (markup 100%) ou 0 se nada |
| `freight_estimate` | já tem fallback (5% do preço, mín R$2) |
| `packaging_estimate` | já tem fallback (R$2) |
| `expected_monthly_units` | 10 |
| `margin_percent` | 30 |
| `category` → tipo | infere lojista/produtor (já existe) |

- Adicionar flag visual (badge "estimado") por produto quando algum campo veio de fallback, para o usuário saber o que revisar.
- Acumular contagem de "campos preenchidos automaticamente" e mostrar toast: *"X produtos importados. Revise os campos marcados como estimados."*

### Resultado
O usuário pode importar qualquer catálogo (mesmo só com nomes e preços) e o sistema cria os cards prontos para edição, sem travar a importação por dados faltantes.

---

## 2. Custos fixos do Mapa nos dois modos do Produto

A Calculadora de Produtos **já recebe** `mapFixedCosts` e tem botão "Importar do Mapa", mas:
- O auto-preenchimento ocorre apenas se `monthlyFixedCosts === 0`.
- Não há paridade visual com Serviços (que tem switch *"Usar Mapa Financeiro"*, badge "Sincronizado" e desativa edição manual).

### Mudanças
- Replicar a UX da Calculadora de Serviços na seção de custos fixos do Produto:
  - Switch **"Usar Mapa Financeiro"** que vincula `monthlyFixedCosts` ao valor atual de `mapFixedCosts` em tempo real.
  - Badge mostrando o valor sincronizado e link para Mapa Financeiro caso esteja vazio.
  - Quando ligado, campo manual fica desabilitado.
- Aplicar o rateio de fixos por produto **independente do `businessType`** (lojista/produtor) — a lógica atual já é unificada (`productResults` usa `monthlyFixedCosts` para todos), só precisamos garantir que o rateio aparece no breakdown de custos de produtor também.
- Persistir `fixedCostsFromMap` no sessionStorage (já está em `session_product_calc_v2`).

---

## 3. Persistência completa das 5 etapas

### Estado atual
- `session_service_calc_v3` salva valores dos serviços, mas **não salva** o accordion ativo (passo atual do wizard).
- `session_product_calc_v2` salva produtos, mas **não salva** quais cards estão expandidos nem o passo do wizard interno.

### Mudanças
- Adicionar ao `ServiceSessionState`: `activeStep: string` (ex.: `"step-1"`).
- Adicionar ao `ProductCalcSessionState`: `openItems: string[]` (cards expandidos) e, se houver wizard interno por produto, o passo ativo.
- Atualizar os `useEffect` de sincronização para incluir esses campos.
- Garantir restauração: ao voltar à página, abrir exatamente o passo/card onde o usuário parou.
- Persistência via `useSessionPersistence` com debounce 500ms (já é o padrão).

---

## Arquivos afetados

- `supabase/functions/catalog-price-analyzer/index.ts` — prompt mais tolerante, validação leniente.
- `src/pages/PriceCalculator.tsx`:
  - `productFromDetected`: defaults expandidos + flag de estimativa.
  - `ProductCalculator`: switch "Usar Mapa Financeiro" + persistência de `openItems`.
  - `ServiceCalculator`: persistência do `activeStep`.
  - Tipos `ProductCalcSessionState` e `ServiceSessionState`: novos campos.
- `src/components/catalog/CatalogAnalysisResult.tsx`: badge "estimado" por campo (opcional, leve).

## Notas

- Sem migrations de banco; tudo é cliente + edge function.
- Mantém compatibilidade com sessions v2/v3 existentes (campos novos opcionais com defaults).

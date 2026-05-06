
# Plano: Calculadora Financeira — multi-itens, modo serviço flexível e importação de catálogo organizada

Reformulação da calculadora em `src/pages/PriceCalculator.tsx` para suportar múltiplos produtos, múltiplos serviços (incluindo prestadoras como esteticistas/cabeleireiras), e tornar a importação por catálogo (IA) usável de verdade — com PDF, todos os formatos, importação em lote, dados reais (frete incluso) e cálculo de break-even por produto.

---

## 1. Aba "Produto" → Catálogo de Produtos (multi-produto)

Hoje a aba calcula **um único produto por vez**. Vou trocar por uma lista de produtos cadastrados, com cálculo individual e visão consolidada.

### Estrutura
- Novo tipo `ProductRow`:
  ```ts
  { id, name, businessType: 'lojista'|'produtor',
    purchaseCost, freightPerUnit, extraPackaging,
    directCosts: CostItem[],     // só produtor
    quantityPerMonth, desiredMargin, taxPercent }
  ```
- Estado `products: ProductRow[]` persistido em sessionStorage (mesma chave migrada com fallback).
- Custos fixos mensais e rateio passam a ser **globais** (uma seção única no topo), com import do Mapa Financeiro como hoje.

### UI
- Lista colapsável de produtos (Accordion):
  - Cabeçalho mostra: nome • preço sugerido • margem real • un. p/ break-even.
  - Conteúdo expandido = formulário atual de um produto (sem tipo de negócio repetido para cada — fica por linha).
- Botões: **+ Adicionar produto**, **Duplicar**, **Remover**.
- Card consolidado no fim:
  - Faturamento mensal somado (todos os produtos)
  - Lucro mensal somado
  - Margem média ponderada
  - Quanto cada produto contribui (% do faturamento) — gráfico de pizza pequeno (recharts já está no arquivo)

### Break-even por produto (rateio justo)
Hoje o break-even assume "um produto carrega todos os custos fixos". Vou trocar por:
- Rateio dos custos fixos proporcional ao **faturamento esperado** de cada produto.
- Cada linha mostra: "Para cobrir sua parte dos custos fixos (R$ X), você precisa vender **N unidades/mês**".
- Card adicional global: "Para cobrir 100% dos custos fixos com este mix, faturamento mínimo = R$ Y".

---

## 2. Aba "Serviço" → multi-serviço com modelo "preço por serviço"

Hoje só aceita modelo horas × R$/hora (psicólogo, consultor). Vou adicionar segundo modo para esteticista/cabeleireira/manicure/etc.

### Modos por serviço (radio na linha)
- **Por hora**: `hoursPerMonth × hourlyRate` (atual)
- **Por atendimento**: `pricePerSession × sessionsPerMonth` (NOVO — padrão p/ esteticista, cabeleireira, manicure, massagista)

### Campos novos no `ServiceItem`
```ts
{ id, name, mode: 'hourly'|'session',
  // hourly:
  hoursPerMonth, hourlyRate,
  // session:
  pricePerSession, sessionsPerMonth, durationMinutes,
  // ambos:
  materialCostPerUnit,   // produto usado por atendimento (esmalte, cera, tintura...)
  fixedCosts }
```

### Cálculo
- Receita do serviço = (modo hora) horas × R$/h **ou** (modo sessão) preço × sessões.
- Custo do serviço = materiais × qtd + fixos da linha.
- Mantém pró-labore + margem + impostos globais.
- Resultado por linha mostra: receita, custo, margem, lucro, e **"quantos atendimentos para empatar"**.

### Exemplos pré-preenchidos
Templates rápidos no botão "+ Adicionar":
- Atendimento (esteticista) — sessão R$ 80, 60 sessões/mês, material R$ 8
- Corte + escova — sessão R$ 90, 80/mês
- Hora consultoria — 20h/mês, R$ 150/h
Usuário pode clicar e ajustar.

### Copy
Trocar "Calculadora de Preço de Serviço" para algo inclusivo:
- Subtítulo: "Para cabeleireiras, esteticistas, manicures, consultoras, terapeutas e qualquer prestadora de serviço."

---

## 3. Importação de Catálogo (IA) — usável de verdade

### 3a. Aceitar todos os formatos relevantes
`src/components/catalog/CatalogUploader.tsx` já aceita PDF/JPG/PNG/WEBP/TXT/CSV. O problema é o backend: `supabase/functions/catalog-price-analyzer/index.ts` trata PDF com `data.text()` cru (lixo binário) — por isso "não aceita PDF".

**Fix backend:**
- PDF → enviar como **imagem multimodal** ao Gemini (cada página). Como o gateway aceita data URLs `application/pdf`? Não confiável. Vou:
  1. Detectar PDF.
  2. Subir o PDF como `image_url` com mime `application/pdf` para `google/gemini-2.5-flash` (Gemini suporta PDF nativo via gateway data-URL).
  3. Fallback: se gateway recusar, ler até 4MB e mandar como anexo base64 com instrução textual ("este é um PDF de catálogo, leia tabela de preços").
- Aumentar limite para 8 arquivos e 15MB (ajustar `CatalogUploader` props e validação backend).
- Adicionar `.xlsx`, `.xls`, `.docx` no aceito do uploader; backend tenta extrair texto (xlsx via SheetJS importado por `esm.sh`, docx via mammoth).

### 3b. Schema de retorno mais rico
Atualizar prompt e tipos `DetectedProduct`:
```ts
{ name, sku?, category,
  detected_price, suggested_price,
  estimated_cost, freight_estimate,    // NOVO
  packaging_estimate,                   // NOVO
  margin_percent,
  expected_monthly_units?,              // NOVO (heurística da IA)
  notes? }
```
Prompt instrui a IA a:
- Extrair **todos** os produtos do material (sem limite de 10).
- Incluir frete/embalagem se mencionados; senão estimar (5% do preço como frete default; sinalizar `freight_source: 'detected'|'estimated'`).
- Sugerir custo realista por categoria.

### 3c. Resultado organizado (`CatalogAnalysisResult.tsx`)
Reescrever em formato tabela com colunas:
| Produto | Custo | Frete | Emb. | Preço atual | Sugerido | Margem | Un. p/ break-even | [Importar] |

- Filtros: ordenar por margem, preço, nome.
- Badge de fonte do dado (📄 detectado vs 🤖 estimado).
- Cabeçalho com totais: "X produtos • margem média Y% • ticket médio R$ Z".

### 3d. Importação em LOTE
Botão grande **"Importar todos os N produtos"** acima da tabela:
- Cria uma `ProductRow` por produto detectado.
- Mapeia: `purchaseCost` ← `estimated_cost`, `freightPerUnit` ← `freight_estimate`, `extraPackaging` ← `packaging_estimate`, `desiredMargin` ← `margin_percent` (ou 30 default), `quantityPerMonth` ← `expected_monthly_units` (ou 10 default).
- `businessType` da linha = inferido por preço/categoria (categoria "revenda/loja" → lojista; "artesanato/feito" → produtor; default lojista).
- Botão por linha continua existindo para importar individual.
- Toast: "12 produtos importados. Revise as quantidades vendidas/mês para break-even preciso."

### 3e. Break-even integrado pós-importação
Após importar, o card consolidado da aba Produto destaca:
- "Para cobrir R$ X de custos fixos com este catálogo, você precisa vender pelo menos: produto A (5un), produto B (10un)..."
- Tabela ordenada por menor esforço (produto com maior margem absoluta primeiro).

---

## 4. Persistência e PDF

- `useSessionPersistence` keys: migrar `session_product_calc` (single) → `session_product_calc_v2` (lista). Migration silenciosa: se v1 existir e v2 não, converte para 1 produto.
- `exportPDF` da aba Produto: passa a iterar a lista, cada produto em um bloco, e termina com consolidado + break-even global.
- `exportPDF` da aba Serviço: idem, agora respeitando modo hora/sessão.

---

## Detalhes técnicos

### Arquivos editados
- `src/pages/PriceCalculator.tsx` — refatoração das abas Produto e Serviço (multi-itens, novos modos, consolidado, break-even rateado, novo PDF).
- `src/components/catalog/CatalogUploader.tsx` — aceitar xlsx/xls/docx, max 8 arquivos / 15MB, copy.
- `src/components/catalog/CatalogAnalysisResult.tsx` — nova UI em tabela, filtros, "Importar todos", colunas frete/embalagem/break-even.
- `supabase/functions/catalog-price-analyzer/index.ts` — handling de PDF/xlsx/docx, novo schema de saída (frete, embalagem, unidades esperadas, sem limite arbitrário de produtos), prompt revisado.

### Nada toca em
- Schema de banco (não precisa migration).
- RLS, edge auth, ou contagem de uso (já usa `increment_usage_admin` + `track_token_usage_admin`).
- Bucket `product-catalogs` (já existe).

### Comportamento esperado pós-deploy
- Aba Produto mostra lista vazia + botão "Adicionar produto" e "Importar catálogo".
- Importar PDF de catálogo: IA lê tabela, retorna 10–50+ produtos com preço, custo, frete, margem.
- Clicar "Importar todos": calculadora preenche N linhas, cada uma já com preço sugerido e quantas unidades vender p/ pagar custos fixos.
- Aba Serviço aceita esteticista/cabeleireira (modo "Por atendimento") sem precisar pensar em "horas".

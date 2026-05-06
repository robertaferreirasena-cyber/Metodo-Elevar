
# Plano: Reforçar visibilidade do toggle Lojista/Produtor

## Diagnóstico

As funções **não foram removidas** — elas continuam no código (`src/pages/PriceCalculator.tsx`):

- O tipo `BusinessType = "lojista" | "produtor"` existe (linha 107).
- Cada `ProductRow` tem `businessType` (linha 112).
- A UI tem dois botões "Revendo / Produzo" (linhas 549-559).
- Quando "Produzo": campos de **Matéria-prima, Embalagem, Mão de obra direta** aparecem como `directCosts` editáveis (linhas 580-596).
- Quando "Revendo" (lojista): campos de **Valor de Compra, Frete/un, Embalagem** (linhas 562-578).

O motivo pelo qual parece "sumido" é que esses controles ficam **dentro do AccordionContent fechado**. Cada produto começa colapsado, mostrando só nome/preço/margem no cabeçalho. Para ver o toggle, é preciso clicar para expandir o produto.

## O que vou ajustar

1. **Abrir por padrão o primeiro produto** quando a lista tem apenas 1 item, para que o toggle Lojista/Produtor apareça imediatamente ao entrar na aba.

2. **Mostrar badge do tipo no cabeçalho do accordion** (junto de Preço/Margem/BE), com ícone:
   - 🛍️ "Revendo" (lojista)
   - 🛠️ "Produzo" (produtor)
   
   Assim o usuário enxerga e identifica o modo de cada produto sem expandir.

3. **Reforçar o label e a copy** do bloco "Tipo de Negócio":
   - Título: **"Como você obtém este produto?"**
   - Botão lojista: "🛍️ Revendo (compro pronto)" — descrição curta abaixo: "Custo = compra + frete + embalagem"
   - Botão produtor: "🛠️ Eu produzo" — descrição curta: "Custo = matéria-prima + embalagem + mão de obra"

4. **Auto-expandir produtos importados do catálogo** classificados como "produtor" (categoria artesanal/feito à mão), pra usuário revisar os custos diretos detectados.

5. **Preservar** todo o cálculo existente — nada na lógica muda, só a UI fica mais explícita.

## Arquivos editados

- `src/pages/PriceCalculator.tsx` — ajustar `openItems` inicial, adicionar badge de tipo no `AccordionTrigger`, melhorar copy do bloco "Tipo de Negócio", auto-expandir produtores importados.

Nenhuma migration, edge function ou outra área é tocada.

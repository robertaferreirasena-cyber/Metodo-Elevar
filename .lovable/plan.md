

## Plano: PDF do Compromisso + Calculadora Financeira Completa para Empresários

### Parte 1: PDF Exportável do Contrato de Compromisso

**Arquivo: `src/pages/FormalizeCommitment.tsx`**
- Adicionar botão "📄 Baixar Contrato em PDF" que aparece quando `signed === true`
- Usar jsPDF (já instalado no projeto) para gerar um PDF formatado como carta:
  - Título "Contrato de Compromisso - Método ELEVAR"
  - Dados estratégicos do usuário (meta anual, trimestral, faturamento, desafio)
  - Texto da copy gerada pela IA
  - Compromisso pessoal do usuário
  - Assinatura com nome e data

### Parte 2: Calculadora Financeira Completa

**Problemas atuais da calculadora:**
1. O cálculo do markup está correto matematicamente, mas falta clareza entre markup e margem
2. O imposto está sendo calculado sobre o preço com markup, o que pode não refletir todos os cenários
3. Falta uma aba para mapear a estrutura de custos do negócio (fixos, variáveis, pró-labore)
4. Falta mostrar a "margem real" vs "faturamento ilusório"

**Arquivo: `src/pages/PriceCalculator.tsx`** — Reescrever com 3 abas:

#### Aba 1: Produto (melhorada)
- Separar custos em categorias: Custos Diretos (matéria-prima, embalagem) e Custos Indiretos (proporção dos fixos por unidade)
- Adicionar campo "Quantidade produzida/mês" para calcular custo unitário real
- Calcular: Custo Unitário = (Custos Diretos + Rateio Fixos) / Quantidade
- Preço de Venda com markup correto
- Mostrar Margem de Contribuição (não confundir com lucro líquido)
- Alert visual quando margem < 20% ("⚠️ Margem abaixo do recomendado")

#### Aba 2: Serviço (melhorada)
- Manter estrutura atual mas adicionar campo de "Pró-labore desejado" para incluir no custo
- Incluir cálculo de valor/hora real considerando custos fixos e pró-labore

#### Aba 3: Mapa Financeiro (NOVA)
- **Custos Fixos**: aluguel, internet, energia, telefone, software, contador, etc. (lista editável)
- **Custos Variáveis**: comissão, embalagem, frete, etc. (lista editável com %)
- **Pró-labore**: quanto o dono quer/precisa tirar por mês
- **Faturamento mensal informado**: campo para digitar o faturamento real
- **Cálculo automático:**
  - Total Custos Fixos
  - Estimativa Custos Variáveis (% sobre faturamento)
  - Pró-labore
  - **Lucro Real = Faturamento - Fixos - Variáveis - Pró-labore - Impostos**
  - **Margem Real (%) = Lucro Real / Faturamento**
  - **Faturamento Ilusório**: mostrar quanto do faturamento é custo disfarçado
- Card visual comparando "O que você fatura" vs "O que sobra de verdade" com cores verde/vermelho
- Ponto de equilíbrio: faturamento mínimo para cobrir custos (break-even)

### Detalhes Técnicos

**Fórmulas garantidas:**
```
Produto:
  Custo Unitário = (Custos Diretos Unitários) + (Custos Fixos Totais / Qtd Produzida)
  Preço Venda = Custo Unitário / (1 - Margem Desejada/100)  ← fórmula de margem, não markup
  Lucro Unitário = Preço Venda - Custo Unitário - (Preço Venda × Imposto%)
  Margem Real = Lucro Unitário / Preço Venda × 100

Mapa Financeiro:
  Custos Variáveis = Faturamento × (% Variáveis / 100)
  Lucro Real = Faturamento - Fixos - Variáveis - Pró-labore - Impostos
  Margem Real = Lucro Real / Faturamento × 100
  Ponto Equilíbrio = Custos Fixos / (1 - %Variáveis - %Impostos)
```

**Validação:** Adicionar helper texts explicativos nos campos para que o empresário entenda o que cada número significa. Tooltips com exemplos práticos.

### Arquivos a Editar

| Arquivo | Ação |
|---|---|
| `src/pages/FormalizeCommitment.tsx` | Adicionar botão de exportar PDF do contrato |
| `src/pages/PriceCalculator.tsx` | Reescrever com 3 abas: Produto, Serviço, Mapa Financeiro |


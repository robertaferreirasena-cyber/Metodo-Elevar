

## Plano: Dashboard Financeiro com Gráficos Visuais na Calculadora

### O que será feito

1. **Nova aba "Financeiro"** (4ª aba) — um dashboard visual consolidado que mostra um resumo de tudo que foi calculado nas outras abas, com gráficos interativos
2. **Gráficos visuais no Mapa Financeiro** — gráfico de pizza mostrando distribuição de custos vs lucro, e gráfico de barras comparando faturamento vs despesas

### Mudanças no arquivo `src/pages/PriceCalculator.tsx`

#### Aba "Mapa Financeiro" — adicionar gráficos
- **Gráfico de Pizza**: Distribuição do faturamento (Custos Fixos, Variáveis, Pró-labore, Impostos, Lucro Real) — usando Recharts (já disponível no projeto via `chart.tsx`)
- Cores: verde para lucro, tons de vermelho/laranja para custos

#### Nova Aba 4: "Financeiro" (Dashboard)
- Cards resumo no topo: Faturamento Total, Total Despesas, Lucro Real, Margem Real
- **Gráfico de Barras**: Faturamento vs Despesas vs Lucro — comparação visual direta
- **Gráfico de Pizza**: Composição das despesas (fixos, variáveis, pró-labore, impostos)
- Indicador visual do Ponto de Equilíbrio (barra de progresso mostrando quanto falta ou quanto está acima)
- Card "Saúde Financeira" com semáforo (verde/amarelo/vermelho) baseado na margem real

### Detalhes Técnicos
- Usar `recharts` (PieChart, BarChart, Cell, ResponsiveContainer) — já instalado no projeto
- Os dados do dashboard vêm do estado do `FinancialMap` — elevar o state para o componente pai `PriceCalculator` para compartilhar entre abas
- Manter exportação PDF na aba Financeiro incluindo os dados consolidados

### Arquivo editado
| Arquivo | Ação |
|---|---|
| `src/pages/PriceCalculator.tsx` | Elevar estado do Mapa Financeiro, adicionar gráficos Recharts na aba Mapa, criar nova aba Dashboard Financeiro |


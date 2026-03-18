

## Plano: Central Financeira no Menu + Metas Elevar (Simulador de Vendas)

### Parte 1: Reorganizar sidebar — seção "Financeiro"

**Arquivo: `src/components/layout/AppSidebar.tsx`**
- Remover "Calculadora" do array `moreItems`
- Adicionar nova seção "💰 Financeiro" no menu principal (entre Conquistas e Mais), com item "Central Financeira" apontando para `/financeiro`
- Adicionar item "Metas Elevar" apontando para `/metas-elevar`

**Arquivo: `src/App.tsx`**
- Rota `/calculadora` redireciona para `/financeiro` (legacy redirect)
- Nova rota `/financeiro` → `PriceCalculator` (renomear conceitualmente, mas manter o componente)
- Nova rota `/metas-elevar` → novo componente `SalesGoals`

### Parte 2: Metas Elevar — Simulador e Tracker de Vendas

**Novo arquivo: `src/pages/SalesGoals.tsx`**

Funcionalidades:
1. **Configuração de Meta**: formulário com meta mensal (R$), ticket médio (R$), dias úteis, nicho (select com opções pré-configuradas). Botão "Salvar Configuração"
2. **Resumo calculado**: vendas diárias necessárias = meta / ticket médio / dias úteis, faturamento diário necessário = meta / dias úteis
3. **Painel de acompanhamento diário**: grid de dias do mês, cada dia mostra meta vs realizado, campo para registrar vendas do dia (quantidade + valor)
4. **Lógica de acúmulo**: se não registrou venda no dia anterior, a meta do dia atual absorve o saldo pendente
5. **Aviso visual**: banner quando há dias sem registro ("Você não registrou vendas ontem — sua meta de hoje foi ajustada")
6. **Histórico**: lista dos registros de vendas por dia com totais acumulados
7. **Progress bar**: progresso da meta mensal (valor vendido / meta)

**Nova tabela: `sales_goals`**
- `id`, `user_id`, `monthly_target` (numeric), `average_ticket` (numeric), `working_days` (int), `niche` (text), `month` (date — primeiro dia do mês), `created_at`, `updated_at`

**Nova tabela: `sales_records`**
- `id`, `user_id`, `goal_id` (FK → sales_goals), `record_date` (date), `quantity` (int), `total_value` (numeric), `notes` (text), `created_at`

RLS: users manage own records via `auth.uid() = user_id`

### Parte 3: Card no Dashboard

**Arquivo: `src/pages/Dashboard.tsx`**
- Adicionar card "Metas Elevar" nos QuickHubs, com ícone Target e link para `/metas-elevar`
- Mostrar progresso da meta do mês atual se existir configuração salva

### Arquivos a criar/editar

| Arquivo | Ação |
|---|---|
| `src/components/layout/AppSidebar.tsx` | Seção "Financeiro" com Central Financeira + Metas Elevar |
| `src/App.tsx` | Rotas `/financeiro`, `/metas-elevar`, redirect `/calculadora` |
| `src/pages/SalesGoals.tsx` | Novo — simulador + tracker de metas de vendas |
| `src/pages/Dashboard.tsx` | Card Metas Elevar nos QuickHubs |
| Migração SQL | Tabelas `sales_goals` e `sales_records` com RLS |

### Detalhes Técnicos
- **Cálculo diário ajustado**: `metaDiaria = (metaMensal - totalVendidoAtéOntem) / diasRestantes`
- **Detecção de dias sem registro**: comparar `sales_records` com datas úteis passadas
- **Nicho options**: Beleza, Alimentação, Moda, Serviços, Digital, Saúde, Educação, Outro
- **Persistência**: tudo salvo no Supabase, dados carregados por mês


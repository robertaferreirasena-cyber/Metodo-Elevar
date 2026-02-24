

# Plano: Reduzir Limites de Uso para Proteger Custos

## Objetivo
Reduzir os limites de uso dos 31 usuários "lifetime" (R$ 47 único) para garantir sustentabilidade financeira do projeto.

## Alterações

### 1. Reduzir limites no frontend (`src/hooks/useUsageLimits.ts`)
Atualizar as constantes `DEFAULT_LIMITS`:
- Diario: 50 → **15**
- Mensal: 500 → **100**
- Raio-X (persona): 3 → **1**
- Sequencias: 20 → **5**

### 2. Reduzir limites no backend (`supabase/functions/conversation-analyzer/index.ts`)
Atualizar a constante `LIMITS`:
- daily: 50 → **15**
- monthly: 500 → **100**

### 3. Verificar e atualizar demais Edge Functions
Atualizar os mesmos limites em todas as edge functions que fazem verificacao de uso:
- `sales-strategist/index.ts`
- `persona-generator/index.ts`
- `sequence-generator/index.ts`
- `whatsapp-ai-agent/index.ts`
- `whatsapp-followup-agent/index.ts`

## Resultado Esperado
- Reducao de ~70% no consumo maximo possivel de API
- Custo maximo estimado cai de R$ 1.500/ano para ~R$ 450/ano
- Margem de lucro sobe para ~70% sobre os R$ 1.457 ja recebidos


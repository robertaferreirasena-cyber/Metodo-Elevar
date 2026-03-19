

## Plano: Orquestrar Fluxo Completo das Missões do Método ELEVAR

### Diagnóstico Atual

Analisei todas as 25 missões nos 10 Encontros (0-9). Problemas encontrados:

| Encontro | Missão | activity_type atual | Problema |
|---|---|---|---|
| 1 | Organizar números reais do negócio | `calculadora` | Deveria ir para Central Financeira (`/financeiro`) |
| 1 | Ajustar posicionamento nas redes | `foto` | `foto` não existe no ACTIVITY_CONFIG (só `photo`). Deveria ser `instapro` |
| 2 | Atualizar Instagram completamente | `mentor` | Deveria ir para Insta PRO |
| 2 | Criar ensaio fotográfico estratégico | `foto` | `foto` não existe no config, deveria ser `photo` |
| 5 | Ajustar preços estrategicamente | `calculadora` | Redireciona para `/financeiro` mas label diz "Calculadora de Preços" |
| 5 | Definir meta trimestral progressiva | `mentor` | Deveria ir para Metas Elevar (`/metas-elevar`) |
| 5 | Organizar projeção de crescimento | `mentor` | Deveria ir para Central Financeira |
| 6 | Ajustar campanha ativa | `mentor` | Deveria ir para Tráfego Pago (`/trafego-pago`) |
| 7 | Definir linha premium | `mentor` | Poderia linkar para Financeiro (precificação premium) |
| 7 | Estruturar campanha diferenciada | `mentor` | Deveria ir para Tráfego Pago |

### Solução

#### 1. Adicionar novos activity_types no ACTIVITY_CONFIG (MissionChecklist.tsx)

Novos tipos:
- `financeiro` → `/financeiro` — "Central Financeira"
- `metas` → `/metas-elevar` — "Metas Elevar"
- `trafego` → `/trafego-pago` — "Tráfego Pago"
- `instapro` → `/aprendizado?tab=instapro` — "Insta PRO"
- `automacao` → `/automacao-instagram` — "Automação Instagram"
- `foto` como alias de `photo` → `/ensaio-fotografico`

#### 2. Atualizar activity_types no banco (Migration SQL)

```sql
-- Encontro 1: números reais → financeiro
UPDATE learning_lessons SET activity_type = 'financeiro' WHERE id = 'ad4a8cba-...';
-- Encontro 1: posicionamento redes → instapro
UPDATE learning_lessons SET activity_type = 'instapro' WHERE id = '39f0d0e0-...';
-- Encontro 2: atualizar instagram → instapro
UPDATE learning_lessons SET activity_type = 'instapro' WHERE id = '3ae5bb2a-...';
-- Encontro 2: ensaio foto → photo
UPDATE learning_lessons SET activity_type = 'photo' WHERE id = '7215418d-...';
-- Encontro 5: ajustar preços → financeiro
UPDATE learning_lessons SET activity_type = 'financeiro' WHERE id = '589600c8-...';
-- Encontro 5: meta trimestral → metas
UPDATE learning_lessons SET activity_type = 'metas' WHERE id = 'c6c01439-...';
-- Encontro 5: projeção crescimento → financeiro
UPDATE learning_lessons SET activity_type = 'financeiro' WHERE id = '9a6aaba8-...';
-- Encontro 6: campanha ativa → trafego
UPDATE learning_lessons SET activity_type = 'trafego' WHERE id = '2a42aa98-...';
-- Encontro 7: linha premium → financeiro
UPDATE learning_lessons SET activity_type = 'financeiro' WHERE id = '75fb19b7-...';
-- Encontro 7: campanha diferenciada → trafego
UPDATE learning_lessons SET activity_type = 'trafego' WHERE id = '70972453-...';
```

#### 3. Adicionar MENTOR_PROMPTS para missões que permanecem como `mentor`

Missões que continuam como `mentor` mas precisam de prompts contextualizados (já existentes, verificar se cobrem tudo):
- Encontro 4: Delegar função humana/tecnológica ✓
- Encontro 8: Checklist de processos, ausência estratégica ✓
- Encontro 9: Plano ELEVAR 180 dias ✓
- Encontro 6: Documentar aprendizados ✓

### Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/components/learning/MissionChecklist.tsx` | Adicionar `financeiro`, `metas`, `trafego`, `instapro`, `automacao` ao ACTIVITY_CONFIG + adicionar `foto` como alias |
| Migration SQL | Atualizar `activity_type` de 10 missões no banco |




## Plano: Copy Profunda com Narrativa + Agente Mentora Gi no Carrossel

### Problemas Atuais

1. **Copy curta demais**: O prompt pede "2-3 linhas DIRETAS" e "max 6-8 palavras" nos títulos — isso gera slides rasos
2. **Sem narrativa**: Não há instrução de arco narrativo (começo, meio, fim) — cada slide é independente
3. **Sem agente especializado**: O carrossel usa um prompt genérico, não tem a inteligência da Mentora Gi

### Solução

#### 1. Reescrever o System Prompt do `carousel-generator`

Substituir o prompt atual por um especializado com:
- **Arco narrativo obrigatório**: Slide 1 = Gancho (dor/provocação), Slides 2-3 = Problema amplificado, Slides 4-6 = Solução com valor, Slides 7-8 = Prova/transformação, Slide final = CTA irresistível
- **Copy mais longa e envolvente**: Títulos de até 12 palavras, corpo com 4-6 linhas de conteúdo denso
- **Persona da Mentora Gi embutida**: O agente assume o papel de Copywriter Expert + Diretor Criativo, usando storytelling cinematográfico e copy persuasiva
- Aumentar `max_tokens` de 2000 para 4000 para suportar copy mais rica

#### 2. Adicionar Chat da Mentora Gi dentro da aba Carrossel

Criar um mini-chat inline no `CarouselEditor` que permite:
- Conversar com a Mentora Gi (agente `copywriter`) para refinar as copies
- Enviar o conteúdo atual dos slides como contexto
- A IA retorna sugestões de melhoria que o usuário pode aplicar diretamente nos slides
- Botão "Melhorar Copy com Mentora Gi" que envia todos os slides para revisão

### Arquivos

| Arquivo | Mudança |
|---|---|
| `supabase/functions/carousel-generator/index.ts` | Reescrever prompt com narrativa + copy longa + agente Mentora Gi, aumentar max_tokens |
| `src/components/carousel/CarouselEditor.tsx` | Adicionar mini-chat da Mentora Gi para refinar copies dos slides |

### Detalhes do Novo Prompt

O prompt terá estrutura de arco narrativo:
```text
ESTRUTURA NARRATIVA OBRIGATÓRIA:
- ATO 1 (Slide 1-2): GANCHO + DOR — Provoque, choque, gere identificação
- ATO 2 (Slides 3-N-2): DESENVOLVIMENTO — Entregue valor profundo com micro-transformações
- ATO 3 (Slides N-1 e N): RESOLUÇÃO + CTA — Amarre a narrativa e convide à ação

REGRAS DE COPY:
- Títulos: 8-15 palavras, impactantes e emocionais
- Corpo: 4-6 linhas com conteúdo denso, exemplos e linguagem conversacional
- Cada slide deve ter conexão com o anterior (transições narrativas)
```

### Mini-Chat Mentora Gi

- Seção colapsável abaixo do editor de slides
- Input de texto + botão "Pedir melhoria"
- Envia slides atuais + pedido do usuário para `ai-mentor-chat` com agente `copywriter`
- Resposta aparece inline com botão "Aplicar sugestões"
- Também terá botão rápido "✨ Melhorar todas as copies" que envia automaticamente


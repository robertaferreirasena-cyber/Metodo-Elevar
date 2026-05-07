
# Revamp da Calculadora de Serviços + melhorias na Calculadora de Produtos

Vou aplicar engenharia reversa do modelo que você enviou em duas frentes: **(A) refazer a Calculadora de Serviços** seguindo a estrutura completa que você descreveu, puxando custos fixos do Mapa Financeiro automaticamente; e **(B) deixar pontos de melhoria mapeados na Calculadora de Produtos** para aplicar logo em seguida.

---

## A) Calculadora de Serviços — reconstrução

A versão atual é um formulário plano (preço, atendimentos, material, fixos, pró-labore). Vou substituir por um fluxo em **5 etapas guiadas** com barra de progresso, linguagem leiga e **resultado fixo na lateral (desktop) / em bloco no fim (mobile)**, exatamente como o briefing.

### Estrutura nova (por serviço)

1. **Dados do serviço** — nome, preço cobrado hoje, meta de atendimentos/mês, duração média (min). Mantém também o modo "por hora" para consultoria/advogada/nutricionista.
2. **Capacidade de agenda** — dias trabalhados/mês, horas/dia, % de tempo produtivo. Calcula **capacidade máxima mensal** = `dias × horas × 60 × %produtivo / duração` e compara com a meta (alerta se meta > capacidade).
3. **Custos fixos mensais** — **puxados automaticamente do Mapa Financeiro** (toggle "usar Mapa" ligado por padrão, igual já existe na aba Produtos). Quando ligado, oculta os campos de aluguel/energia/internet/contabilidade/etc. Quando desligado, mostra os campos clássicos do briefing + **Retirada mensal desejada (pró-labore)**.
4. **Custos diretos do procedimento** — produto principal (nome, valor pago, rendimento em nº de atendimentos), descartáveis/atendimento, outros custos/atendimento. Calcula **custo do produto por atendimento** = `valor / rendimento` e **quantidade de produtos para atingir a meta** = `ceil(meta / rendimento)`.
5. **Taxas e margem** — impostos %, taxa cartão %, comissão %, margem de lucro líquido desejada %.

Tudo com **explicações curtas** abaixo dos campos ("Esses são os valores que só aparecem quando você vende.", etc.) e **InfoTip** mantendo padrão atual.

### Cálculos automáticos (todas as fórmulas do briefing)

```text
custoVariavel       = custoProdutoPorAtend + descartaveis + outrosVariaveis
capacidadeMensal    = dias × horas × 60 × %produtivo / duracao
rateioFixo          = (custosFixos + retiradaDesejada) / metaAtendimentos
percTotal           = impostos + cartao + comissao + margem    // em decimal
precoIdeal          = (custoVariavel + rateioFixo) / (1 - percTotal)
margemContribAtual  = precoAtual × (1 - impostos - cartao - comissao) - custoVariavel
pontoEquilibrio     = (custosFixos + retiradaDesejada) / margemContribAtual
lucroAtual_mensal   = (margemContribAtual × meta) - (custosFixos + retiradaDesejada)
lucroIdeal_mensal   = (margemContribIdeal × meta) - (custosFixos + retiradaDesejada)
qtdProdutosCompra   = ceil(meta / rendimentoProduto)
```

### Painel de Resultado (cards + leitura simples)

Cards: **Preço sugerido**, **Custo direto/atendimento**, **Custo fixo rateado**, **Ponto de equilíbrio (atendimentos)**, **Diagnóstico do preço atual** (lucro/prejuízo com cor), **Lucro mensal previsto**, **Quantidade de produtos para a meta**, **Capacidade vs Meta**.

Bloco **"Leitura simples do seu resultado"** com frases dinâmicas:
- "Você precisa cobrar pelo menos R$ X por atendimento."
- "Esse é o valor mínimo para não trabalhar no prejuízo."
- "Com o preço atual, você pode estar perdendo R$ X por mês."
- "Para tirar R$ X de pró-labore você precisa fazer Y atendimentos/mês."
- "Sua agenda comporta no máximo Z atendimentos/mês — sua meta é viável/inviável."

### Diagnóstico inteligente (mensagens automáticas)

Aplica as 7 condições do briefing (lucro negativo / lucro positivo mas não paga pró-labore / saudável / margem apertada / boa margem / preço sugerido muito acima do atual / meta acima da capacidade).

### Multi-serviço, simulação, PDF

- Mantém suporte a **vários serviços** (manicure + corte + escova) com cards individuais.
- **Seção "Simule antes de decidir"** com sliders/inputs para alterar preço, meta, margem, pró-labore e ver os 4 indicadores recalcularem na hora.
- **Exportar PDF** atualizado com: dados, fórmulas-chave, diagnóstico e recomendações ("Reavalie seu preço", "Crie combos para aumentar ticket médio", etc.).
- **Persistência via `useSessionPersistence`** mantida (chave nova `session_service_calc_v3` para não brigar com estado antigo).

---

## B) Calculadora de Produtos — pontos de melhoria (aplicar na sequência)

Comparando a versão atual com o briefing, identifiquei estes gaps a corrigir:

1. **Tela inicial de escolha do tipo de negócio** com copy do briefing ("Eu compro produtos prontos e revendo" / "Eu produzo ou fabrico meus próprios produtos") em vez do toggle pequeno atual dentro do card.
2. **Modo Produtor/Artesão incompleto** — falta: tempo de produção por unidade/lote, **mão de obra** (valor da hora × tempo, com toggle "incluir no custo"), **perdas/desperdício %**, **capacidade produtiva mensal** e **alerta de capacidade** ("Mesmo vendendo tudo que produz, esse preço não cobre custos + pró-labore").
3. **Custos variáveis de venda separados** — hoje há "taxas %" agregadas; separar em: taxa maquininha, marketplace, comissão, imposto, **desconto médio %**, custo de entrega quando sai do bolso.
4. **Pró-labore com 3 perguntas** do briefing (desejado / o negócio já paga? / quanto tira hoje) em vez de só um número.
5. **Margem mínima aceitável** + **estratégia de preço (Popular / Médio / Premium)** influenciando o preço sugerido.
6. **Diagnóstico inteligente** com as 7 mensagens contextuais do briefing (hoje só mostra cor de margem).
7. **Bloco "Leitura simples do seu resultado"** com frases prontas (ajuda muito quem não é da área financeira).
8. **Capital necessário para repor estoque** = `vendasPrevistas × custoReal` — card novo.
9. **Quantidade necessária para pagar pró-labore** (separada de break-even simples).
10. **Tela "Ranking de Produtos"** comparando produtos cadastrados (maior lucro/un, maior margem, mais ajuda nos fixos, exige mais vendas, abaixo do ideal).
11. **Seção "Simule antes de decidir"** (igual à de serviços) — alterar preço/qtd/margem e ver impacto.
12. **Relatório PDF expandido** com diagnóstico + recomendações práticas ("Separe dinheiro de reposição", "Não misture pessoal com empresa", "Crie combos", etc.).

---

## Arquivos afetados

- `src/pages/PriceCalculator.tsx` — reescrever `ServiceCalculator` (componente novo com etapas, capacidade, diagnóstico, simulação) e estender `LojistaProdutorCalculator` com os 12 pontos acima.
- Nenhum schema/edge function novo — tudo client-side, persistência em `sessionStorage`.
- Reaproveita `useSessionPersistence`, `SessionIndicator`, `InfoTip`, `CHART_COLORS` e o pipe `FinancialMap → fixedCostsFromMap` que já existe.

## Escopo desta entrega

Aprovando este plano, na próxima rodada eu **implemento integralmente o item A (Serviços)** e os pontos **1, 2, 3, 4, 6, 7, 8, 11** do item B (os que mais aproximam a calc de produtos do modelo). **Ranking de produtos (10)** e **Relatório PDF expandido (12)** ficam como follow-up curto se você confirmar — assim evito uma PR gigante difícil de revisar.

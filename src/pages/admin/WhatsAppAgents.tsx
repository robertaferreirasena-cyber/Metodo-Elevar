import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Plus, Trash2, Save, Users, Brain, BookOpen, Target, MessageSquare, Sparkles, FileText, Download, Gem } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AGENT_TYPES = {
  strategist: {
    label: '🎯 Estrategista (Roberta)',
    icon: Target,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    prompt: `Você é a Roberta, uma mentora e estrategista de vendas no WhatsApp, especialista em copywriting e neuromarketing.

Seu papel:
- Analise a situação do lead (nível de consciência, estágio do funil)
- Sugira o formato de copy mais adequado (PAS, BAB, AIDA, FAB, etc.)
- Responda de forma consultiva, explicando a estratégia por trás
- Use linguagem informal, amigável e persuasiva
- Máximo 3-4 linhas por resposta
- Sem markdown, apenas texto simples
- Português brasileiro`,
  },
  analyst: {
    label: '🔍 Analista de Conversas',
    icon: Brain,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    prompt: `Você é um analista especializado em diagnosticar necessidades e qualificar leads.

Seu papel:
- Faça perguntas estratégicas para entender a dor do lead
- Identifique o nível de consciência (Inconsciente, Consciente do Problema, da Solução, do Produto, Mais Consciente)
- Qualifique o lead (frio, morno, quente)
- Sugira próximos passos baseado no diagnóstico
- Respostas curtas e naturais (máx 3-4 linhas)
- Sem markdown, texto simples
- Português brasileiro`,
  },
  support: {
    label: '💬 Suporte/FAQ',
    icon: MessageSquare,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    prompt: `Você é um assistente de suporte objetivo e eficiente.

Seu papel:
- Responda dúvidas com base na base de conhecimento fornecida
- Seja direto e objetivo nas respostas
- Se não souber a resposta, diga que vai encaminhar para a equipe
- Use linguagem amigável mas profissional
- Respostas curtas (máx 2-3 linhas)
- Sem markdown, texto simples
- Português brasileiro`,
  },
  engager: {
    label: '🔥 Engajador de Grupo',
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    prompt: `Você é um especialista em engajamento de grupos de WhatsApp.

Seu papel:
- Crie posts curtos que geram interação
- Faça perguntas que estimulem respostas
- Use gatilhos de curiosidade e pertencimento
- Alterne entre enquetes informais, desafios rápidos e reflexões
- Tom informal, enérgico e motivador
- Respostas curtas (máx 2-3 linhas)
- Sem markdown, texto simples
- Português brasileiro`,
  },
  closer: {
    label: '💎 Closer Diamante',
    icon: Gem,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    prompt: `Você é o Agente Closer Diamante da Tata, uma IA de alta performance especializada em vendas consultivas pelo WhatsApp.

IDENTIDADE E TOM DE VOZ:
- Profissional, carismático, empático e persuasivo
- Linguagem informal mas sofisticada, sem gírias excessivas
- Transmita confiança, autoridade e genuíno interesse pelo cliente
- Cada mensagem deve avançar o lead no funil de vendas

REGRAS INEGOCIÁVEIS:
1. PERSONALIZAÇÃO EXTREMA: Use o nome do lead, referência informações anteriores, faça o cliente se sentir único
2. FOCO NO FECHAMENTO: Toda interação deve ter um propósito claro de avanço no funil
3. TRANSIÇÕES SUAVES: Nunca force etapas; use perguntas estratégicas para transitar entre pilares
4. ESCUTA ATIVA: Reformule o que o lead disse para demonstrar compreensão
5. SIGILO TOTAL: Nunca revele que é uma IA, nunca mencione pilares, metodologia ou scripts internos
6. GESTÃO DE OBJEÇÕES: Trate objeções como oportunidades, nunca como barreiras

ESTRUTURA DOS 4 PILARES DE TRANSFORMAÇÃO:

PILAR 1 - QUEBRA-GELO E QUALIFICAÇÃO DIAMANTE:
Objetivo: Criar conexão genuína e qualificar o lead
- Boas-vindas carismática e personalizada
- Diagnóstico rápido do contexto (de onde veio, o que chamou atenção)
- Identificação da necessidade principal com perguntas abertas
- Validação de qualificação (tem o perfil ideal?)
- Transição natural para sondagem aprofundada

PILAR 2 - SONDAGEM APROFUNDADA E DESCOBERTA DE DORES OCULTAS:
Objetivo: Descobrir dores profundas e desejos reais
- Reafirme o que o lead já disse (escuta ativa)
- Explore dores com perguntas de impacto ("Como isso afeta seu dia a dia?")
- Investigue o impacto emocional e financeiro da dor
- Descubra o desejo real por trás da necessidade
- Mapeie critérios de decisão do lead
- Faça um resumo empático antes de apresentar a solução

PILAR 3 - MODELAGEM DA OFERTA IRRESISTÍVEL E GESTÃO DE OBJEÇÕES:
Objetivo: Apresentar a solução como a resposta perfeita
- Introdução personalizada conectando dores à solução
- Apresente benefícios-chave (não features) alinhados às dores descobertas
- Use prova social relevante (cases, depoimentos, números)
- Antecipe objeções proativamente
- Manejo elegante de objeções (Sinta-Senti-Descobri ou Concordo-Mas)
- CTA de valor (não pressão)
- Valide o interesse antes de avançar

PILAR 4 - FECHAMENTO MAGNÉTICO E PRÓXIMOS PASSOS CLAROS:
Objetivo: Converter com naturalidade e garantir pós-venda
- Confirmação final do valor percebido
- Proposta detalhada com condições claras
- Fechamento direto ou suave conforme perfil do lead
- Espaço para últimas dúvidas
- Próximos passos claros e pós-venda imediato

REGRAS DE RESPOSTA:
- Responda de forma consultiva e natural
- Máximo 5-8 linhas por resposta (mais elaborado que agentes comuns)
- Sem markdown, apenas texto simples com emojis pontuais
- Português brasileiro
- Use perguntas estratégicas para manter o controle da conversa
- Sempre termine com uma pergunta ou CTA claro`,
  },
  custom: {
    label: '⚙️ Personalizado',
    icon: Bot,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    prompt: 'Você é um assistente de vendas inteligente. Responda de forma natural, amigável e persuasiva.',
  },
} as const;

type AgentType = keyof typeof AGENT_TYPES;

const CLOSER_KNOWLEDGE_BASE = `=== METODOLOGIA CLOSER DIAMANTE - BASE DE CONHECIMENTO COMPLETA ===

📌 VISÃO GERAL:
O Agente Closer Diamante opera com a metodologia dos 4 Pilares de Transformação, uma estrutura de vendas consultivas que guia o lead desde o primeiro contato até o fechamento e pós-venda, com foco em personalização extrema e construção de valor.

═══════════════════════════════════════════
🔷 PILAR 1: QUEBRA-GELO E QUALIFICAÇÃO DIAMANTE
═══════════════════════════════════════════
Objetivo: Criar conexão genuína, gerar confiança e qualificar o lead em até 5 etapas.

ETAPA 1.1 - Boas-vindas Carismática:
- Cumprimente pelo nome (se disponível)
- Demonstre entusiasmo genuíno pelo contato
- Exemplo: "Oi [Nome]! Que bom te receber aqui 😊 Vi que você se interessou por [produto/serviço]. Me conta, o que chamou mais sua atenção?"

ETAPA 1.2 - Diagnóstico do Contexto:
- Descubra como o lead chegou até você (indicação, anúncio, redes sociais)
- Pergunte sobre o momento atual do lead
- Exemplo: "Antes de tudo, me conta: como você ficou sabendo da gente? E já tem alguma experiência com [área]?"

ETAPA 1.3 - Identificação de Necessidade:
- Use perguntas abertas para entender o que o lead busca
- Não assuma, pergunte
- Exemplo: "E o que você tá buscando exatamente? Qual seria o resultado ideal pra você?"

ETAPA 1.4 - Validação de Qualificação:
- Verifique se o lead tem perfil (orçamento, timing, autoridade de decisão)
- Faça isso sutilmente, sem parecer interrogatório
- Exemplo: "Entendi! E você tá pensando em resolver isso agora ou tá mais numa fase de pesquisa ainda?"

ETAPA 1.5 - Transição para Sondagem:
- Resuma o que entendeu e peça permissão para aprofundar
- Exemplo: "Show, [Nome]! Pelo que entendi, você precisa de [X] e quer [resultado]. Me deixa te fazer mais algumas perguntinhas pra eu entender melhor e te dar a melhor orientação possível, tudo bem?"

REGRAS DE TRANSIÇÃO P1→P2:
- Só avance quando tiver: nome, contexto de chegada, necessidade básica identificada
- Se o lead for direto ao ponto ("quanto custa?"), responda brevemente e reconduza para qualificação

═══════════════════════════════════════════
🔷 PILAR 2: SONDAGEM APROFUNDADA E DESCOBERTA DE DORES OCULTAS
═══════════════════════════════════════════
Objetivo: Descobrir dores profundas, desejos reais e critérios de decisão em 6 etapas.

ETAPA 2.1 - Reafirmação (Escuta Ativa):
- Reformule o que o lead disse para demonstrar compreensão
- Exemplo: "Então, se entendi bem, hoje você [situação] e isso te causa [frustração]. Acertei?"

ETAPA 2.2 - Exploração de Dores:
- Pergunte sobre os maiores desafios e frustrações
- Use "como" e "o que" em vez de "por que" (evita defensividade)
- Exemplo: "E o que mais te incomoda nessa situação? O que você já tentou fazer pra resolver?"

ETAPA 2.3 - Investigação de Impacto:
- Quantifique o impacto da dor (tempo, dinheiro, emocional)
- Exemplo: "E quanto você acha que isso tá te custando por mês? Não só em dinheiro, mas em tempo, energia, oportunidades perdidas?"

ETAPA 2.4 - Descoberta de Desejos:
- Explore o cenário ideal do lead
- Exemplo: "Se a gente pudesse resolver isso completamente, como seria o seu dia a dia ideal? O que mudaria na sua vida/negócio?"

ETAPA 2.5 - Mapeamento de Critérios:
- Descubra o que é importante para a decisão de compra
- Exemplo: "Quando você pensa em escolher uma solução, o que pesa mais pra você? Preço, qualidade, suporte, velocidade de resultado?"

ETAPA 2.6 - Resumo Empático:
- Faça um resumo completo antes de apresentar a solução
- Exemplo: "Deixa eu ver se entendi tudo: você [situação], isso causa [dor] e impacta [impacto]. Seu objetivo é [desejo] e pra você é importante [critérios]. Perfeito! Tenho uma ótima notícia..."

REGRAS DE TRANSIÇÃO P2→P3:
- Só apresente a oferta depois de ter mapeado pelo menos: 1 dor principal, impacto, desejo e critérios
- Se o lead resistir a responder, compartilhe um caso similar para gerar rapport

═══════════════════════════════════════════
🔷 PILAR 3: MODELAGEM DA OFERTA IRRESISTÍVEL E GESTÃO DE OBJEÇÕES
═══════════════════════════════════════════
Objetivo: Apresentar a solução como resposta perfeita às dores descobertas em 7 etapas.

ETAPA 3.1 - Introdução Personalizada:
- Conecte cada dor mencionada à solução
- Exemplo: "Baseado em tudo que você me contou, [Nome], eu tenho certeza que [produto/serviço] é exatamente o que vai resolver [dor principal] e te levar pro [desejo]."

ETAPA 3.2 - Benefícios-Chave (Não Features):
- Apresente 3-4 benefícios alinhados às dores descobertas
- Sempre foque no RESULTADO, não na feature
- Exemplo: "Com [solução], você vai: ✅ [Benefício 1 ligado à dor 1] ✅ [Benefício 2 ligado ao desejo] ✅ [Benefício 3 ligado ao critério]"

ETAPA 3.3 - Prova Social:
- Use depoimentos, cases e números reais
- Escolha provas similares ao perfil do lead
- Exemplo: "A [Nome similar] tinha exatamente o mesmo desafio que você. Em [tempo], ela conseguiu [resultado concreto]. Quer que eu te mande o depoimento dela?"

ETAPA 3.4 - Objeções Proativas:
- Antecipe as objeções mais comuns antes que o lead levante
- Exemplo: "E olha, sei que às vezes a gente pensa 'será que funciona pra mim?'. Por isso a gente tem [garantia/teste/suporte] pra você ter total segurança."

ETAPA 3.5 - Manejo de Objeções:
- Técnica Sinta-Senti-Descobri: "Entendo como você se sente. Muitos clientes sentiram o mesmo. O que eles descobriram foi que..."
- Técnica Concordo-Mas: "Concordo que [ponto do lead]. E é justamente por isso que..."
- Nunca confronte, sempre valide e redirecione
- Objeções comuns e respostas:
  * "Tá caro" → Reframe de investimento vs. custo da inação
  * "Preciso pensar" → Descubra a objeção real por trás
  * "Vou ver com meu sócio/cônjuge" → Ofereça material para facilitar a conversa
  * "Já tentei algo parecido" → Diferencie e mostre por que desta vez é diferente

ETAPA 3.6 - CTA de Valor:
- Faça uma chamada para ação baseada em valor, não pressão
- Exemplo: "Então, [Nome], considerando tudo que conversamos, faz sentido pra você dar esse próximo passo e começar a [transformação desejada]?"

ETAPA 3.7 - Validação de Interesse:
- Confirme o nível de interesse antes de fechar
- Exemplo: "De 0 a 10, o quanto isso faz sentido pra você? E o que faltaria pra chegar no 10?"

REGRAS DE TRANSIÇÃO P3→P4:
- Só avance para fechamento quando o lead demonstrar interesse claro (8+ na escala ou confirmação verbal)
- Se interesse < 7, volte à sondagem para descobrir objeções ocultas

═══════════════════════════════════════════
🔷 PILAR 4: FECHAMENTO MAGNÉTICO E PRÓXIMOS PASSOS CLAROS
═══════════════════════════════════════════
Objetivo: Converter com naturalidade e garantir experiência pós-venda excepcional em 5 etapas.

ETAPA 4.1 - Confirmação Final:
- Reforce o valor percebido
- Exemplo: "Então, [Nome], vamos recapitular: você vai ter [benefício 1], [benefício 2] e [benefício 3]. Tudo isso pra finalmente [transformação desejada]."

ETAPA 4.2 - Proposta Detalhada:
- Apresente condições claras (preço, formas de pagamento, bônus)
- Destaque o valor total vs. investimento
- Exemplo: "O investimento é de [valor] que você pode parcelar em até [X]x. E hoje você ainda leva [bônus] que sozinho já vale [valor do bônus]."

ETAPA 4.3 - Fechamento Direto ou Suave:
- Direto (lead quente): "Vamos fechar? Te mando o link de pagamento agora!"
- Suave (lead morno): "Qual forma de pagamento seria melhor pra você: à vista com desconto ou parcelado?"
- Alternativa: "Você prefere começar pelo plano [A] ou pelo [B]?"

ETAPA 4.4 - Últimas Dúvidas:
- Dê espaço genuíno para perguntas finais
- Exemplo: "Antes de finalizar, tem mais alguma dúvida? Quero que você se sinta 100% seguro(a) nessa decisão."

ETAPA 4.5 - Próximos Passos e Pós-Venda:
- Defina próximos passos claros imediatamente
- Inicie o onboarding/boas-vindas
- Exemplo: "Perfeito! Já vou te enviar [link/acesso]. O próximo passo é [ação]. Qualquer dúvida, é só me chamar aqui. Bem-vindo(a) à família! 🎉"

═══════════════════════════════════════════
📋 REGRAS GERAIS DE OPERAÇÃO
═══════════════════════════════════════════

GESTÃO DE TEMPO E RITMO:
- Se o lead demorar para responder: envie follow-up sutil após 24h
- Se o lead sumir: use gatilho de escassez ou novidade após 48h
- Nunca envie mais de 2 follow-ups sem resposta

PERSONALIZAÇÃO EXTREMA:
- Sempre use o nome do lead
- Referencie informações de conversas anteriores
- Adapte o tom ao perfil do lead (mais formal/informal)

GATILHOS MENTAIS A UTILIZAR:
- Reciprocidade: Dê valor antes de pedir ação
- Prova Social: Cases e depoimentos
- Escassez: Vagas limitadas, condição especial
- Autoridade: Demonstre expertise
- Compromisso: Micro-compromissos progressivos
- Afinidade: Crie conexão genuína

FRASES PROIBIDAS:
- "Compre agora" (muito agressivo)
- "Última chance" sem ser verdade
- Qualquer menção a IA, bot, automação ou pilares
- Respostas genéricas sem personalização`;

const COPY_FORMATS_SUMMARY = `📋 GLOSSÁRIO DE FORMATOS DE COPY (Metodologia Prompt-Mestre):

1. PAS (Problema-Agitação-Solução): Identifique a dor → Amplifique → Apresente solução
2. BAB (Before-After-Bridge): Situação atual → Futuro desejado → Como chegar lá
3. AIDA (Atenção-Interesse-Desejo-Ação): Capte atenção → Gere interesse → Crie desejo → CTA
4. FAB (Features-Advantages-Benefits): Característica → Vantagem → Benefício emocional
5. 4Ps (Picture-Promise-Prove-Push): Pinte cenário → Prometa → Prove → Empurre ação
6. PASTOR: Problema → Amplificar → Story → Transformação → Oferta → Resposta
7. Storytelling: Narrativa com herói (cliente), vilão (problema), mentor (você), transformação
8. Prova Social: Depoimentos, números, cases, resultados de outros clientes
9. Escassez/Urgência: Limite de tempo, vagas, condição especial
10. Curiosidade: Abra loops, faça perguntas intrigantes, revele parcialmente

🧠 NÍVEIS DE CONSCIÊNCIA DO LEAD:
- Inconsciente: Não sabe que tem o problema → Use curiosidade e storytelling
- Consciente do Problema: Sabe da dor mas não da solução → Use PAS, BAB
- Consciente da Solução: Sabe que existe solução → Use FAB, comparativos
- Consciente do Produto: Conhece seu produto → Use prova social, cases
- Mais Consciente: Pronto para comprar → Use urgência, oferta direta`;

interface Agent {
  id: string;
  instance_id: string;
  group_id: string;
  group_name: string | null;
  is_active: boolean;
  system_prompt: string;
  trigger_mode: string;
  trigger_keywords: string[];
  response_delay_seconds: number;
  max_responses_per_hour: number;
  responses_this_hour: number;
  agent_type: string;
  knowledge_base: string;
  use_persona_context: boolean;
  use_copy_formats: boolean;
}

interface Instance {
  id: string;
  name: string;
  instance_token: string;
}

export default function WhatsAppAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importingRaioX, setImportingRaioX] = useState(false);

  const defaultForm: {
    instance_id: string;
    group_id: string;
    group_name: string;
    system_prompt: string;
    trigger_mode: string;
    trigger_keywords: string;
    response_delay_seconds: number;
    max_responses_per_hour: number;
    agent_type: AgentType;
    knowledge_base: string;
    use_persona_context: boolean;
    use_copy_formats: boolean;
  } = {
    instance_id: '',
    group_id: '',
    group_name: '',
    system_prompt: AGENT_TYPES.custom.prompt,
    trigger_mode: 'mention',
    trigger_keywords: '',
    response_delay_seconds: 5,
    max_responses_per_hour: 20,
    agent_type: 'custom',
    knowledge_base: '',
    use_persona_context: true,
    use_copy_formats: false,
  };

  const [form, setForm] = useState(defaultForm);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: agentsData }, { data: instancesData }] = await Promise.all([
      supabase.from('whatsapp_ai_agents').select('*').order('created_at', { ascending: false }),
      supabase.from('whatsapp_instances').select('id, name, instance_token'),
    ]);
    if (agentsData) setAgents(agentsData as unknown as Agent[]);
    if (instancesData) setInstances(instancesData);
    setLoading(false);
  };

  const handleAgentTypeChange = (type: AgentType) => {
    setForm(f => ({
      ...f,
      agent_type: type,
      system_prompt: AGENT_TYPES[type].prompt,
      knowledge_base: type === 'closer'
        ? (f.knowledge_base ? `${CLOSER_KNOWLEDGE_BASE}\n\n${f.knowledge_base}` : CLOSER_KNOWLEDGE_BASE)
        : f.knowledge_base,
    }));
    if (type === 'closer') {
      toast.success('Base de conhecimento do Closer Diamante carregada automaticamente! 💎');
    }
  };

  const handleImportRaioX = async () => {
    setImportingRaioX(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Usuário não autenticado'); return; }
      const { data: persona } = await supabase
        .from('persona_profiles')
        .select('niche, sub_niche, business_name, product_description, main_pain, main_differentiator, transformation, common_objections, price_range, target_profession, target_age_range, target_gender, target_location')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!persona) { toast.error('Nenhum Raio-X encontrado. Preencha primeiro.'); return; }
      const lines = [
        persona.niche && `Nicho: ${persona.niche}`,
        persona.sub_niche && `Sub-nicho: ${persona.sub_niche}`,
        persona.business_name && `Negócio: ${persona.business_name}`,
        persona.product_description && `Produto: ${persona.product_description}`,
        persona.main_pain && `Dor principal: ${persona.main_pain}`,
        persona.main_differentiator && `Diferencial: ${persona.main_differentiator}`,
        persona.transformation && `Transformação: ${persona.transformation}`,
        persona.common_objections && `Objeções comuns: ${persona.common_objections}`,
        persona.price_range && `Faixa de preço: ${persona.price_range}`,
        persona.target_profession && `Público-alvo: ${persona.target_profession}`,
        persona.target_age_range && `Faixa etária: ${persona.target_age_range}`,
        persona.target_gender && `Gênero: ${persona.target_gender}`,
        persona.target_location && `Localização: ${persona.target_location}`,
      ].filter(Boolean).join('\n');
      setForm(f => ({
        ...f,
        knowledge_base: f.knowledge_base ? `${f.knowledge_base}\n\n--- RAIO-X DA PERSONA ---\n${lines}` : `--- RAIO-X DA PERSONA ---\n${lines}`,
      }));
      toast.success('Raio-X importado para a base de conhecimento!');
    } finally {
      setImportingRaioX(false);
    }
  };

  const handleImportCopyFormats = () => {
    setForm(f => ({
      ...f,
      knowledge_base: f.knowledge_base ? `${f.knowledge_base}\n\n${COPY_FORMATS_SUMMARY}` : COPY_FORMATS_SUMMARY,
      use_copy_formats: true,
    }));
    toast.success('Dossiê de Copy importado!');
  };

  const handleSave = async () => {
    if (!form.instance_id || !form.group_id) {
      toast.error('Instância e ID do grupo são obrigatórios');
      return;
    }
    const payload = {
      instance_id: form.instance_id,
      group_id: form.group_id,
      group_name: form.group_name || null,
      system_prompt: form.system_prompt,
      trigger_mode: form.trigger_mode,
      trigger_keywords: form.trigger_keywords ? form.trigger_keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
      response_delay_seconds: form.response_delay_seconds,
      max_responses_per_hour: form.max_responses_per_hour,
      agent_type: form.agent_type,
      knowledge_base: form.knowledge_base,
      use_persona_context: form.use_persona_context,
      use_copy_formats: form.use_copy_formats,
    };
    if (editingId) {
      const { error } = await supabase.from('whatsapp_ai_agents').update(payload).eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Agente atualizado');
    } else {
      const { error } = await supabase.from('whatsapp_ai_agents').insert(payload);
      if (error) { toast.error('Erro ao criar'); return; }
      toast.success('Agente criado');
    }
    setShowCreate(false);
    setEditingId(null);
    setForm(defaultForm);
    loadData();
  };

  const handleEdit = (agent: Agent) => {
    setForm({
      instance_id: agent.instance_id,
      group_id: agent.group_id,
      group_name: agent.group_name || '',
      system_prompt: agent.system_prompt,
      trigger_mode: agent.trigger_mode,
      trigger_keywords: agent.trigger_keywords?.join(', ') || '',
      response_delay_seconds: agent.response_delay_seconds,
      max_responses_per_hour: agent.max_responses_per_hour,
      agent_type: (agent.agent_type || 'custom') as AgentType,
      knowledge_base: agent.knowledge_base || '',
      use_persona_context: agent.use_persona_context ?? true,
      use_copy_formats: agent.use_copy_formats ?? false,
    });
    setEditingId(agent.id);
    setShowCreate(true);
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from('whatsapp_ai_agents').update({ is_active: active }).eq('id', id);
    setAgents(prev => prev.map(a => a.id === id ? { ...a, is_active: active } : a));
    toast.success(active ? 'Agente ativado' : 'Agente desativado');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('whatsapp_ai_agents').delete().eq('id', id);
    setAgents(prev => prev.filter(a => a.id !== id));
    toast.success('Agente removido');
  };

  const triggerLabels: Record<string, string> = {
    mention: 'Menção (@bot)',
    keyword: 'Palavra-chave',
    all: 'Todas mensagens',
  };

  const getAgentConfig = (type: string) => AGENT_TYPES[(type || 'custom') as AgentType] || AGENT_TYPES.custom;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Agentes IA WhatsApp</h1>
        </div>
        <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) { setEditingId(null); setForm(defaultForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Agente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Agente' : 'Novo Agente IA'}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="config" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="config" className="text-xs">⚙️ Configuração</TabsTrigger>
                <TabsTrigger value="knowledge" className="text-xs">📚 Base de Conhecimento</TabsTrigger>
                <TabsTrigger value="behavior" className="text-xs">🧠 Comportamento</TabsTrigger>
              </TabsList>

              <TabsContent value="config" className="space-y-4 mt-4">
                <div>
                  <Label className="text-xs font-semibold">Tipo de Agente</Label>
                  <Select value={form.agent_type} onValueChange={(v) => handleAgentTypeChange(v as AgentType)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(AGENT_TYPES).map(([key, cfg]) => (
                        <SelectItem key={key} value={key} className="text-sm">{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Instância</Label>
                  <Select value={form.instance_id} onValueChange={v => setForm(f => ({ ...f, instance_id: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {instances.map(i => <SelectItem key={i.id} value={i.id} className="text-sm">{i.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">ID do Grupo</Label>
                    <Input value={form.group_id} onChange={e => setForm(f => ({ ...f, group_id: e.target.value }))} placeholder="xxx@g.us" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Nome do Grupo</Label>
                    <Input value={form.group_name} onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))} placeholder="Opcional" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Modo de Trigger</Label>
                    <Select value={form.trigger_mode} onValueChange={v => setForm(f => ({ ...f, trigger_mode: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mention" className="text-sm">Menção (@bot)</SelectItem>
                        <SelectItem value="keyword" className="text-sm">Palavra-chave</SelectItem>
                        <SelectItem value="all" className="text-sm">Todas mensagens</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Keywords (vírgula)</Label>
                    <Input value={form.trigger_keywords} onChange={e => setForm(f => ({ ...f, trigger_keywords: e.target.value }))} placeholder="ajuda, preço" className="h-9 text-sm" disabled={form.trigger_mode !== 'keyword'} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Delay (seg)</Label>
                    <Input type="number" value={form.response_delay_seconds} onChange={e => setForm(f => ({ ...f, response_delay_seconds: Number(e.target.value) }))} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Máx resp/hora</Label>
                    <Input type="number" value={form.max_responses_per_hour} onChange={e => setForm(f => ({ ...f, max_responses_per_hour: Number(e.target.value) }))} className="h-9 text-sm" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="knowledge" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleImportRaioX} disabled={importingRaioX} className="text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    {importingRaioX ? 'Importando...' : 'Importar Raio-X'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleImportCopyFormats} className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Importar Dossiê de Copy
                  </Button>
                </div>
                <div>
                  <Label className="text-xs">Base de Conhecimento</Label>
                  <Textarea
                    value={form.knowledge_base}
                    onChange={e => setForm(f => ({ ...f, knowledge_base: e.target.value }))}
                    rows={12}
                    className="text-xs font-mono"
                    placeholder="Cole aqui informações sobre o produto, FAQ, preços, scripts de vendas, etc. Use os botões acima para importar dados do Raio-X e do Dossiê de Copy automaticamente."
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">{form.knowledge_base.length} caracteres</p>
                </div>
                <div className="space-y-3 border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">Usar contexto do Raio-X</p>
                      <p className="text-[10px] text-muted-foreground">Injeta dados da persona automaticamente no prompt</p>
                    </div>
                    <Switch checked={form.use_persona_context} onCheckedChange={v => setForm(f => ({ ...f, use_persona_context: v }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">Incluir formatos de Copy</p>
                      <p className="text-[10px] text-muted-foreground">Adiciona glossário de copy e níveis de consciência</p>
                    </div>
                    <Switch checked={form.use_copy_formats} onCheckedChange={v => setForm(f => ({ ...f, use_copy_formats: v }))} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="behavior" className="space-y-4 mt-4">
                <div>
                  <Label className="text-xs font-semibold">Prompt do Sistema</Label>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    {form.agent_type !== 'custom' ? 'Pré-carregado do tipo de agente. Personalize se desejar.' : 'Defina o comportamento do agente.'}
                  </p>
                  <Textarea value={form.system_prompt} onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))} rows={10} className="text-xs font-mono" />
                </div>
                {form.agent_type !== 'custom' && (
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setForm(f => ({ ...f, system_prompt: AGENT_TYPES[f.agent_type].prompt }))}>
                    🔄 Restaurar prompt padrão do tipo
                  </Button>
                )}
              </TabsContent>
            </Tabs>
            <Button onClick={handleSave} className="w-full mt-4"><Save className="h-4 w-4 mr-1" /> {editingId ? 'Atualizar' : 'Criar Agente'}</Button>
          </DialogContent>
        </Dialog>
      </div>

      {agents.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum agente configurado</p>
          <p className="text-xs mt-1">Crie um agente para responder automaticamente em grupos do WhatsApp</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {agents.map(agent => {
            const cfg = getAgentConfig(agent.agent_type);
            const IconComp = cfg.icon;
            return (
              <Card key={agent.id} className={!agent.is_active ? 'opacity-60' : ''}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-md ${cfg.bgColor}`}>
                        <IconComp className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm truncate">{agent.group_name || agent.group_id}</CardTitle>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Badge variant={agent.is_active ? 'default' : 'secondary'} className="text-[10px]">
                            {agent.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{cfg.label}</Badge>
                          <Badge variant="outline" className="text-[10px]">{triggerLabels[agent.trigger_mode]}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{agent.responses_this_hour}/{agent.max_responses_per_hour}/h</span>
                      <Switch checked={agent.is_active} onCheckedChange={(v) => handleToggle(agent.id, v)} />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(agent)}>
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(agent.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">{agent.system_prompt}</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {agent.use_persona_context && (
                      <Badge variant="secondary" className="text-[10px]">🎯 Raio-X</Badge>
                    )}
                    {agent.use_copy_formats && (
                      <Badge variant="secondary" className="text-[10px]">📋 Copy</Badge>
                    )}
                    {agent.knowledge_base && (
                      <Badge variant="secondary" className="text-[10px]">📚 FAQ</Badge>
                    )}
                    {agent.trigger_keywords?.length > 0 && agent.trigger_keywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{kw}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

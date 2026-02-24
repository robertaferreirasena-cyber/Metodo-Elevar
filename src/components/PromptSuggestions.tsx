import { Button } from "@/components/ui/button";

interface PromptSuggestion {
  emoji: string;
  title: string;
  prompt: string;
}

interface PromptSuggestionsProps {
  suggestions: PromptSuggestion[];
  onSelect: (prompt: string) => void;
  className?: string;
}

export function PromptSuggestions({ suggestions, onSelect, className = "" }: PromptSuggestionsProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${className}`}>
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          className="h-auto p-3 text-left justify-start items-start flex-col gap-1 hover:bg-primary/5 hover:border-primary/30 transition-all group"
          onClick={() => onSelect(suggestion.prompt)}
        >
          <span className="text-lg">{suggestion.emoji}</span>
          <span className="text-xs font-medium text-foreground group-hover:text-primary line-clamp-2">
            {suggestion.title}
          </span>
        </Button>
      ))}
    </div>
  );
}

// Sugestões para Modo Privado (Estratégias X1)
export const PRIVATE_STRATEGY_SUGGESTIONS = [
  {
    emoji: "💬",
    title: "Cliente perguntou preço e sumiu",
    prompt: "Cliente perguntou o preço do meu produto e depois não respondeu mais. Como reativar essa conversa de forma natural?"
  },
  {
    emoji: "🤔",
    title: "Lead diz que vai pensar",
    prompt: "O cliente disse 'vou pensar e te dou um retorno'. Qual a melhor estratégia para responder sem parecer insistente?"
  },
  {
    emoji: "💰",
    title: "Objeção: está caro",
    prompt: "Cliente disse que meu produto está caro. Como contornar essa objeção e mostrar valor?"
  },
  {
    emoji: "⏰",
    title: "Lead frio há dias sem responder",
    prompt: "Tenho um lead que não responde há 5 dias. Como criar uma mensagem de reativação que gere resposta?"
  }
];

// Sugestões de Campanhas
export const CAMPAIGN_SUGGESTIONS = [
  {
    emoji: "🚀",
    title: "Campanha de lançamento",
    prompt: "Crie uma campanha de lançamento de 5 dias para meu produto principal, com posts sequenciados que aqueçam e convertam"
  },
  {
    emoji: "⚡",
    title: "Flash sale 24h",
    prompt: "Monte uma campanha flash sale de 24 horas com 3 posts urgentes que gerem vendas rápidas"
  },
  {
    emoji: "🔥",
    title: "Aquecimento de grupo",
    prompt: "Crie uma sequência de 5 posts para aquecer meu grupo antes de uma oferta especial"
  },
  {
    emoji: "💤",
    title: "Reativar leads frios",
    prompt: "Campanha de reativação de 3 dias para leads que sumiram há mais de 1 semana"
  }
];

// Sugestões para Ações e Eventos (Universal - Todos os Nichos)
export const ACTIONS_EVENT_SUGGESTIONS = [
  {
    emoji: "🛍️",
    title: "Bazar ou Feira",
    prompt: "Crie uma campanha de 3 posts para divulgar meu bazar/feira. Inclua: post de aquecimento (3 dias antes), post no dia do evento, e post de última chance."
  },
  {
    emoji: "📺",
    title: "Live de Vendas",
    prompt: "Crie uma sequência de posts para divulgar minha live de vendas. Preciso de: anúncio prévio (1 dia antes), lembrete no dia, e chamada durante a live."
  },
  {
    emoji: "🖤",
    title: "Black Friday",
    prompt: "Monte uma campanha completa de Black Friday com: aquecimento (1 semana antes), revelação das ofertas, contagem regressiva, e últimas horas."
  },
  {
    emoji: "🎄",
    title: "Natal / Fim de Ano",
    prompt: "Crie uma campanha de Natal para meu negócio, focando em: ideias de presente, prazo de entrega garantido, e mensagem de fim de ano."
  },
  {
    emoji: "🐰",
    title: "Páscoa",
    prompt: "Desenvolva uma campanha de Páscoa com posts de aquecimento até a semana do evento, usando gatilhos emocionais e de tradição."
  },
  {
    emoji: "🎉",
    title: "Carnaval",
    prompt: "Crie conteúdo para campanha de Carnaval, considerando o clima festivo e as necessidades do meu público nesse período."
  },
  {
    emoji: "🚀",
    title: "Lançamento de Produto",
    prompt: "Monte uma sequência de lançamento: posts de curiosidade e mistério, revelação do produto, e oferta de lançamento com condições especiais."
  },
  {
    emoji: "⚡",
    title: "Promoção Relâmpago 24h",
    prompt: "Crie 3 posts urgentes para uma promoção relâmpago de 24 horas: anúncio, meio do período, e últimas horas."
  },
  {
    emoji: "🎂",
    title: "Aniversário da Loja",
    prompt: "Campanha de aniversário da minha marca: agradecimento aos clientes, ofertas especiais comemorativas, e chamada para celebrar conosco."
  },
  {
    emoji: "🔥",
    title: "Queima de Estoque",
    prompt: "Posts para queima de estoque com máxima urgência: oportunidade única, últimas unidades, preços imperdíveis."
  }
];

// Sugestões para Modo Grupo
export const GROUP_CONTENT_SUGGESTIONS = [
  {
    emoji: "🔥",
    title: "Post de engajamento inicial",
    prompt: "Preciso de um post para gerar engajamento no meu grupo de vendas. Quero que as pessoas comentem e interajam."
  },
  {
    emoji: "📢",
    title: "Anunciar promoção",
    prompt: "Quero criar um post curto anunciando uma promoção especial para o grupo. Deve gerar urgência."
  },
  {
    emoji: "💡",
    title: "Compartilhar dica de valor",
    prompt: "Preciso de um post compartilhando uma dica útil relacionada ao meu nicho para gerar autoridade no grupo."
  },
  {
    emoji: "🎯",
    title: "Fazer enquete no grupo",
    prompt: "Quero criar um post com enquete para descobrir as dores e interesses dos membros do meu grupo de vendas."
  }
];

// Sugestões para Análise de Conversas (6 cenários diversos)
export const CONVERSATION_ANALYSIS_SUGGESTIONS = [
  {
    emoji: "📋",
    title: "Conversa com objeção de preço",
    prompt: `Vendedor: Oi Maria, tudo bem? Vi que você demonstrou interesse no nosso curso de inglês.
Cliente: Oi, sim, tenho interesse
Vendedor: Que legal! O curso custa R$ 497 e você pode parcelar em até 12x
Cliente: Hmm, tá um pouco caro pra mim agora
Vendedor: Posso te dar 10% de desconto
Cliente: Vou pensar e te aviso`
  },
  {
    emoji: "😶",
    title: "Lead que sumiu após preço",
    prompt: `Vendedor: Olá! Vi seu interesse no nosso produto.
Cliente: Oi! Sim, quanto custa?
Vendedor: O valor é R$ 297 à vista ou 3x de R$ 99
Cliente: visualizou
(2 dias depois)
Vendedor: Oi, conseguiu ver?
Cliente: visualizou`
  },
  {
    emoji: "🤔",
    title: "Cliente indeciso (vou pensar)",
    prompt: `Vendedor: E aí, gostou da proposta?
Cliente: Gostei sim, mas preciso pensar
Vendedor: Claro! Só lembrando que a promoção acaba hoje
Cliente: Tá, vou ver com meu marido
Vendedor: Ok, qualquer coisa me chama!
Cliente: Tá`
  },
  {
    emoji: "✅",
    title: "Venda fechada (caso de sucesso)",
    prompt: `Vendedor: Oi Ana! Lembra que você perguntou sobre o tratamento?
Cliente: Oi! Lembro sim
Vendedor: Então, fiz um valor especial pra você. Posso te contar?
Cliente: Conta!
Vendedor: De R$ 800 por R$ 590, e ainda inclui a manutenção grátis
Cliente: Nossa, muito bom! Como faço pra agendar?
Vendedor: Te passo o link pra escolher o melhor horário 😊`
  },
  {
    emoji: "🔄",
    title: "Tentativa de reativação",
    prompt: `Vendedor: Oi João! Tudo bem? Faz tempo que não nos falamos
Cliente: Oi, tudo
Vendedor: Lembrei de você porque chegou uma novidade que combina muito com o que você procurava
Cliente: Qual?
Vendedor: Um modelo novo do produto X, com preço promocional de lançamento
Cliente: Hmm interessante
Vendedor: Quer que eu te mande mais detalhes?
Cliente: Pode mandar`
  },
  {
    emoji: "❌",
    title: "Venda perdida (erros comuns)",
    prompt: `Vendedor: Boa tarde! Temos ótimas ofertas hoje!
Cliente: Oi
Vendedor: Nosso produto é o melhor do mercado, tem 50% de desconto, qualidade premium, entrega rápida, garantia de 1 ano, suporte 24h...
Cliente: Hmm
Vendedor: E ainda tem brinde! Quer comprar?
Cliente: Não, obrigado
Vendedor: Mas é uma oportunidade única!
Cliente: Não tenho interesse`
  }
];

// Sugestões para Gerador de Ideias
export const IDEAS_GENERATOR_SUGGESTIONS = [
  {
    emoji: "🚀",
    title: "Ideias para lançamento",
    prompt: "Preciso de ideias criativas para lançar meu novo produto no WhatsApp. Como gerar expectativa e vendas?"
  },
  {
    emoji: "📱",
    title: "Conteúdo para stories",
    prompt: "Quero ideias de conteúdo para stories do WhatsApp que gerem engajamento e vendas indiretas."
  },
  {
    emoji: "🎁",
    title: "Promoções criativas",
    prompt: "Preciso de ideias de promoções diferentes das tradicionais para atrair mais clientes."
  },
  {
    emoji: "✨",
    title: "Diferenciação da concorrência",
    prompt: "Como posso me diferenciar da concorrência nas minhas abordagens de vendas no WhatsApp?"
  }
];

// ========== SUGESTÕES POR NICHO ==========

// Moda e Acessórios
export const NICHE_MODA_SUGGESTIONS = [
  {
    emoji: "👗",
    title: "Cliente indecisa entre peças",
    prompt: "Tenho uma cliente que está em dúvida entre dois vestidos. Como ajudá-la a decidir e fechar a venda?"
  },
  {
    emoji: "📦",
    title: "Lançamento de coleção nova",
    prompt: "Vou lançar uma coleção nova de roupas femininas. Como criar expectativa e gerar vendas no WhatsApp?"
  },
  {
    emoji: "💃",
    title: "Vender look completo",
    prompt: "Cliente comprou uma blusa, como oferecer peças complementares para montar um look sem parecer insistente?"
  },
  {
    emoji: "🔄",
    title: "Reativar cliente de moda",
    prompt: "Cliente comprou há 3 meses e não voltou. Como reativá-la com novidades de moda?"
  }
];

// Gastronomia e Alimentação
export const NICHE_GASTRONOMIA_SUGGESTIONS = [
  {
    emoji: "🍕",
    title: "Aumentar ticket médio delivery",
    prompt: "Como sugerir adicionais e combos para aumentar o ticket médio dos pedidos de delivery?"
  },
  {
    emoji: "🎂",
    title: "Encomendas de confeitaria",
    prompt: "Cliente quer encomendar um bolo mas achou caro. Como mostrar valor e justificar o preço da confeitaria artesanal?"
  },
  {
    emoji: "📲",
    title: "Fidelizar cliente de restaurante",
    prompt: "Cliente pediu pela primeira vez. Como criar uma mensagem de pós-venda que fidelize sem ser invasivo?"
  },
  {
    emoji: "🥗",
    title: "Vender marmitas fitness",
    prompt: "Como abordar leads interessados em alimentação saudável e converter em assinantes de marmitas?"
  }
];

// Estética e Beleza
export const NICHE_ESTETICA_SUGGESTIONS = [
  {
    emoji: "💅",
    title: "Reagendar cliente ausente",
    prompt: "Cliente de manicure não aparece há 1 mês. Como mandar mensagem para reagendar sem parecer desesperada?"
  },
  {
    emoji: "✨",
    title: "Vender pacote de procedimentos",
    prompt: "Como apresentar um pacote de limpeza de pele + peeling para cliente que fez só uma sessão?"
  },
  {
    emoji: "💆‍♀️",
    title: "Objeção de tempo",
    prompt: "Cliente diz que não tem tempo para fazer procedimentos estéticos. Como contornar essa objeção?"
  },
  {
    emoji: "🎁",
    title: "Promoção de aniversário",
    prompt: "Quero criar uma campanha de aniversário do salão. Ideias de promoções que gerem urgência?"
  }
];

// Saúde e Bem-estar
export const NICHE_SAUDE_SUGGESTIONS = [
  {
    emoji: "🏋️",
    title: "Converter lead de personal",
    prompt: "Lead perguntou sobre personal trainer mas disse que vai pensar. Como fazer follow-up efetivo?"
  },
  {
    emoji: "🥦",
    title: "Consulta nutricional",
    prompt: "Paciente interessada em consulta nutricional mas acha o investimento alto. Como mostrar o valor?"
  },
  {
    emoji: "🧘",
    title: "Pacote de terapia",
    prompt: "Cliente fez uma sessão de terapia e gostou. Como oferecer pacote de sessões?"
  },
  {
    emoji: "💊",
    title: "Suplementos e vitaminas",
    prompt: "Como abordar clientes para vender suplementos sem parecer que estou empurrando produto?"
  }
];

// Educação e Cursos
export const NICHE_EDUCACAO_SUGGESTIONS = [
  {
    emoji: "📚",
    title: "Matricula em curso",
    prompt: "Lead demonstrou interesse no meu curso mas não finalizou a matrícula. Como fazer follow-up?"
  },
  {
    emoji: "👨‍🏫",
    title: "Aulas particulares",
    prompt: "Pai interessado em aulas particulares para o filho mas quer desconto. Como negociar?"
  },
  {
    emoji: "🎓",
    title: "Renovação de matrícula",
    prompt: "Aluno precisa renovar matrícula e está pensando em desistir. Como convencê-lo a continuar?"
  },
  {
    emoji: "💻",
    title: "Curso online",
    prompt: "Como criar urgência para vender meu curso online sem parecer agressivo?"
  }
];

// Serviços Profissionais
export const NICHE_SERVICOS_SUGGESTIONS = [
  {
    emoji: "⚖️",
    title: "Consultoria jurídica",
    prompt: "Cliente precisa de advogado mas diz que vai pesquisar preços. Como me diferenciar?"
  },
  {
    emoji: "📊",
    title: "Serviços de contabilidade",
    prompt: "Empresário interessado em trocar de contador. Como apresentar meus diferenciais?"
  },
  {
    emoji: "🔧",
    title: "Orçamento de serviço",
    prompt: "Cliente pediu orçamento de reparo e sumiu. Como reativar sem parecer insistente?"
  },
  {
    emoji: "🏠",
    title: "Projeto de arquitetura",
    prompt: "Cliente quer fazer reforma mas está com medo do investimento. Como tranquilizá-lo?"
  }
];

// Pets
export const NICHE_PETS_SUGGESTIONS = [
  {
    emoji: "🐕",
    title: "Banho e tosa",
    prompt: "Como criar mensagem para lembrar clientes de agendar banho e tosa do pet?"
  },
  {
    emoji: "🦴",
    title: "Ração premium",
    prompt: "Cliente acha ração premium cara. Como explicar os benefícios e justificar o preço?"
  },
  {
    emoji: "🏥",
    title: "Consulta veterinária",
    prompt: "Como abordar tutores para oferecer check-up preventivo para seus pets?"
  },
  {
    emoji: "🛍️",
    title: "Acessórios pet",
    prompt: "Cliente comprou ração, como oferecer brinquedos e acessórios complementares?"
  }
];

// Função helper para obter sugestões por nicho
export const getNicheSuggestions = (niche: string) => {
  const nicheMap: Record<string, typeof NICHE_MODA_SUGGESTIONS> = {
    moda: NICHE_MODA_SUGGESTIONS,
    gastronomia: NICHE_GASTRONOMIA_SUGGESTIONS,
    estetica: NICHE_ESTETICA_SUGGESTIONS,
    saude: NICHE_SAUDE_SUGGESTIONS,
    educacao: NICHE_EDUCACAO_SUGGESTIONS,
    servicos: NICHE_SERVICOS_SUGGESTIONS,
    pets: NICHE_PETS_SUGGESTIONS,
  };
  return nicheMap[niche.toLowerCase()] || PRIVATE_STRATEGY_SUGGESTIONS;
};

// ========== ENGAJAMENTO E COMUNIDADE ==========

// Dinâmicas de comunidade para grupos
export const COMMUNITY_ENGAGEMENT_SUGGESTIONS = [
  {
    emoji: "📊",
    title: "Enquete de preferências",
    prompt: "Crie uma enquete para descobrir as preferências do meu grupo. Quero entender o que eles mais gostam para personalizar minhas ofertas."
  },
  {
    emoji: "🗳️",
    title: "Enquete 'Isso ou Aquilo'",
    prompt: "Crie um post de enquete divertido estilo 'Isso ou Aquilo' relacionado ao meu nicho. Objetivo: gerar interação leve e divertida."
  },
  {
    emoji: "🎁",
    title: "Sorteio no grupo",
    prompt: "Crie um post anunciando um sorteio no grupo. Regra: comentar para participar. Objetivo: aumentar engajamento e manter pessoas no grupo."
  },
  {
    emoji: "🏆",
    title: "Desafio da semana",
    prompt: "Crie um desafio semanal para os membros do grupo participarem. Pode ser postar foto, compartilhar experiência, etc. Objetivo: gerar conteúdo dos próprios membros."
  },
  {
    emoji: "👋",
    title: "Boas-vindas criativas",
    prompt: "Crie um post de boas-vindas para novos membros do grupo. Deve fazer a pessoa se sentir especial e querer participar."
  },
  {
    emoji: "💬",
    title: "Pergunta do dia",
    prompt: "Crie uma 'pergunta do dia' relacionada ao meu nicho para gerar conversa no grupo. Deve ser fácil de responder."
  },
  {
    emoji: "🌟",
    title: "Cliente destaque",
    prompt: "Crie um post para destacar um cliente/membro do grupo. Objetivo: gerar prova social e fazer outros quererem ser destacados também."
  },
  {
    emoji: "🔒",
    title: "Conteúdo exclusivo do grupo",
    prompt: "Crie um post que reforce que o conteúdo é EXCLUSIVO para quem está no grupo. Objetivo: fazer as pessoas valorizarem estar aqui e não sair."
  }
];

// Todas as sugestões de nicho combinadas para seleção
export const ALL_NICHE_CATEGORIES = [
  { id: "moda", label: "👗 Moda", suggestions: NICHE_MODA_SUGGESTIONS },
  { id: "gastronomia", label: "🍕 Gastronomia", suggestions: NICHE_GASTRONOMIA_SUGGESTIONS },
  { id: "estetica", label: "💅 Estética", suggestions: NICHE_ESTETICA_SUGGESTIONS },
  { id: "saude", label: "🏋️ Saúde", suggestions: NICHE_SAUDE_SUGGESTIONS },
  { id: "educacao", label: "📚 Educação", suggestions: NICHE_EDUCACAO_SUGGESTIONS },
  { id: "servicos", label: "⚖️ Serviços", suggestions: NICHE_SERVICOS_SUGGESTIONS },
  { id: "pets", label: "🐕 Pets", suggestions: NICHE_PETS_SUGGESTIONS },
];

// ========== REMARKETING (Reconexão com Leads/Clientes) ==========

export const REMARKETING_SUGGESTIONS = [
  {
    emoji: "📦",
    title: "Abandono de carrinho",
    prompt: "Um lead adicionou produtos no carrinho mas não finalizou a compra. Como criar uma mensagem de recuperação que não pareça insistente?"
  },
  {
    emoji: "😶",
    title: "Lead sumiu após saber o preço",
    prompt: "Lead perguntou o preço e nunca mais respondeu. Passou uma semana. Como retomar contato de forma natural?"
  },
  {
    emoji: "🕐",
    title: "Follow-up pós-orçamento",
    prompt: "Enviei um orçamento/proposta há 3 dias e o cliente não respondeu. Como fazer follow-up sem parecer desesperado?"
  },
  {
    emoji: "💤",
    title: "Cliente inativo há 30 dias",
    prompt: "Tenho clientes que compraram mas não voltaram há mais de 30 dias. Como criar uma mensagem de reativação que gere nova compra?"
  },
  {
    emoji: "🎁",
    title: "Oferta exclusiva de retorno",
    prompt: "Quero criar uma oferta especial para clientes antigos voltarem. Como apresentar isso de forma irresistível?"
  },
  {
    emoji: "📅",
    title: "Aniversário do cliente",
    prompt: "É aniversário de um cliente. Como mandar uma mensagem que fortaleça o relacionamento e inclua uma oferta especial?"
  },
  {
    emoji: "💳",
    title: "Upsell / Cross-sell",
    prompt: "Cliente comprou um produto. Como oferecer um produto complementar ou upgrade sem parecer oportunista?"
  },
  {
    emoji: "⭐",
    title: "Pedir avaliação/depoimento",
    prompt: "Cliente satisfeito mas nunca deixou avaliação. Como pedir um depoimento de forma natural que ele realmente faça?"
  },
  {
    emoji: "🔔",
    title: "Novidade para base antiga",
    prompt: "Tenho uma novidade/lançamento e quero avisar clientes antigos da minha base. Como criar uma mensagem que gere interesse?"
  },
  {
    emoji: "🤝",
    title: "Reativar parceria/indicação",
    prompt: "Quero reativar o relacionamento com alguém que indicava clientes ou era parceiro. Como retomar contato de forma profissional?"
  }
];

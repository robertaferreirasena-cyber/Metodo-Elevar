import { FileText, ArrowLeft, Copy, Check, ShoppingBag, Briefcase, Heart, Scale, Sparkles, GraduationCap, UtensilsCrossed, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { usePersonaProfile } from "@/hooks/usePersonaProfile";

interface NicheTemplate {
  niche: "todos" | "lojistas" | "servicos" | "saude" | "direito" | "beleza" | "educacao" | "gastronomia";
  category: string;
  title: string;
  content: string;
}

const templates: NicheTemplate[] = [
  // TEMPLATES GERAIS (todos)
  {
    niche: "todos",
    category: "Gatilho de Curiosidade",
    title: "A Revelação",
    content: "Descobri algo que mudou TUDO no meu [nicho]... 👀\n\nE quero compartilhar com vocês.\n\nQuem quer saber? Comenta 🙋‍♀️",
  },
  {
    niche: "todos",
    category: "Gatilho de Curiosidade",
    title: "O Erro Comum",
    content: "O maior erro que [público-alvo] comete é...\n\n(e eu também já cometi 😅)\n\nQuer saber qual é?",
  },
  {
    niche: "todos",
    category: "Prova Social",
    title: "Resultado de Cliente",
    content: "Olha o que a [nome] me mandou hoje 😍\n\n\"[depoimento curto]\"\n\nIsso me motiva demais! 🚀",
  },
  {
    niche: "todos",
    category: "Prova Social",
    title: "Antes e Depois",
    content: "Antes: [situação anterior]\nDepois: [situação atual]\n\nIsso em apenas [tempo]!\n\nQuem mais quer esse resultado? 🙋‍♀️",
  },
  {
    niche: "todos",
    category: "Interação",
    title: "Enquete Simples",
    content: "Me conta: qual é seu maior desafio com [tema]?\n\n1️⃣ [opção 1]\n2️⃣ [opção 2]\n3️⃣ [opção 3]\n\nComenta o número! 👇",
  },
  {
    niche: "todos",
    category: "Interação",
    title: "Desafio do Grupo",
    content: "🔥 DESAFIO DO DIA 🔥\n\nVamos fazer [ação simples] hoje?\n\nQuem topar, comenta \"EU VOU\" 💪",
  },
  {
    niche: "todos",
    category: "Oferta Sutil",
    title: "Vagas Limitadas",
    content: "Pessoal, abri mais [X] vagas para [serviço/produto].\n\nQuem tiver interesse, chama no privado que explico tudo! 📩",
  },
  {
    niche: "todos",
    category: "Oferta Sutil",
    title: "Bônus Exclusivo",
    content: "Quem fechar [produto] essa semana ganha [bônus] de presente! 🎁\n\nInteressou? Me chama! 💜",
  },

  // LOJISTAS
  {
    niche: "lojistas",
    category: "Novidades",
    title: "Chegou Novidade",
    content: "Chegou! E já estou apaixonada por essa peça... 😍\n\nQuem quer ver mais cores? Comenta a cor favorita! 🎨",
  },
  {
    niche: "lojistas",
    category: "Novidades",
    title: "Coleção Nova",
    content: "A nova coleção chegou e eu PRECISAVA mostrar pra vocês primeiro! 🛍️\n\nQual peça vocês querem ver mais de perto?\n\n1, 2 ou 3? Comenta aí! 👇",
  },
  {
    niche: "lojistas",
    category: "Urgência",
    title: "Últimas Unidades",
    content: "⚡ ÚLTIMAS 3 UNIDADES desse [produto] que ESGOTOU semana passada!\n\nTamanhos: P e M\n\nInteressou? Chama rápido! 📲",
  },
  {
    niche: "lojistas",
    category: "Urgência",
    title: "Promoção Relâmpago",
    content: "🚨 PROMOÇÃO RELÂMPAGO 🚨\n\nSó hoje: [produto] com [X]% OFF!\n\nCorre que é só enquanto durar o estoque! 💨",
  },
  {
    niche: "lojistas",
    category: "Interação",
    title: "Vote no Look",
    content: "Me ajuda a escolher: Look 1 ou Look 2? 👗\n\n[Descrição look 1] ➡️ 1\n[Descrição look 2] ➡️ 2\n\nComenta o número! Vou usar o mais votado 😊",
  },
  {
    niche: "lojistas",
    category: "Interação",
    title: "Qual Seu Estilo",
    content: "Bora descobrir seu estilo? 🔍\n\n🌸 Romântica\n⚡ Despojada\n💼 Clássica\n🌈 Ousada\n\nComenta qual combina mais com você!",
  },
  {
    niche: "lojistas",
    category: "Bastidores",
    title: "Por Trás da Vitrine",
    content: "O que vocês não veem: as 5h da manhã escolhendo peças pra vocês ☕\n\nQuem gosta de ver os bastidores? 🙋‍♀️",
  },
  {
    niche: "lojistas",
    category: "Bastidores",
    title: "Montando Kit",
    content: "Montando kits especiais pra presente 🎁\n\nQuer que eu monte um personalizado pra você? Chama no privado! 📲",
  },
  {
    niche: "lojistas",
    category: "Regional",
    title: "Chimarrão Style",
    content: "Tem coisa melhor que uma cuia boa num dia frio? 🧉\n\nMostrando os novos kits que chegaram!\n\nQual seu mate preferido: amargo ou doce? ☕",
  },
  {
    niche: "lojistas",
    category: "Regional",
    title: "Artigos Gaúchos",
    content: "Tradição a gente leva no coração e no chimarrão! 🧉❤️\n\nNovos [produtos] chegaram!\n\nVem ver mais detalhes no privado 📲",
  },

  // SERVIÇOS
  {
    niche: "servicos",
    category: "Autoridade",
    title: "Dica do Profissional",
    content: "Uma dica que vale ouro 💡\n\n[Dica prática e rápida]\n\nSalva esse post pra não esquecer! 📌",
  },
  {
    niche: "servicos",
    category: "Autoridade",
    title: "Erro Que Vejo Sempre",
    content: "O erro que 90% dos clientes cometem:\n\n❌ [erro comum]\n\nO certo seria:\n\n✅ [solução]\n\nVocê fazia isso? 🤔",
  },
  {
    niche: "servicos",
    category: "Prova Social",
    title: "Cliente Satisfeito",
    content: "Feedback assim que motiva a gente! 🥹\n\n\"[depoimento do cliente]\"\n\nObrigado pela confiança, [nome]! 🙏",
  },
  {
    niche: "servicos",
    category: "Prova Social",
    title: "Projeto Entregue",
    content: "Mais um projeto entregue com sucesso! ✅\n\n[breve descrição]\n\nQuem precisa de [serviço]? Chama no privado! 📲",
  },
  {
    niche: "servicos",
    category: "Oferta",
    title: "Agenda Abrindo",
    content: "📅 Abrindo agenda para [mês]!\n\nSão apenas [X] vagas disponíveis.\n\nGaranta a sua! Chama no privado 📲",
  },
  {
    niche: "servicos",
    category: "Oferta",
    title: "Pacote Especial",
    content: "💼 NOVIDADE!\n\nCriei um pacote especial com:\n\n✅ [item 1]\n✅ [item 2]\n✅ [item 3]\n\nCondição especial essa semana! Quer saber mais? 📩",
  },

  // SAÚDE
  {
    niche: "saude",
    category: "Educativo",
    title: "Mito ou Verdade",
    content: "MITO OU VERDADE? 🤔\n\n\"[afirmação comum]\"\n\nChuta aí nos comentários! Amanhã eu conto a resposta 👇",
  },
  {
    niche: "saude",
    category: "Educativo",
    title: "Você Sabia",
    content: "Você sabia que [fato interessante]? 🧠\n\nIsso pode mudar como você [ação]!\n\nQuer saber mais? Comenta \"EU\" 👇",
  },
  {
    niche: "saude",
    category: "Educativo",
    title: "Café da Manhã",
    content: "Você sabia que pular o café da manhã pode atrapalhar seu emagrecimento? 🍳\n\nVou explicar o porquê nos próximos posts...\n\nQuer saber? 🙋‍♀️",
  },
  {
    niche: "saude",
    category: "Interação",
    title: "Maior Dificuldade",
    content: "Qual sua maior dificuldade com alimentação?\n\n1️⃣ Comer fora de hora\n2️⃣ Não ter tempo pra cozinhar\n3️⃣ Resistir a doces\n\nComenta o número! 👇",
  },
  {
    niche: "saude",
    category: "Interação",
    title: "Treino Favorito",
    content: "Qual treino você mais ama?\n\n💪 Musculação\n🏃‍♀️ Cardio\n🧘 Yoga/Pilates\n🏊 Natação\n\nComenta o seu! Bora trocar experiências 😊",
  },
  {
    niche: "saude",
    category: "Motivação",
    title: "Não Desista",
    content: "Ei, você que está pensando em desistir...\n\nLembra por que você começou! 💪\n\nUm dia de cada vez. Um passo de cada vez.\n\nVocê consegue! 🙌",
  },
  {
    niche: "saude",
    category: "Motivação",
    title: "Pequenos Passos",
    content: "Não precisa ser perfeito.\nPrecisa ser constante. 🎯\n\nPequenas mudanças, grandes resultados.\n\nQuem está comigo? ✋",
  },
  {
    niche: "saude",
    category: "Dica Prática",
    title: "Receita Rápida",
    content: "RECEITA RÁPIDA E SAUDÁVEL 🥗\n\n[ingredientes simples]\n\nPronto em [X] minutos!\n\nQuer mais receitas assim? 😋",
  },

  // DIREITO E CONTABILIDADE
  {
    niche: "direito",
    category: "Autoridade",
    title: "Direito Violado",
    content: "Muita gente não sabe, mas esse direito pode estar sendo violado no seu trabalho... ⚖️\n\nQuer saber qual é? Comenta \"EU\" 👇",
  },
  {
    niche: "direito",
    category: "Autoridade",
    title: "Lei Pouco Conhecida",
    content: "Você conhece a lei [número]? 📚\n\nEla garante que você pode [direito].\n\nMuita gente não sabe e perde esse benefício!\n\nDúvidas? Chama no privado 📲",
  },
  {
    niche: "direito",
    category: "Urgência",
    title: "Prazo Acabando",
    content: "⚠️ ATENÇÃO!\n\nO prazo para entrar com essa ação acaba em 30 dias!\n\nQuem tem dúvidas, chama no privado. ⏰",
  },
  {
    niche: "direito",
    category: "Urgência",
    title: "Nova Lei",
    content: "🚨 NOVA LEI EM VIGOR!\n\nA partir de agora, [mudança importante].\n\nIsso afeta quem [público].\n\nQuer entender melhor? Comenta 👇",
  },
  {
    niche: "direito",
    category: "Educativo",
    title: "Imposto de Renda",
    content: "Ainda dá tempo de declarar o IR? 📝\n\nSIM! O prazo vai até [data].\n\nMas cuidado: deixar pra última hora pode gerar multa!\n\nPrecisa de ajuda? 📲",
  },
  {
    niche: "direito",
    category: "Educativo",
    title: "MEI - O Que Você Precisa Saber",
    content: "Se você é MEI, precisa saber disso:\n\n✅ [obrigação 1]\n✅ [obrigação 2]\n✅ [obrigação 3]\n\nEstá em dia com tudo? 🤔",
  },

  // BELEZA E ESTÉTICA
  {
    niche: "beleza",
    category: "Novidades",
    title: "Técnica Nova",
    content: "Gente, acabei de fazer um curso INCRÍVEL! 💅\n\nAgora ofereço [técnica nova] aqui no espaço!\n\nQuem quer ser a primeira a experimentar? ✨",
  },
  {
    niche: "beleza",
    category: "Novidades",
    title: "Produto Novo",
    content: "Chegou o queridinho que vocês pediram! 💄\n\n[Nome do produto]\n\nResultados incríveis e duração muito maior!\n\nQuem quer agendar? 📲",
  },
  {
    niche: "beleza",
    category: "Antes e Depois",
    title: "Transformação",
    content: "Olha essa TRANSFORMAÇÃO! 😍\n\n[Descrição breve do procedimento]\n\nA cliente amou e eu também! ✨\n\nQuer um resultado assim? Chama no privado! 📲",
  },
  {
    niche: "beleza",
    category: "Antes e Depois",
    title: "Resultado Incrível",
    content: "De [antes] pra [depois] em apenas [tempo]! 💫\n\nIsso que é o poder de um bom [procedimento]!\n\nQuem mais quer? 🙋‍♀️",
  },
  {
    niche: "beleza",
    category: "Dicas",
    title: "Cuidados em Casa",
    content: "3 cuidados que vão fazer seu [procedimento] durar mais:\n\n1️⃣ [dica 1]\n2️⃣ [dica 2]\n3️⃣ [dica 3]\n\nSalva esse post! 📌",
  },
  {
    niche: "beleza",
    category: "Dicas",
    title: "Erros Comuns",
    content: "Erros que acabam com suas [unhas/sobrancelhas/etc]:\n\n❌ [erro 1]\n❌ [erro 2]\n❌ [erro 3]\n\nVocê fazia algum desses? 🤔",
  },
  {
    niche: "beleza",
    category: "Promoção",
    title: "Dia de Desconto",
    content: "✨ [DIA DA SEMANA] É DIA DE [PROCEDIMENTO]! ✨\n\nValor especial: de R$[X] por apenas R$[Y]!\n\nVagas limitadas! Garanta a sua 📲",
  },
  {
    niche: "beleza",
    category: "Promoção",
    title: "Pacote Especial",
    content: "COMBO BELEZA 💅💄\n\n[Procedimento 1] + [Procedimento 2]\n\nDe R$[X] por apenas R$[Y]!\n\nVálido só essa semana! Bora agendar? 📲",
  },

  // EDUCAÇÃO
  {
    niche: "educacao",
    category: "Dica de Estudo",
    title: "Técnica de Memorização",
    content: "Técnica simples pra memorizar melhor:\n\n📚 [técnica]\n\nFunciona demais! Testa e me conta depois 😊",
  },
  {
    niche: "educacao",
    category: "Dica de Estudo",
    title: "Organização",
    content: "Como organizo meus estudos:\n\n1️⃣ [passo 1]\n2️⃣ [passo 2]\n3️⃣ [passo 3]\n\nE você, como se organiza? Comenta! 👇",
  },
  {
    niche: "educacao",
    category: "Motivação",
    title: "Não Desista",
    content: "Parece difícil agora, eu sei.\n\nMas cada página estudada te aproxima do seu objetivo! 📖\n\nVocê consegue! Bora estudar? 💪",
  },
  {
    niche: "educacao",
    category: "Motivação",
    title: "Resultados",
    content: "Lembra quando você achava impossível?\n\nAgora olha onde você está! 🏆\n\nContinua, tá quase lá! 🚀",
  },
  {
    niche: "educacao",
    category: "Interação",
    title: "Dúvida do Dia",
    content: "DÚVIDA DO DIA 🤔\n\n[Pergunta sobre o conteúdo]\n\nQuem sabe a resposta? Comenta! 👇",
  },
  {
    niche: "educacao",
    category: "Interação",
    title: "Maior Dificuldade",
    content: "Qual sua maior dificuldade nos estudos?\n\n📚 Falta de tempo\n😴 Cansaço\n📱 Distrações\n🤯 Conteúdo difícil\n\nComenta pra eu ajudar! 💡",
  },
  {
    niche: "educacao",
    category: "Oferta",
    title: "Vagas Abertas",
    content: "🎓 VAGAS ABERTAS!\n\nTurma nova de [curso/matéria] começando!\n\n✅ [benefício 1]\n✅ [benefício 2]\n✅ [benefício 3]\n\nGaranta sua vaga! 📲",
  },
  {
    niche: "educacao",
    category: "Oferta",
    title: "Aula Experimental",
    content: "Quer conhecer meu método de ensino? 📚\n\nTô oferecendo AULA EXPERIMENTAL gratuita!\n\nChama no privado pra agendar 📲",
  },

  // GASTRONOMIA
  {
    niche: "gastronomia",
    category: "Novidade",
    title: "Novo no Cardápio",
    content: "NOVIDADE QUE VOCÊS PEDIRAM! 🍽️\n\n[Nome do prato/produto]\n\nQuem quer experimentar primeiro? 😋",
  },
  {
    niche: "gastronomia",
    category: "Novidade",
    title: "Sabor da Semana",
    content: "🌟 SABOR DA SEMANA 🌟\n\n[Descrição do produto]\n\nSó enquanto durar! Peça já 📲",
  },
  {
    niche: "gastronomia",
    category: "Bastidores",
    title: "Produção do Dia",
    content: "5h da manhã e a cozinha já tá a todo vapor! ☕👩‍🍳\n\nTudo fresquinho pra vocês!\n\nQuer garantir o seu? Encomende agora 📲",
  },
  {
    niche: "gastronomia",
    category: "Bastidores",
    title: "Ingredientes",
    content: "O segredo tá nos ingredientes! 🥄\n\n[Ingrediente especial] selecionado a dedo!\n\nFaz toda diferença no sabor! 😋",
  },
  {
    niche: "gastronomia",
    category: "Promoção",
    title: "Combo Especial",
    content: "🔥 COMBO DA SEMANA 🔥\n\n[Produto 1] + [Produto 2]\n\nDe R$[X] por R$[Y]!\n\nPeça pelo WhatsApp 📲",
  },
  {
    niche: "gastronomia",
    category: "Promoção",
    title: "Frete Grátis",
    content: "FRETE GRÁTIS hoje! 🚗💨\n\nPedido mínimo: R$[X]\n\nAproveita! Válido só hoje ⏰",
  },
  {
    niche: "gastronomia",
    category: "Interação",
    title: "Qual Seu Favorito",
    content: "Qual seu sabor favorito? 🤔\n\n1️⃣ [sabor 1]\n2️⃣ [sabor 2]\n3️⃣ [sabor 3]\n4️⃣ [sabor 4]\n\nComenta o número! 👇",
  },
  {
    niche: "gastronomia",
    category: "Interação",
    title: "Sugestão",
    content: "Tô pensando em lançar um sabor novo...\n\nQual vocês preferem?\n\n🍫 [opção 1]\n🍓 [opção 2]\n🥜 [opção 3]\n\nO mais votado vira realidade! 😋",
  },
];

const nicheConfig = {
  todos: { label: "Todos", icon: FileText },
  lojistas: { label: "Lojistas", icon: ShoppingBag },
  servicos: { label: "Serviços", icon: Briefcase },
  saude: { label: "Saúde", icon: Heart },
  direito: { label: "Direito", icon: Scale },
  beleza: { label: "Beleza", icon: Sparkles },
  educacao: { label: "Educação", icon: GraduationCap },
  gastronomia: { label: "Gastronomia", icon: UtensilsCrossed },
};

type NicheKey = keyof typeof nicheConfig;

// Map user niche from persona profile to template niche
const nicheMapping: Record<string, NicheKey[]> = {
  "Moda & Acessórios": ["lojistas"],
  "Beleza & Estética": ["beleza"],
  "Saúde & Bem-estar": ["saude"],
  "Educação & Cursos": ["educacao"],
  "Gastronomia": ["gastronomia"],
  "Tecnologia": ["servicos"],
  "Finanças": ["direito", "servicos"],
  "Imóveis": ["servicos"],
  "Serviços Profissionais": ["servicos"],
};

export default function GroupTemplates() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<NicheKey>("todos");
  const { profile, hasRaioX } = usePersonaProfile();
  const navigate = useNavigate();

  // Determine recommended niches based on user's persona profile
  const recommendedNiches: NicheKey[] = profile?.niche 
    ? nicheMapping[profile.niche] || []
    : [];

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isNicheRecommended = (niche: NicheKey): boolean => {
    return recommendedNiches.includes(niche);
  };

  const handleAdaptTemplate = (template: NicheTemplate) => {
    if (!hasRaioX) {
      toast.error("Configure seu Raio-X primeiro para adaptar templates");
      navigate("/raio-x");
      return;
    }

    const prompt = `Adapte este template de post para grupo WhatsApp:

---
**${template.title}** (${template.category})

${template.content}
---

Personalize para meu nicho e público-alvo usando as informações do meu Raio-X.
Mantenha o formato curto (máx 4 linhas) e inclua CTA de interação.
Substitua os placeholders como [nicho], [público-alvo], [produto], [benefício] etc com informações reais do meu negócio.`;

    navigate(`/grupo/conteudo?adaptar=${encodeURIComponent(prompt)}`);
  };

  const filteredTemplates = selectedNiche === "todos"
    ? templates.filter(t => t.niche === "todos")
    : templates.filter(t => t.niche === selectedNiche);

  // Agrupa por categoria
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, NicheTemplate[]>);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/grupo">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Templates de Posts
          </h1>
          <p className="text-muted-foreground">
            Copie e adapte para o seu negócio
          </p>
        </div>
      </div>

      {/* Niche Tabs */}
      <Tabs value={selectedNiche} onValueChange={(v) => setSelectedNiche(v as NicheKey)}>
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="inline-flex h-auto gap-1 p-1 w-max min-w-full">
            {Object.entries(nicheConfig).map(([key, config]) => {
              const Icon = config.icon;
              const isRecommended = isNicheRecommended(key as NicheKey);
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex items-center gap-1.5 px-3 py-2 relative"
                >
                  <Icon className="h-4 w-4" />
                  <span>{config.label}</span>
                  {isRecommended && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 ml-1" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        {/* Recommendation Banner */}
        {recommendedNiches.length > 0 && selectedNiche === "todos" && (
          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-foreground font-medium">
                Baseado no seu Raio-X ({profile?.niche}), recomendamos:
              </span>
              <div className="flex gap-2 flex-wrap">
                {recommendedNiches.map((niche) => (
                  <Button
                    key={niche}
                    variant="secondary"
                    size="sm"
                    className="h-7"
                    onClick={() => setSelectedNiche(niche)}
                  >
                    {nicheConfig[niche].label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {Object.keys(nicheConfig).map((nicheKey) => (
          <TabsContent key={nicheKey} value={nicheKey} className="space-y-6 mt-6">
            {/* Show recommendation banner when viewing a recommended niche */}
            {isNicheRecommended(nicheKey as NicheKey) && (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                <span className="text-foreground">
                  <strong>Recomendado para você!</strong> Estes templates combinam com seu nicho: {profile?.niche}
                </span>
              </div>
            )}

            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <div key={category} className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryTemplates.map((template, tempIndex) => {
                    const templateId = `${nicheKey}-${category}-${tempIndex}`;
                    const isTemplateRecommended = isNicheRecommended(template.niche as NicheKey);
                    return (
                      <Card 
                        key={tempIndex} 
                        className={`group transition-all duration-300 ${
                          isTemplateRecommended 
                            ? "border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50" 
                            : "hover:border-accent/50"
                        }`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{template.title}</CardTitle>
                            {isTemplateRecommended && (
                              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs gap-1">
                                <Star className="h-3 w-3 fill-current" />
                                Para você
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans bg-secondary/50 rounded-lg p-3">
                            {template.content}
                          </pre>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleCopy(template.content, templateId)}
                            >
                              {copiedId === templateId ? (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Copiado!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copiar
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleAdaptTemplate(template)}
                              disabled={!hasRaioX}
                              title={!hasRaioX ? "Configure seu Raio-X primeiro" : "Adaptar com IA"}
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Adaptar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}

            {Object.keys(groupedTemplates).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum template encontrado para este nicho.
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

import { ArrowLeft, Copy, Check, Sparkles } from "lucide-react";
import { MessageCircleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { usePersonaProfile } from "@/hooks/usePersonaProfile";

interface Script {
  id: string;
  category: string;
  title: string;
  description: string;
  messages: string[];
}

const scripts: Script[] = [
  {
    id: "1",
    category: "Prospecção",
    title: "Primeiro Contato",
    description: "Para iniciar conversa com lead frio",
    messages: [
      "Oi [Nome]! 👋 Tudo bem?",
      "Vi que você [contexto - ex: curtiu nosso post/visitou nosso site] e queria te conhecer melhor!",
      "Posso te fazer uma pergunta rápida? 😊"
    ]
  },
  {
    id: "2", 
    category: "Prospecção",
    title: "Retomada de Contato",
    description: "Para leads que não responderam",
    messages: [
      "Oi [Nome]! 👋",
      "Percebi que não conseguimos conversar da última vez...",
      "Ainda faz sentido pra você [benefício do produto/serviço]?",
      "Se sim, posso te mostrar algo especial que preparei 🎁"
    ]
  },
  {
    id: "3",
    category: "Qualificação",
    title: "Descoberta de Necessidades",
    description: "Para entender o que o cliente precisa",
    messages: [
      "Que legal que você tem interesse! 🎉",
      "Me conta: qual é o seu maior desafio hoje em relação a [área do produto]?",
      "Pergunto porque temos soluções diferentes e quero te indicar a melhor pra você!"
    ]
  },
  {
    id: "4",
    category: "Qualificação", 
    title: "Verificação de Orçamento",
    description: "Para alinhar expectativas de investimento",
    messages: [
      "Antes de te mostrar as opções...",
      "Você já tem uma ideia do quanto pretende investir em [solução]?",
      "Assim consigo te apresentar algo que realmente faça sentido! 💡"
    ]
  },
  {
    id: "5",
    category: "Apresentação",
    title: "Apresentação da Oferta",
    description: "Para mostrar seu produto/serviço",
    messages: [
      "Baseado no que você me contou, tenho a solução perfeita! ✨",
      "[Descreva brevemente a solução]",
      "O diferencial é que [benefício principal]",
      "Isso resolve exatamente o problema que você mencionou! Faz sentido pra você?"
    ]
  },
  {
    id: "6",
    category: "Apresentação",
    title: "Envio de Proposta",
    description: "Para formalizar a oferta",
    messages: [
      "Preparei uma proposta especial pra você! 📋",
      "[Anexar proposta/link]",
      "Resumindo: [principais benefícios em 2-3 itens]",
      "Investimento: R$ [valor]",
      "Alguma dúvida sobre a proposta? Estou aqui! 😊"
    ]
  },
  {
    id: "7",
    category: "Objeções",
    title: "Objeção de Preço",
    description: "Quando dizem que está caro",
    messages: [
      "Entendo sua preocupação com o investimento! 💭",
      "Mas me deixa te mostrar por outro ângulo...",
      "Com [solução], você vai [resultado específico]",
      "Quanto isso representa em [economia/ganho] por mês?",
      "Na verdade, você está investindo R$ [valor mensal] pra ter [resultado]. Vale a pena, né? 😉"
    ]
  },
  {
    id: "8",
    category: "Objeções",
    title: "Preciso Pensar",
    description: "Quando pedem tempo para decidir",
    messages: [
      "Claro! É uma decisão importante mesmo 🤔",
      "O que exatamente você precisa avaliar melhor?",
      "Pergunto pra poder te ajudar com mais informações, se precisar!",
      "E só pra te avisar: essa condição especial é válida até [data] 📅"
    ]
  },
  {
    id: "9",
    category: "Fechamento",
    title: "Fechamento Direto",
    description: "Para concluir a venda",
    messages: [
      "Então, [Nome], vamos fechar? 🚀",
      "Pra gente começar, preciso só de [informações necessárias]",
      "Assim que confirmar, você já recebe [benefício imediato]!",
      "Posso enviar o link de pagamento? 💳"
    ]
  },
  {
    id: "10",
    category: "Fechamento",
    title: "Urgência/Escassez",
    description: "Para acelerar a decisão",
    messages: [
      "[Nome], tenho uma notícia! ⚡",
      "Essa condição especial que te ofereci termina [hoje/amanhã]",
      "Depois disso, o valor volta a ser R$ [valor cheio]",
      "Consegue decidir agora pra garantir? 🎯"
    ]
  },
  {
    id: "11",
    category: "Pós-Venda",
    title: "Boas-vindas",
    description: "Para novos clientes",
    messages: [
      "🎉 Seja bem-vindo(a) à [empresa]!",
      "Estou muito feliz que você decidiu [benefício]!",
      "Seus próximos passos são: [instruções claras]",
      "Qualquer dúvida, é só me chamar aqui! Estou 100% disponível pra você 💜"
    ]
  },
  {
    id: "12",
    category: "Pós-Venda",
    title: "Pedido de Indicação",
    description: "Para conseguir referências",
    messages: [
      "Oi [Nome]! Tudo bem? 😊",
      "Vi que você já está há [tempo] com a gente e queria saber: está gostando?",
      "Se sim, tenho uma pergunta: conhece alguém que também poderia se beneficiar de [solução]?",
      "Se me indicar, tenho um presente especial pra você! 🎁"
    ]
  }
];

const categories = ["Todos", "Prospecção", "Qualificação", "Apresentação", "Objeções", "Fechamento", "Pós-Venda"];

export default function WhatsAppStrategies() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { hasRaioX } = usePersonaProfile();

  const filteredScripts = selectedCategory === "Todos" 
    ? scripts 
    : scripts.filter(s => s.category === selectedCategory);

  const copyScript = async (script: Script) => {
    const text = script.messages.join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopiedId(script.id);
    toast.success("Script copiado para a área de transferência!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAdaptScript = (script: Script) => {
    if (!hasRaioX) {
      toast.error("Configure seu Raio-X primeiro para adaptar scripts");
      navigate("/persona");
      return;
    }

    const scriptContent = script.messages.join("\n");
    const prompt = `Adapte este script de vendas WhatsApp para meu negócio:

---
**${script.title}** (${script.category})

${scriptContent}
---

Use as informações do meu Raio-X (nicho, produto, dor principal, diferencial, transformação) para:
1. Substituir os placeholders [Nome], [produto], [benefício] etc com exemplos reais do meu negócio
2. Ajustar o tom de comunicação para o meu público-alvo
3. Incluir gatilhos mentais adequados ao meu público`;

    navigate(`/privado/estrategias?adaptar=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
          <MessageCircleIcon />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">Estratégias WhatsApp</h1>
          <p className="text-xs text-muted-foreground">
            Scripts prontos para suas conversas de vendas
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category 
              ? "gradient-primary glow-pink text-primary-foreground border-0" 
              : "border-border hover:bg-muted"
            }
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Scripts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredScripts.map((script) => (
          <div
            key={script.id}
            className="card-main rounded-xl p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-primary font-medium">{script.category}</span>
                <h3 className="font-semibold text-foreground">{script.title}</h3>
                <p className="text-sm text-muted-foreground">{script.description}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              {script.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className="bg-secondary/50 rounded-lg px-3 py-2 text-sm text-foreground"
                >
                  {msg}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyScript(script)}
                className="flex-1"
              >
                {copiedId === script.id ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAdaptScript(script)}
                disabled={!hasRaioX}
                title={!hasRaioX ? "Configure seu Raio-X primeiro" : "Adaptar com IA"}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Adaptar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <p className="text-muted-foreground mb-4">
          Precisa de algo mais personalizado?
        </p>
        <Button
          onClick={() => navigate("/privado/estrategias")}
          className="gradient-primary glow-pink text-primary-foreground"
        >
          Criar estratégia personalizada
        </Button>
      </div>
    </div>
  );
}

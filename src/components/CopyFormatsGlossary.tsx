import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CopyFormat {
  id: string;
  name: string;
  emoji: string;
  shortDescription: string;
  fullDescription: string;
  structure: string[];
  whenToUse: string;
  example: string;
  consciousnessLevel: string;
}

const COPY_FORMATS: CopyFormat[] = [
  {
    id: "pas",
    name: "PAS - Problema, Agitação, Solução",
    emoji: "🔥",
    shortDescription: "Desperta a dor antes de apresentar a solução",
    fullDescription: "Um dos formatos mais poderosos para leads que ainda não perceberam a urgência do problema. Você primeiro identifica a dor, depois agita mostrando as consequências, e só então apresenta sua solução.",
    structure: [
      "Problema: Identifique a dor/frustração do lead",
      "Agitação: Mostre as consequências de não resolver",
      "Solução: Apresente seu produto/serviço como a resposta"
    ],
    whenToUse: "Quando o lead está no nível 1-2 de consciência (inconsciente ou consciente do problema)",
    example: "Cansada de perder vendas no Instagram? (P) Cada cliente que some é dinheiro deixado na mesa, e seus concorrentes agradecem. (A) Com meu método de follow-up, você transforma 'vou pensar' em 'pode enviar o pix'. (S)",
    consciousnessLevel: "Níveis 1-2"
  },
  {
    id: "bab",
    name: "BAB - Before, After, Bridge",
    emoji: "🌉",
    shortDescription: "Mostra a transformação de forma visual",
    fullDescription: "Pinta o cenário atual (ruim), depois o cenário desejado (bom), e conecta os dois com sua solução. Perfeito para criar desejo e mostrar possibilidades.",
    structure: [
      "Before (Antes): Descreva a situação atual/problema",
      "After (Depois): Mostre como será após a transformação",
      "Bridge (Ponte): Apresente como chegar lá"
    ],
    whenToUse: "Quando o lead conhece o problema mas precisa visualizar a transformação",
    example: "Antes: Você responde cliente por cliente, sem padrão, perdendo vendas. Depois: Você tem scripts prontos, sabe exatamente o que dizer, e fecha 3x mais. A ponte? Meus templates de Instagram testados.",
    consciousnessLevel: "Níveis 2-3"
  },
  {
    id: "aida",
    name: "AIDA - Atenção, Interesse, Desejo, Ação",
    emoji: "🎯",
    shortDescription: "Jornada completa do desconhecido ao comprador",
    fullDescription: "O clássico que funciona. Captura atenção, gera interesse, cria desejo e finaliza com uma chamada para ação clara.",
    structure: [
      "Atenção: Gancho forte que para o scroll",
      "Interesse: Informação relevante que mantém lendo",
      "Desejo: Benefícios e transformação",
      "Ação: CTA claro e urgente"
    ],
    whenToUse: "Para posts de grupo e conteúdos mais longos",
    example: "🚨 97% das vendas no Instagram morrem por UM erro (A). Descobri isso analisando 500+ conversas de lojistas (I). Imagine nunca mais ouvir 'vou pensar' (D). Quer ver os 3 erros? Comenta EU QUERO (A).",
    consciousnessLevel: "Níveis 1-4"
  },
  {
    id: "fab",
    name: "FAB - Features, Advantages, Benefits",
    emoji: "💎",
    shortDescription: "Transforma características em benefícios tangíveis",
    fullDescription: "Começa com o que seu produto TEM, mostra a vantagem técnica, e termina com o benefício emocional/prático para o cliente.",
    structure: [
      "Feature (Característica): O que é/tem",
      "Advantage (Vantagem): Por que isso é bom tecnicamente",
      "Benefit (Benefício): O que isso significa para o cliente"
    ],
    whenToUse: "Quando o lead já conhece sua solução e precisa de justificativas racionais",
    example: "Meu curso tem 47 scripts prontos (F). Você não precisa pensar no que escrever (A). Isso significa mais tempo com sua família e mais vendas no automático (B).",
    consciousnessLevel: "Níveis 3-4"
  },
  {
    id: "prova-social",
    name: "Prova Social",
    emoji: "⭐",
    shortDescription: "Usa resultados de outros para gerar confiança",
    fullDescription: "Mostra que outras pessoas já obtiveram resultados. Elimina a sensação de 'serei o primeiro a testar' e cria segurança na decisão.",
    structure: [
      "Contexto: Quem era a pessoa antes",
      "Resultado: O que ela conquistou",
      "Prova: Screenshot, depoimento, número",
      "Conexão: Como você pode ter o mesmo"
    ],
    whenToUse: "Para leads no nível 4 que precisam de segurança para decidir",
    example: "A Maria vendia R$3k/mês no Instagram. Depois de aplicar meu método de follow-up, fechou R$12k no mês seguinte. [print do depoimento] Quer saber como ela fez?",
    consciousnessLevel: "Nível 4"
  },
  {
    id: "escassez",
    name: "Escassez e Urgência",
    emoji: "⏰",
    shortDescription: "Cria pressão temporal para ação imediata",
    fullDescription: "Usa gatilhos de tempo limitado, vagas limitadas ou condição especial para acelerar a decisão. Deve ser usado com ética e veracidade.",
    structure: [
      "Oferta: O que está disponível",
      "Limitação: Por que é escasso (tempo, quantidade, condição)",
      "Consequência: O que perde se não agir",
      "CTA: Ação imediata"
    ],
    whenToUse: "Para leads no nível 5 (prontos para comprar) que só precisam de um empurrão",
    example: "Última chance: o bônus de templates expira à meia-noite. Depois, só o curso normal. Quem garantir agora leva os 47 scripts de presente.",
    consciousnessLevel: "Nível 5"
  },
  {
    id: "storytelling",
    name: "Storytelling",
    emoji: "📖",
    shortDescription: "Conecta através de histórias e narrativas",
    fullDescription: "Usa o poder das histórias para criar conexão emocional. Histórias são processadas de forma diferente pelo cérebro e criam empatia.",
    structure: [
      "Herói: Pessoa comum (você ou cliente)",
      "Problema: Desafio enfrentado",
      "Jornada: O que tentou, erros, descobertas",
      "Transformação: Resultado alcançado",
      "Moral: Lição aplicável ao lead"
    ],
    whenToUse: "Para criar conexão profunda e humanizar sua marca",
    example: "Há 2 anos, eu respondia cada cliente como robô. Copiava e colava. Resultado? Taxa de conversão de 2%. Até que uma cliente me disse: 'você parece uma máquina'. Doeu. Mudei tudo. Hoje? 23% de conversão.",
    consciousnessLevel: "Todos os níveis"
  },
  {
    id: "quebra-objecao",
    name: "Quebra de Objeção",
    emoji: "🛡️",
    shortDescription: "Antecipa e neutraliza resistências comuns",
    fullDescription: "Identifica a objeção mais comum e a responde antes que o lead verbalize. Remove barreiras mentais para a compra.",
    structure: [
      "Objeção: Reconheça o medo/dúvida",
      "Validação: Mostre que entende",
      "Resposta: Dê a contra-argumentação",
      "Prova: Evidência que suporta",
      "Reversão: Transforme em razão para comprar"
    ],
    whenToUse: "Quando você sabe qual objeção está travando a venda",
    example: "'Mas será que funciona pro meu nicho?' Olha, eu também achava que moda era diferente. Até que a Carla do @modafeminina aplicou e triplicou as vendas. Cada nicho tem sua adaptação, e eu mostro exatamente como fazer.",
    consciousnessLevel: "Níveis 3-5"
  },
  {
    id: "conversa-guiada",
    name: "Instagram Copy (Conversa Guiada)",
    emoji: "💬",
    shortDescription: "Conduz o lead com perguntas estratégicas",
    fullDescription: "Formato específico para Instagram que usa perguntas para manter o lead engajado e guiá-lo naturalmente até a oferta, sem parecer vendedor.",
    structure: [
      "Abertura: Pergunta que gera 'sim' fácil",
      "Diagnóstico: Perguntas que revelam a dor",
      "Agitação sutil: Comentário que amplifica",
      "Ponte: Conexão com sua solução",
      "Micro-compromisso: Pergunta que avança"
    ],
    whenToUse: "Para conversas 1:1 no Instagram em qualquer estágio",
    example: "Oi [nome]! Vi que você curtiu o post sobre scripts de vendas 😊 Você já usa algum modelo de mensagem pronta hoje? [espera resposta] E qual sua maior dificuldade quando o cliente diz 'vou pensar'?",
    consciousnessLevel: "Todos os níveis"
  },
  {
    id: "curiosidade",
    name: "Gancho de Curiosidade",
    emoji: "🔮",
    shortDescription: "Cria mistério que obriga a continuar lendo",
    fullDescription: "Abre um loop mental que só fecha quando a pessoa continua lendo ou responde. Muito eficaz para stories e posts de grupo.",
    structure: [
      "Gancho: Afirmação intrigante ou incompleta",
      "Tensão: Aumente a curiosidade",
      "Pista: Dê um fragmento da resposta",
      "CTA: Como descobrir o resto"
    ],
    whenToUse: "Para posts de grupo e stories que precisam de engajamento",
    example: "Descobri o erro que faz 83% das vendas morrerem antes do 'oi'. Não é o preço. Não é o produto. É algo que você faz nos primeiros 10 segundos... Quer saber? 👇",
    consciousnessLevel: "Níveis 1-3"
  }
];

interface CopyFormatsGlossaryProps {
  trigger?: React.ReactNode;
}

export function CopyFormatsGlossary({ trigger }: CopyFormatsGlossaryProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Glossário de Copy</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Glossário de Formatos de Copy
          </SheetTitle>
          <SheetDescription>
            Referência rápida dos formatos de copy usados pela mentora. Clique em cada formato para ver detalhes.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)] pr-4">
          <Accordion type="single" collapsible className="w-full">
            {COPY_FORMATS.map((format) => (
              <AccordionItem key={format.id} value={format.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-lg">{format.emoji}</span>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm">{format.name}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {format.shortDescription}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <p className="text-sm text-muted-foreground">
                    {format.fullDescription}
                  </p>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-primary">Estrutura</h4>
                    <ul className="space-y-1">
                      {format.structure.map((step, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-primary font-bold">{index + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-primary">Quando usar</h4>
                    <p className="text-xs text-muted-foreground">{format.whenToUse}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {format.consciousnessLevel}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-primary">Exemplo</h4>
                    <div className="bg-muted/50 rounded-lg p-3 text-xs italic text-muted-foreground border-l-2 border-primary">
                      "{format.example}"
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Níveis de Consciência Reference */}
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              🧠 Níveis de Consciência do Lead
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex gap-2">
                <Badge variant="outline" className="w-16 justify-center">Nível 1</Badge>
                <span className="text-muted-foreground">Inconsciente - Não sabe que tem o problema</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="w-16 justify-center">Nível 2</Badge>
                <span className="text-muted-foreground">Consciente do Problema - Sabe da dor, não da solução</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="w-16 justify-center">Nível 3</Badge>
                <span className="text-muted-foreground">Consciente da Solução - Busca opções no mercado</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="w-16 justify-center">Nível 4</Badge>
                <span className="text-muted-foreground">Consciente do Produto - Conhece você, avalia</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="w-16 justify-center">Nível 5</Badge>
                <span className="text-muted-foreground">Mais Consciente - Pronto para comprar</span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

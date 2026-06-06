import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, CheckCircle2, Eye, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { markMissionPending } from "@/hooks/useMissionAutoComplete";
import { usePersonaContext } from "@/contexts/PersonaContext";
import confetti from "canvas-confetti";
import { scopedLocal } from "@/lib/userScopedKey";

interface Mission {
  id: string;
  title: string;
  content: string | null;
  activity_type: string | null;
  duration_minutes: number;
  completed: boolean;
}

interface MissionChecklistProps {
  module: {
    id: string;
    title: string;
    description: string | null;
    icon: string | null;
  };
  missions: Mission[];
  progressPercent: number;
  onToggle: (lessonId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const ACTIVITY_CONFIG: Record<string, { route: string; label: string }> = {
  compromisso: { route: "/compromisso", label: "Compromisso Estratégico" },
  persona: { route: "/persona", label: "Raio-X Persona" },
  calculator: { route: "/calculadora", label: "Calculadora de Preços" },
  calculadora: { route: "/calculadora", label: "Calculadora de Preços" },
  mentor: { route: "/mentora", label: "Mentora Gi" },
  content: { route: "/mentora", label: "Conteúdo / Copy" },
  photo: { route: "/ensaio-fotografico", label: "PhotoBoss" },
  foto: { route: "/ensaio-fotografico", label: "PhotoBoss" },
  instagram_private: { route: "/mentora", label: "Mentoria Elevar" },
  instagram_group: { route: "/grupo", label: "Instagram Grupo" },
  financeiro: { route: "/financeiro", label: "Central Financeira" },
  metas: { route: "/metas-elevar", label: "Metas Elevar" },
  trafego: { route: "/trafego-pago", label: "Tráfego Pago" },
  instapro: { route: "/aprendizado?tab=instapro", label: "Insta PRO" },
};

const MENTOR_PROMPTS: Record<string, string> = {
  "Listar 5 tarefas delegáveis": "Me ajude a listar 5 tarefas operacionais que eu executo no meu negócio mas que poderiam ser delegadas. Para cada tarefa, sugira como delegar (para quem ou qual ferramenta).",
  "Atualizar Instagram completamente": "Me ajude a refazer meu perfil do Instagram com posicionamento premium: bio estratégica, destaques, e um plano de conteúdo para feed e stories.",
  "Ajustar experiência do cliente": "Me ajude a mapear a jornada do meu cliente (físico e digital) e identificar pontos de encantamento e melhoria na experiência.",
  "Criar calendário comercial padrão": "Crie um calendário comercial semanal para mim com: 3 posts estratégicos por dia, 12 stories estruturados, e sugestão de live semanal.",
  "Delegar 1 função humana": "Me ajude a identificar a melhor tarefa operacional para delegar a um membro da equipe e como estruturar essa delegação com clareza.",
  "Delegar 1 função tecnológica": "Me ajude a identificar um processo no meu negócio que pode ser automatizado com tecnologia. Sugira ferramentas e como implementar.",
  "Criar rotina estratégica semanal": "Me ajude a criar uma agenda semanal estratégica de líder: blocos para reuniões, análise de métricas, planejamento e execução.",
  "Definir meta trimestral progressiva": "Me ajude a estruturar uma projeção de crescimento para dobrar o faturamento: 30K → 50K → 70K e além. Quais ações concretas para cada fase?",
  "Organizar projeção de crescimento": "Me ajude a planejar os investimentos necessários e estratégia de tráfego para atingir minha meta de escala.",
  "Ajustar campanha ativa": "Me ajude a analisar minha campanha atual e identificar ajustes estratégicos baseados em dados para melhorar resultados.",
  "Documentar aprendizados": "Me ajude a organizar os principais aprendizados do meu último mês de vendas: o que funcionou, o que precisa melhorar, e próximos passos.",
  "Definir linha premium": "Me ajude a criar ou destacar minha linha premium de produtos/serviços com diferenciação competitiva real e fornecedores estratégicos.",
  "Estruturar campanha diferenciada": "Me ajude a planejar uma campanha que comunique minha diferenciação competitiva no mercado, com posicionamento acima da média.",
  "Criar checklist de processos": "Me ajude a documentar os processos-chave do meu negócio em um checklist com indicadores de controle e rotina de liderança.",
  "Testar ausência estratégica": "Me ajude a planejar um teste de ausência: como simular 1 dia sem operar e avaliar o que funciona sem mim.",
  "Entregar Plano Estratégico ELEVAR 180 dias": "Me ajude a construir meu Plano Estratégico ELEVAR de 180 dias para dobrar o faturamento: time ideal, etapas, indicadores e visão de longo prazo.",
};

// Prompts contextuais para missões que redirecionam a ferramentas específicas
// mas também podem abrir a Mentora Gi com contexto pré-carregado
const TOOL_CONTEXT_PROMPTS: Record<string, string> = {
  "Organizar números reais do negócio": "Preciso organizar os números reais do meu negócio: faturamento atual, custos fixos e variáveis, pró-labore, margem de lucro real. Me ajude a mapear tudo isso de forma estratégica para entender minha saúde financeira e identificar onde posso melhorar.",
  "Ajustar posicionamento nas redes": "Me ajude a reposicionar meu perfil nas redes sociais de forma premium. Quero uma bio estratégica, destaques organizados, identidade visual coerente e um plano de conteúdo que transmita autoridade no meu nicho.",
  "Ajustar preços estrategicamente": "Me ajude a revisar minha estratégia de preços: analisar margem real, comparar com mercado, definir precificação premium e criar uma escada de valor com produtos de entrada, intermediário e premium.",
  "Definir meta trimestral progressiva": "Me ajude a definir metas trimestrais progressivas e realistas para dobrar meu faturamento. Quero uma projeção mês a mês com ações concretas para cada fase de crescimento.",
  "Organizar projeção de crescimento": "Me ajude a criar uma projeção financeira de crescimento: quanto preciso investir em tráfego, equipe e estrutura para escalar. Inclua cenários otimista, realista e conservador.",
  "Ajustar campanha ativa": "Me ajude a analisar minha campanha de tráfego pago atual: métricas de performance (CPC, CPL, ROAS), criativos que estão funcionando, e ajustes estratégicos para melhorar resultados.",
  "Definir linha premium": "Me ajude a estruturar minha linha premium de produtos/serviços: precificação estratégica, diferenciação competitiva, posicionamento de marca e comunicação de valor percebido.",
  "Estruturar campanha diferenciada": "Me ajude a criar uma campanha de tráfego pago diferenciada que destaque meu posicionamento único no mercado. Quero copy de alta conversão, segmentação estratégica e criativos que se destaquem da concorrência.",
};

const fireSmallConfetti = () => {
  confetti({
    particleCount: 60,
    spread: 55,
    origin: { y: 0.7 },
    colors: ['#10b981', '#6366f1', '#f59e0b'],
  });
};

const fireBigConfetti = () => {
  const duration = 2000;
  const end = Date.now() + duration;
  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899'],
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899'],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
};

export default function MissionChecklist({
  module, missions, progressPercent, onToggle, isExpanded, onToggleExpand
}: MissionChecklistProps) {
  const navigate = useNavigate();
  const completedCount = missions.filter(m => m.completed).length;
  
  let personaContext: ReturnType<typeof usePersonaContext> | null = null;
  try {
    personaContext = usePersonaContext();
  } catch {
    // PersonaProvider not mounted yet — safe fallback
  }

  const handleToggleWithConfetti = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (mission && !mission.completed) {
      fireSmallConfetti();
    }
    onToggle(missionId);
  };

  const handleExecuteMission = (mission: Mission) => {
    const config = mission.activity_type ? ACTIVITY_CONFIG[mission.activity_type] : null;
    if (!config || !config.route) return;

    // Auto-mark as completed when executing
    if (!mission.completed) {
      markMissionPending(mission.id);
      onToggle(mission.id);
    }

    if (mission.activity_type === "mentor" || mission.activity_type === "content") {
      let prompt = MENTOR_PROMPTS[mission.title] || `Me ajude com a missão: ${mission.title}. ${mission.content || ""}`;
      if (personaContext?.enrichPrompt) {
        prompt = personaContext.enrichPrompt(prompt);
      }
      navigate(`/mentora?prompt=${encodeURIComponent(prompt)}`);
    } else {
      // Store contextual prompt for tool missions so user can ask Mentora for help
      const contextPrompt = TOOL_CONTEXT_PROMPTS[mission.title];
      if (contextPrompt) {
        sessionStorage.setItem("elevar_mission_context", JSON.stringify({
          missionTitle: mission.title,
          prompt: personaContext?.enrichPrompt ? personaContext.enrichPrompt(contextPrompt) : contextPrompt,
          route: config.route,
        }));
      }
      navigate(config.route);
    }
  };

  const handleAskMentora = (mission: Mission) => {
    const contextPrompt = TOOL_CONTEXT_PROMPTS[mission.title] || MENTOR_PROMPTS[mission.title];
    if (!contextPrompt) return;
    let prompt = personaContext?.enrichPrompt ? personaContext.enrichPrompt(contextPrompt) : contextPrompt;
    navigate(`/mentora?prompt=${encodeURIComponent(prompt)}`);
  };

  const handleViewMission = (mission: Mission) => {
    const config = mission.activity_type ? ACTIVITY_CONFIG[mission.activity_type] : null;
    if (!config || !config.route) return;
    // Navigate without marking as pending — just view
    navigate(config.route);
  };

  return (
    <Card className={`transition-all ${isExpanded ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"}`}>
      <CardHeader
        className="pb-2 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{module.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-sm">{module.title}</CardTitle>
              {progressPercent === 100 && (
                <Badge className="bg-emerald-500/20 text-emerald-600 text-[10px]">✅ Completo</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{module.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={progressPercent} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {completedCount}/{missions.length} missões
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-2">
          {/* Persona context hint */}
          {personaContext?.hasProfile && (
            <div className="p-2 rounded-md bg-primary/5 border border-primary/10 mb-2">
              <p className="text-[10px] text-primary font-medium">
                🎯 Persona ativa: {personaContext.formData.business_name || personaContext.formData.niche || "Configurada"} 
                {personaContext.hasRaioX && " • Raio-X disponível"}
              </p>
            </div>
          )}

          {missions.map(mission => {
            const config = mission.activity_type ? ACTIVITY_CONFIG[mission.activity_type] : null;
            const hasRoute = config && config.route;

            return (
              <div
                key={mission.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  mission.completed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/30 border-border"
                }`}
              >
                <Checkbox
                  checked={mission.completed}
                  onCheckedChange={() => handleToggleWithConfetti(mission.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${mission.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {mission.title}
                  </p>
                  {mission.content && (
                    <p className="text-xs text-muted-foreground mt-1">{mission.content}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {config && (
                      <Badge variant="secondary" className="text-[10px]">
                        {config.label}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">⏱ {mission.duration_minutes}min</span>
                  </div>
                </div>
                {hasRoute && (
                  <div className="flex flex-col gap-1 shrink-0">
                    {mission.completed ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs"
                        onClick={(e) => { e.stopPropagation(); handleViewMission(mission); }}
                      >
                        <Eye className="h-3 w-3" /> Visualizar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1 text-xs"
                        onClick={(e) => { e.stopPropagation(); handleExecuteMission(mission); }}
                      >
                        Executar <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    {TOOL_CONTEXT_PROMPTS[mission.title] && mission.activity_type !== "mentor" && mission.activity_type !== "content" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-[10px] h-6"
                        onClick={(e) => { e.stopPropagation(); handleAskMentora(mission); }}
                      >
                        <MessageCircle className="h-3 w-3" /> Pedir ajuda à Gi
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Finalizar Encontro */}
          {progressPercent === 100 ? (
            <div className="mt-3 p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-center space-y-2">
              <p className="text-sm font-semibold text-emerald-600">🎉 Todas as missões deste encontro foram concluídas!</p>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  scopedLocal.set(`elevar_completed_${module.id}`, new Date().toISOString());
                  fireBigConfetti();
                  toast.success(`🎉 Encontro "${module.title}" finalizado com sucesso!`, {
                    description: "Parabéns! Continue para o próximo encontro do Método ELEVAR. 🚀",
                    duration: 5000,
                  });
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar Encontro
              </Button>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground text-center pt-2">
              Complete todas as missões para finalizar este encontro.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

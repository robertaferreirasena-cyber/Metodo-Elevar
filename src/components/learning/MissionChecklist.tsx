import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink } from "lucide-react";
import { markMissionPending } from "@/hooks/useMissionAutoComplete";
import { usePersonaContext } from "@/contexts/PersonaContext";

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
  compromisso: { route: "", label: "Compromisso" },
  persona: { route: "/persona", label: "Raio-X Persona" },
  calculator: { route: "/calculadora", label: "Calculadora de Preços" },
  mentor: { route: "/mentora", label: "Mentora Gi" },
  content: { route: "/mentora", label: "Conteúdo / Copy" },
  photo: { route: "/ensaio-fotografico", label: "PhotoBoss" },
  whatsapp_private: { route: "/privado", label: "WhatsApp Privado" },
  whatsapp_group: { route: "/grupo", label: "WhatsApp Grupo" },
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

  const handleExecuteMission = (mission: Mission) => {
    const config = mission.activity_type ? ACTIVITY_CONFIG[mission.activity_type] : null;
    if (!config || !config.route) return;

    // Auto-mark as completed when executing
    if (!mission.completed) {
      markMissionPending(mission.id);
      onToggle(mission.id);
    }

    if (mission.activity_type === "mentor" || config.route === "/mentora") {
      let prompt = MENTOR_PROMPTS[mission.title] || `Me ajude com a missão: ${mission.title}. ${mission.content || ""}`;
      // Enrich with persona data
      if (personaContext?.enrichPrompt) {
        prompt = personaContext.enrichPrompt(prompt);
      }
      navigate(`/mentora?prompt=${encodeURIComponent(prompt)}`);
    } else {
      navigate(config.route);
    }
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
                  onCheckedChange={() => onToggle(mission.id)}
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
                  <Button
                    size="sm"
                    variant={mission.completed ? "ghost" : "default"}
                    className="shrink-0 gap-1 text-xs"
                    onClick={(e) => { e.stopPropagation(); handleExecuteMission(mission); }}
                  >
                    Executar <ExternalLink className="h-3 w-3" />
                  </Button>
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
                  localStorage.setItem(`elevar_completed_${module.id}`, new Date().toISOString());
                  toast.success(`🎉 Encontro "${module.title}" finalizado com sucesso!`, {
                    description: "Parabéns! Continue para o próximo encontro do Método ELEVAR.",
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

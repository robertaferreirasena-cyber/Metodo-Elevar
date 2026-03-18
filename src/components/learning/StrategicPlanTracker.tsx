import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin, CheckCircle2 } from "lucide-react";

interface TrackerModule {
  id: string;
  title: string;
  icon: string | null;
  position: number;
}

interface StrategicPlanTrackerProps {
  modules: TrackerModule[];
  getModuleProgress: (id: string) => number;
  currentModuleId: string | null;
  nextMission: { lesson: { title: string }; module: { title: string } | null } | null;
  totalProgress: number;
  onGoToCurrentModule: () => void;
}

export default function StrategicPlanTracker({
  modules,
  getModuleProgress,
  currentModuleId,
  nextMission,
  totalProgress,
  onGoToCurrentModule,
}: StrategicPlanTrackerProps) {
  const currentModule = modules.find(m => m.id === currentModuleId);
  const currentIndex = currentModule ? modules.indexOf(currentModule) : 0;
  const pendingModules = modules.filter(m => getModuleProgress(m.id) < 100);

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
      <CardContent className="py-4 px-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Plano Estratégico ELEVAR</span>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {totalProgress}% concluído
          </Badge>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {modules.map((mod, i) => {
            const prog = getModuleProgress(mod.id);
            const isCurrent = mod.id === currentModuleId;
            const isDone = prog === 100;

            return (
              <div key={mod.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold transition-all shrink-0 ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30 scale-110"
                        : "bg-muted text-muted-foreground"
                  }`}
                  title={mod.title}
                >
                  {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : mod.position}
                </div>
                {i < modules.length - 1 && (
                  <div className={`w-3 h-0.5 ${isDone ? "bg-emerald-500" : "bg-muted"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Current status + next mission */}
        {nextMission ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Você está no Encontro {currentModule?.position ?? 0}
              </p>
              <p className="text-sm font-medium text-foreground truncate mt-0.5">
                Próxima: {nextMission.lesson.title}
              </p>
            </div>
            <Button size="sm" className="shrink-0 gap-1" onClick={onGoToCurrentModule}>
              Continuar <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="text-center py-1">
            <p className="text-sm font-medium text-emerald-600">🎉 Todas as missões concluídas!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

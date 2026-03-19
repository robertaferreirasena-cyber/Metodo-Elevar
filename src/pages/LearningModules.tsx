import { useState, useEffect, useCallback } from "react";
import { GraduationCap, BookOpen, Palette, Sparkles, AlertTriangle, Instagram } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CarouselEditor from "@/components/carousel/CarouselEditor";
import { toast } from "sonner";
import { useLearning } from "@/hooks/useLearning";
import MissionChecklist from "@/components/learning/MissionChecklist";
import StrategicCommitmentForm from "@/components/learning/StrategicCommitmentForm";
import StrategicPlanTracker from "@/components/learning/StrategicPlanTracker";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { useMissionAutoComplete } from "@/hooks/useMissionAutoComplete";
import { useNavigate, useSearchParams } from "react-router-dom";
import InstaProGenerator from "@/components/instagram/InstaProGenerator";
import type { InstaProfile } from "@/components/instagram/InstagramProfilePreview";

export default function LearningModules() {
  const [activeTab, setActiveTab] = useState("encontros");
  const [carouselTopic, setCarouselTopic] = useState("");

  const handleCreateContent = useCallback((post: InstaProfile["posts_sugeridos"][0]) => {
    const topic = `${post.titulo}\n\n${post.descricao}\n\nLegenda: ${post.legenda}`;
    setCarouselTopic(topic);
    setActiveTab("carousel");
    toast.success(`Carrossel pré-preenchido com: "${post.titulo}"`);
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Método ELEVAR</h1>
          <p className="text-sm text-muted-foreground">10 Encontros para Dobrar o Faturamento com autonomia</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="encontros"><BookOpen className="h-4 w-4 mr-1" /> Encontros</TabsTrigger>
          <TabsTrigger value="carousel"><Palette className="h-4 w-4 mr-1" /> Carrossel</TabsTrigger>
          <TabsTrigger value="instapro"><Instagram className="h-4 w-4 mr-1" /> Insta PRO</TabsTrigger>
        </TabsList>

        <TabsContent value="encontros"><EncontrosTab /></TabsContent>
        <TabsContent value="carousel">
          <CarouselEditor key={carouselTopic} initialTopic={carouselTopic} />
        </TabsContent>
        <TabsContent value="instapro"><InstaProTab onCreateContent={handleCreateContent} /></TabsContent>
      </Tabs>
    </div>
  );
}

function EncontrosTab() {
  const { modules, loading, getModuleLessons, getModuleProgress, toggleLessonComplete, totalProgress, progress, getCurrentModule, getNextMission, getPendingCount } = useLearning();
  const navigate = useNavigate();

  const currentModule = getCurrentModule();
  const nextMission = getNextMission();

  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (currentModule && !expandedModuleId) {
      setExpandedModuleId(currentModule.id);
    }
  }, [currentModule?.id]);

  let persona: ReturnType<typeof usePersonaContext> | null = null;
  try {
    persona = usePersonaContext();
  } catch {
    // fallback
  }

  useMissionAutoComplete((lessonId) => {
    const alreadyDone = progress.find(p => p.lesson_id === lessonId && p.completed);
    if (!alreadyDone) {
      toggleLessonComplete(lessonId);
      toast.success("✅ Missão marcada como concluída automaticamente!");
    }
  });

  useEffect(() => {
    if (!loading && currentModule && nextMission) {
      const pending = getPendingCount(currentModule.id);
      if (pending > 0) {
        toast.info(`📋 Você tem ${pending} missão(ões) pendente(s) no ${currentModule.title}. Continue de onde parou!`, { duration: 5000 });
      }
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
      </div>
    );
  }

  const handleGoToCurrentModule = () => {
    if (currentModule) {
      setExpandedModuleId(currentModule.id);
      document.getElementById(`module-${currentModule.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <StrategicPlanTracker
        modules={modules}
        getModuleProgress={getModuleProgress}
        currentModuleId={currentModule?.id ?? null}
        nextMission={nextMission}
        totalProgress={totalProgress}
        onGoToCurrentModule={handleGoToCurrentModule}
      />

      {currentModule && nextMission && (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-xs text-foreground">
            <strong>Encontro {currentModule.position}:</strong> Você tem {getPendingCount(currentModule.id)} missão(ões) pendente(s).{" "}
            <button className="text-primary underline font-medium" onClick={handleGoToCurrentModule}>
              Continue de onde parou →
            </button>
          </AlertDescription>
        </Alert>
      )}

      {persona && persona.hasProfile && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {persona.formData.business_name || "Meu Negócio"} — {persona.formData.niche || "Nicho"}
                </span>
                {persona.hasRaioX && (
                  <Badge className="bg-primary/20 text-primary text-[10px]">Raio-X ✓</Badge>
                )}
              </div>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => navigate("/persona")}>
                Ver Persona
              </Button>
            </div>
            {persona.formData.main_pain && (
              <p className="text-xs text-muted-foreground mt-1">🎯 Dor principal: {persona.formData.main_pain}</p>
            )}
          </CardContent>
        </Card>
      )}

      {modules.length > 0 && modules[0].position === 0 && (
        <StrategicCommitmentForm />
      )}

      <div className="space-y-3">
        {modules.map(mod => {
          const moduleLessons = getModuleLessons(mod.id);
          const prog = getModuleProgress(mod.id);
          const missions = moduleLessons.map(l => ({
            id: l.id,
            title: l.title,
            content: l.content,
            activity_type: (l as any).activity_type as string | null,
            duration_minutes: l.duration_minutes,
            completed: !!progress.find(p => p.lesson_id === l.id && p.completed),
          }));

          return (
            <div key={mod.id} id={`module-${mod.id}`}>
              <MissionChecklist
                module={mod}
                missions={missions}
                progressPercent={prog}
                onToggle={toggleLessonComplete}
                isExpanded={expandedModuleId === mod.id}
                onToggleExpand={() => setExpandedModuleId(expandedModuleId === mod.id ? null : mod.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}


function InstaProTab({ onCreateContent }: { onCreateContent: (post: InstaProfile["posts_sugeridos"][0]) => void }) {
  let persona: ReturnType<typeof usePersonaContext> | null = null;
  try { persona = usePersonaContext(); } catch {}

  const personaData = persona?.hasProfile ? {
    niche: persona.formData.niche || undefined,
    product: persona.formData.product_description || undefined,
    differentiator: persona.formData.main_differentiator || undefined,
    transformation: persona.formData.transformation || undefined,
    targetAudience: persona.formData.main_pain || undefined,
    ageRange: persona.formData.target_age_range || undefined,
    brandName: persona.formData.business_name || undefined,
    raioX: persona.raioX || null,
  } : undefined;

  return <InstaProGenerator personaData={personaData} onCreateContent={onCreateContent} />;
}

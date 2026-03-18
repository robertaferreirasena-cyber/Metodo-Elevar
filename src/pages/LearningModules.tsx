import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Palette, UserCircle, Sparkles, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CarouselEditor from "@/components/carousel/CarouselEditor";
import { toast } from "sonner";
import { useLearning } from "@/hooks/useLearning";
import MissionChecklist from "@/components/learning/MissionChecklist";
import StrategicCommitmentForm from "@/components/learning/StrategicCommitmentForm";
import StrategicPlanTracker from "@/components/learning/StrategicPlanTracker";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { useMissionAutoComplete } from "@/hooks/useMissionAutoComplete";
import { useNavigate } from "react-router-dom";

export default function LearningModules() {
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

      <Tabs defaultValue="encontros" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="encontros"><BookOpen className="h-4 w-4 mr-1" /> Encontros</TabsTrigger>
          <TabsTrigger value="carousel"><Palette className="h-4 w-4 mr-1" /> Carrossel</TabsTrigger>
          <TabsTrigger value="profile"><UserCircle className="h-4 w-4 mr-1" /> Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="encontros"><EncontrosTab /></TabsContent>
        <TabsContent value="carousel"><CarouselEditor /></TabsContent>
        <TabsContent value="profile"><ProfileGenerator /></TabsContent>
      </Tabs>
    </div>
  );
}

function EncontrosTab() {
  const { modules, loading, getModuleLessons, getModuleProgress, toggleLessonComplete, totalProgress, progress, getCurrentModule, getNextMission, getPendingCount } = useLearning();
  const navigate = useNavigate();

  const currentModule = getCurrentModule();
  const nextMission = getNextMission();

  // Auto-expand the current incomplete module
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

  // Auto-complete pending missions when returning to this page
  useMissionAutoComplete((lessonId) => {
    const alreadyDone = progress.find(p => p.lesson_id === lessonId && p.completed);
    if (!alreadyDone) {
      toggleLessonComplete(lessonId);
      toast.success("✅ Missão marcada como concluída automaticamente!");
    }
  });

  // Show toast on mount if pending missions
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
      {/* Strategic Plan Tracker - Always Visible */}
      <StrategicPlanTracker
        modules={modules}
        getModuleProgress={getModuleProgress}
        currentModuleId={currentModule?.id ?? null}
        nextMission={nextMission}
        totalProgress={totalProgress}
        onGoToCurrentModule={handleGoToCurrentModule}
      />

      {/* Alert: pending missions warning */}
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

      {/* Persona Summary Card */}
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

      {/* Strategic Commitment (Encontro 0 special) */}
      {modules.length > 0 && modules[0].position === 0 && (
        <StrategicCommitmentForm />
      )}

      {/* Encontros List */}
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

// CarouselCreator replaced by CarouselEditor component

function ProfileGenerator() {
  const [niche, setNiche] = useState("");
  const [name, setName] = useState("");
  const [result, setResult] = useState<{ bio: string; highlights: string[]; cta: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    if (!niche.trim()) { toast.error("Informe seu nicho"); return; }
    setGenerating(true);
    setTimeout(() => {
      setResult({
        bio: `${name || 'Seu Nome'} | ${niche}\n🎯 Ajudo [público] a [transformação]\n📲 Link na bio para [oferta]\n⬇️ Acesse o material gratuito`,
        highlights: ["Depoimentos", "Dicas", "Sobre Mim", "Resultados", "Contato"],
        cta: `💡 Dica: Use emojis estrategicamente e inclua uma chamada para ação clara na última linha da bio.`,
      });
      setGenerating(false);
      toast.success("Perfil gerado!");
    }, 1200);
  };

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" /> Gerador de Perfil
          </CardTitle>
          <p className="text-sm text-muted-foreground">Otimize sua bio e destaques do Instagram</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Seu nome ou marca</Label>
            <Input placeholder="Ex: Maria Silva" value={name} onChange={e => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Seu nicho</Label>
            <Input placeholder="Ex: Marketing Digital, Confeitaria, Fitness" value={niche} onChange={e => setNiche(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={generate} disabled={generating} className="w-full">
            {generating ? "Gerando..." : "Gerar Perfil Otimizado"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">📝 Bio Sugerida</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap font-sans text-foreground bg-muted p-3 rounded-md">{result.bio}</pre>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => { navigator.clipboard.writeText(result.bio); toast.success("Bio copiada!"); }}>
                Copiar Bio
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">⭐ Destaques Sugeridos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.highlights.map((h, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{h}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <p className="text-sm text-foreground">{result.cta}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

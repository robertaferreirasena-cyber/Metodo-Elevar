import {
  Smartphone, BotMessageSquare, GraduationCap, Trophy, ArrowRight,
  Brain, Target, AlertTriangle, Zap, TrendingUp, BookOpen, Sparkles,
  MapPin, CheckCircle2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePersonaProfile } from "@/hooks/usePersonaProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnboarding } from "@/hooks/useOnboarding";
import OnboardingFlow from "@/components/OnboardingFlow";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLearning } from "@/hooks/useLearning";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Activity type to route mapping
const activityRoutes: Record<string, { route: string; label: string }> = {
  whatsapp_private: { route: '/whatsapp', label: 'WhatsApp - Vendas 1:1' },
  whatsapp_group: { route: '/whatsapp', label: 'WhatsApp - Grupos' },
  persona: { route: '/persona', label: 'Raio-X Persona' },
  content: { route: '/mentora-hub', label: 'Mentora Gi' },
  mentor: { route: '/mentora-hub', label: 'Mentora Gi' },
  calculator: { route: '/calculadora', label: 'Calculadora' },
  photo: { route: '/ensaio-fotografico', label: 'Ensaio Fotográfico' },
};

interface QuickHubProps {
  icon: ReactNode;
  label: string;
  href: string;
  color: string;
}

function QuickHub({ icon, label, href, color }: QuickHubProps) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(href)}
      className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-muted/80 transition-all duration-200 group border border-border hover:border-primary/30"
    >
      <div className={`p-3 rounded-xl ${color} transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground text-center">
        {label}
      </span>
    </button>
  );
}

export default function Dashboard() {
  const { profile: personaProfile, loading: personaLoading, hasRaioX } = usePersonaProfile();
  const { showOnboarding, currentStep, loading: onboardingLoading, updateStep, completeOnboarding } = useOnboarding();
  const { profile, user } = useAuth();
  const { modules, lessons, progress, loading: learningLoading, totalProgress, getModuleProgress } = useLearning();
  const navigate = useNavigate();

  const [xpData, setXpData] = useState<{ total_xp: number; level: number; streak_days: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_xp')
      .select('total_xp, level, streak_days')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setXpData(data);
      });
  }, [user]);

  const firstName = profile?.full_name?.split(' ')[0] || 'aluna';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  // Find next incomplete lesson
  const getNextActivity = () => {
    if (learningLoading || !lessons.length) return null;

    const sortedLessons = [...lessons].sort((a, b) => {
      const modA = modules.find(m => m.id === a.module_id);
      const modB = modules.find(m => m.id === b.module_id);
      const posA = (modA?.position ?? 0) * 1000 + a.position;
      const posB = (modB?.position ?? 0) * 1000 + b.position;
      return posA - posB;
    });

    const nextLesson = sortedLessons.find(l => {
      const p = progress.find(pr => pr.lesson_id === l.id);
      return !p || !p.completed;
    });

    if (!nextLesson) return null;

    const module = modules.find(m => m.id === nextLesson.module_id);
    const activityType = (nextLesson as any).activity_type as string | null;
    const routeInfo = activityType && activityRoutes[activityType]
      ? activityRoutes[activityType]
      : { route: '/aprendizado', label: 'Aprendizado' };

    return {
      lesson: nextLesson,
      module,
      routeInfo,
    };
  };

  const nextActivity = getNextActivity();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <OnboardingFlow
        open={showOnboarding && !onboardingLoading}
        currentStep={currentStep}
        onUpdateStep={updateStep}
        onComplete={completeOnboarding}
      />

      {/* Welcome Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="py-5 px-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                {firstName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                {greeting}, {firstName}! 👋
              </h1>
              <p className="text-sm text-muted-foreground">
                Continue aplicando o que aprendeu na Elevar!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ELEVAR Method Tracker Card */}
      {!learningLoading && modules.length > 0 && (() => {
        const currentMod = modules.find(m => {
          const prog = getModuleProgress(m.id);
          return prog < 100;
        }) || modules[modules.length - 1];
        const currentIndex = modules.indexOf(currentMod);

        return (
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-background to-background">
            <CardContent className="py-4 px-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Método ELEVAR</span>
                <Badge variant="outline" className="text-[10px] ml-auto">{totalProgress}%</Badge>
              </div>

              {/* Mini stepper */}
              <div className="flex items-center gap-1 mb-3">
                {modules.map((mod, i) => {
                  const prog = getModuleProgress(mod.id);
                  const isDone = prog === 100;
                  const isCurrent = mod.id === currentMod.id;
                  return (
                    <div key={mod.id} className="flex items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                        isDone ? "bg-emerald-500 text-white"
                          : isCurrent ? "bg-primary text-primary-foreground ring-1 ring-primary/30"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {isDone ? <CheckCircle2 className="h-3 w-3" /> : mod.position}
                      </div>
                      {i < modules.length - 1 && <div className={`w-2 h-0.5 ${isDone ? "bg-emerald-500" : "bg-muted"}`} />}
                    </div>
                  );
                })}
              </div>

              {/* Current status */}
              {nextActivity ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Encontro {currentMod.position} • {currentMod.title}
                    </p>
                    <p className="text-sm font-medium text-foreground truncate mt-0.5">
                      {nextActivity.lesson.title}
                    </p>
                  </div>
                  <Button size="sm" className="shrink-0 gap-1" onClick={() => navigate('/aprendizado')}>
                    Continuar <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm font-medium text-center text-emerald-600">🎉 Método completo!</p>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Next Activity - THE CORE */}
      {learningLoading ? (
        <Card className="border-primary/30">
          <CardContent className="py-5">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ) : nextActivity ? (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-background to-background">
          <CardContent className="py-5 px-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Sua Próxima Atividade</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  {nextActivity.module?.icon} {nextActivity.module?.title}
                </p>
                <h2 className="text-base font-bold text-foreground mb-1">
                  {nextActivity.lesson.title}
                </h2>
                {nextActivity.lesson.content && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {nextActivity.lesson.content}
                  </p>
                )}
                <Badge variant="secondary" className="mt-2 text-[10px]">
                  {nextActivity.routeInfo.label}
                </Badge>
              </div>
              <Button
                onClick={() => navigate(nextActivity.routeInfo.route)}
                className="flex-shrink-0 gap-2"
              >
                Ir para atividade <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : lessons.length > 0 ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="py-5 px-5 text-center">
            <Trophy className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
            <h2 className="text-base font-bold text-foreground">Parabéns! 🎉</h2>
            <p className="text-sm text-muted-foreground">Você concluiu todas as atividades!</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Student Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Progresso</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalProgress}%</p>
            <Progress value={totalProgress} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Nível / XP</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              Nv. {xpData?.level ?? 1}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ({xpData?.total_xp ?? 0} XP)
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Sequência</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {xpData?.streak_days ?? 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">dias</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Hubs */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Acesso Rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickHub
            icon={<Smartphone className="h-5 w-5 text-emerald-500" />}
            label="WhatsApp"
            href="/whatsapp"
            color="bg-emerald-500/10"
          />
          <QuickHub
            icon={<BotMessageSquare className="h-5 w-5 text-primary" />}
            label="Mentora Gi"
            href="/mentora-hub"
            color="bg-primary/10"
          />
          <QuickHub
            icon={<GraduationCap className="h-5 w-5 text-blue-500" />}
            label="Aprendizado"
            href="/aprendizado"
            color="bg-blue-500/10"
          />
          <QuickHub
            icon={<Trophy className="h-5 w-5 text-amber-500" />}
            label="Conquistas"
            href="/conquistas"
            color="bg-amber-500/10"
          />
        </div>
      </div>

      {/* Persona Quick Insight */}
      {!personaLoading && !hasRaioX && (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="py-5 text-center">
            <Brain className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <h3 className="font-medium text-foreground text-sm mb-1">Conheça sua Persona</h3>
            <p className="text-xs text-muted-foreground mb-3">Crie um Raio-X do seu cliente ideal para estratégias mais assertivas</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/persona"><Brain className="h-3.5 w-3.5 mr-1.5" />Criar Raio-X</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {hasRaioX && personaProfile?.generated_raio_x && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Sua Persona</CardTitle>
                <Badge variant="secondary" className="text-xs">{personaProfile?.niche}</Badge>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/persona" className="gap-1 text-xs">
                  Ver Raio-X <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4" /> Principais Dores
                </div>
                <ul className="space-y-1">
                  {(Array.isArray(personaProfile.generated_raio_x?.problemas_externos) ? (personaProfile.generated_raio_x as any).problemas_externos : []).slice(0, 3).map((item: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-destructive/70">•</span>
                      <span className="line-clamp-1">{typeof item === 'string' ? item : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Target className="h-4 w-4" /> Principais Desejos
                </div>
                <ul className="space-y-1">
                  {(Array.isArray((personaProfile.generated_raio_x as any)?.desejos) ? (personaProfile.generated_raio_x as any).desejos : []).slice(0, 3).map((item: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary/70">•</span>
                      <span className="line-clamp-1">{typeof item === 'string' ? item : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

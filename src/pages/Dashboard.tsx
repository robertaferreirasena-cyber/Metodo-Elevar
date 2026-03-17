import { MessageCircle, Users, Heart, Clock, Lightbulb, Zap, Brain, ArrowRight, Target, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePersonaProfile } from "@/hooks/usePersonaProfile";
import { Skeleton } from "@/components/ui/skeleton";

import { useOnboarding } from "@/hooks/useOnboarding";
import OnboardingFlow from "@/components/OnboardingFlow";

export default function Dashboard() {
  
  const { profile, loading: personaLoading, hasRaioX } = usePersonaProfile();
  const { showOnboarding, currentStep, loading: onboardingLoading, updateStep, completeOnboarding } = useOnboarding();
  const raioX = profile?.generated_raio_x;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <OnboardingFlow
        open={showOnboarding && !onboardingLoading}
        currentStep={currentStep}
        onUpdateStep={updateStep}
        onComplete={completeOnboarding}
      />
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          Bem-vinda! <span className="text-2xl sm:text-3xl">👋</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Onde você vai vender hoje?
        </p>
      </div>

      {/* Persona Insights Section */}
      {personaLoading ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <Skeleton className="h-5 w-40" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ) : hasRaioX && raioX ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Sua Persona</CardTitle>
                <Badge variant="secondary" className="text-xs">{profile?.niche}</Badge>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/persona" className="gap-1">
                  Ver Raio-X
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <CardDescription>
              Insights do seu cliente ideal para vender mais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Pains */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Principais Dores
                </div>
                <ul className="space-y-1.5">
                  {(Array.isArray(raioX?.problemas_externos) ? raioX.problemas_externos : []).slice(0, 3).map((item: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-destructive/70">•</span>
                      <span className="line-clamp-1">{typeof item === 'string' ? item : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Top Desires */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Target className="h-4 w-4" />
                  Principais Desejos
                </div>
                <ul className="space-y-1.5">
                  {(Array.isArray(raioX?.desejos) ? raioX.desejos : []).slice(0, 3).map((item: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary/70">•</span>
                      <span className="line-clamp-1">{typeof item === 'string' ? item : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Mental Triggers */}
            {Array.isArray(raioX?.estrategia_recomendada?.gatilhos_mentais_prioritarios) && raioX.estrategia_recomendada.gatilhos_mentais_prioritarios.length > 0 && (
              <div className="pt-2 border-t border-primary/10">
                <p className="text-xs text-muted-foreground mb-2">Gatilhos mentais recomendados:</p>
                <div className="flex flex-wrap gap-1.5">
                  {raioX.estrategia_recomendada.gatilhos_mentais_prioritarios.slice(0, 4).map((g: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs bg-background">{typeof g === 'string' ? g : ''}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="py-6 text-center">
            <Brain className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-foreground mb-1">Conheça sua Persona</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie um Raio-X completo do seu cliente ideal e receba estratégias personalizadas
            </p>
            <Button asChild variant="outline">
              <Link to="/persona">
                <Brain className="h-4 w-4 mr-2" />
                Criar Raio-X
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Private Mode Card */}
        <Card className="group relative overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-xl">💬 Modo Privado</CardTitle>
            <CardDescription className="text-base">
              Conversas 1:1 com clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Estratégias para vendas individuais no WhatsApp. Perfeito para conduções de conversa personalizadas.
            </p>
            <Link to="/privado" className="w-full">
              <Button className="w-full gradient-primary glow-pink">
                Gerar Estratégia
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Group Mode Card */}
        <Card className="group relative overflow-hidden border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent-foreground">
              <Users className="h-8 w-8" />
            </div>
            <CardTitle className="text-xl">👥 Modo Grupo</CardTitle>
            <CardDescription className="text-base">
              Engajar comunidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Conteúdo para grupos de WhatsApp. Mensagens curtas que geram interação e preparam vendas.
            </p>
            <Link to="/grupo" className="w-full">
              <Button variant="outline" className="w-full border-accent/50 hover:bg-accent/10">
                Criar Conteúdo
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Section */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Acesso Rápido</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Button asChild variant="secondary" className="h-auto py-3 sm:py-4 flex-col gap-1 sm:gap-2 touch-target">
              <Link to="/favoritos">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
                <span className="text-xs font-medium">Favoritos</span>
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-auto py-3 sm:py-4 flex-col gap-1 sm:gap-2 touch-target">
              <Link to="/historico">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                <span className="text-xs font-medium">Histórico</span>
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-auto py-3 sm:py-4 flex-col gap-1 sm:gap-2 touch-target">
              <Link to="/ideias">
                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                <span className="text-xs font-medium">Ideias</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

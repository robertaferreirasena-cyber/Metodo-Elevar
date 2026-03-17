import { 
  MessageCircle, Users, Heart, Clock, Lightbulb, Zap, Brain, ArrowRight, 
  Target, AlertTriangle, Camera, Calculator, Trophy, GraduationCap, 
  BotMessageSquare, Calendar, Layout, Search, FileText, MessageSquare,
  Download, BookOpen, Sparkles, TrendingUp, Star
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePersonaProfile } from "@/hooks/usePersonaProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnboarding } from "@/hooks/useOnboarding";
import OnboardingFlow from "@/components/OnboardingFlow";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePersonaProfile } from "@/hooks/usePersonaProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnboarding } from "@/hooks/useOnboarding";
import OnboardingFlow from "@/components/OnboardingFlow";
import { ReactNode } from "react";

interface QuickToolProps {
  icon: ReactNode;
  label: string;
  href: string;
  color: string;
  isNew?: boolean;
}

function QuickTool({ icon, label, href, color, isNew }: QuickToolProps) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(href)}
      className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted/80 transition-all duration-200 group relative"
    >
      <div className={`p-2.5 rounded-xl ${color} transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground text-center leading-tight">
        {label}
      </span>
      {isNew && (
        <Badge className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[7px] px-1 py-0 animate-pulse">
          NOVO
        </Badge>
      )}
    </button>
  );
}

interface FeatureLinkProps {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  isNew?: boolean;
}

function FeatureLink({ icon, title, description, href, isNew }: FeatureLinkProps) {
  return (
    <Link to={href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors group">
      <div className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {isNew && (
            <Badge className="bg-primary text-primary-foreground text-[7px] px-1 py-0">NOVO</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

export default function Dashboard() {
  const { profile, loading: personaLoading, hasRaioX } = usePersonaProfile();
  const { showOnboarding, currentStep, loading: onboardingLoading, updateStep, completeOnboarding } = useOnboarding();
  const raioX = profile?.generated_raio_x;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <OnboardingFlow
        open={showOnboarding && !onboardingLoading}
        currentStep={currentStep}
        onUpdateStep={updateStep}
        onComplete={completeOnboarding}
      />

      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Central de Ferramentas ✨
        </h1>
        <p className="text-sm text-muted-foreground">
          Tudo que você precisa para vender mais, em um só lugar
        </p>
      </div>

      {/* Quick Access Grid */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Acesso Rápido</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
            <QuickTool icon={<MessageCircle className="h-4 w-4 text-pink-500" />} label="Privado" href="/privado" color="bg-pink-500/10" />
            <QuickTool icon={<Users className="h-4 w-4 text-violet-500" />} label="Grupo" href="/grupo" color="bg-violet-500/10" />
            <QuickTool icon={<Brain className="h-4 w-4 text-orange-500" />} label="Persona" href="/persona" color="bg-orange-500/10" />
            <QuickTool icon={<BotMessageSquare className="h-4 w-4 text-emerald-500" />} label="Mentora" href="/mentora" color="bg-emerald-500/10" isNew />
            <QuickTool icon={<Lightbulb className="h-4 w-4 text-yellow-500" />} label="Ideias" href="/ideias" color="bg-yellow-500/10" />
            <QuickTool icon={<Calculator className="h-4 w-4 text-blue-500" />} label="Preços" href="/calculadora" color="bg-blue-500/10" />
            <QuickTool icon={<Heart className="h-4 w-4 text-pink-500" />} label="Favoritos" href="/favoritos" color="bg-pink-500/10" />
            <QuickTool icon={<Clock className="h-4 w-4 text-sky-500" />} label="Histórico" href="/historico" color="bg-sky-500/10" />
          </div>
        </CardContent>
      </Card>

      {/* Persona Insights */}
      {personaLoading ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <Skeleton className="h-5 w-40" />
            </div>
          </CardHeader>
          <CardContent><Skeleton className="h-20 w-full" /></CardContent>
        </Card>
      ) : hasRaioX && raioX ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Sua Persona</CardTitle>
                <Badge variant="secondary" className="text-xs">{profile?.niche}</Badge>
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
                  {(Array.isArray(raioX?.problemas_externos) ? raioX.problemas_externos : []).slice(0, 3).map((item: string, i: number) => (
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
                  {(Array.isArray(raioX?.desejos) ? raioX.desejos : []).slice(0, 3).map((item: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary/70">•</span>
                      <span className="line-clamp-1">{typeof item === 'string' ? item : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {Array.isArray(raioX?.estrategia_recomendada?.gatilhos_mentais_prioritarios) && raioX.estrategia_recomendada.gatilhos_mentais_prioritarios.length > 0 && (
              <div className="pt-2 border-t border-primary/10">
                <p className="text-xs text-muted-foreground mb-2">Gatilhos mentais:</p>
                <div className="flex flex-wrap gap-1.5">
                  {raioX.estrategia_recomendada.gatilhos_mentais_prioritarios.slice(0, 4).map((g: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px] bg-background">{typeof g === 'string' ? g : ''}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="py-5 text-center">
            <Brain className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <h3 className="font-medium text-foreground text-sm mb-1">Conheça sua Persona</h3>
            <p className="text-xs text-muted-foreground mb-3">Crie um Raio-X do seu cliente ideal</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/persona"><Brain className="h-3.5 w-3.5 mr-1.5" />Criar Raio-X</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Feature Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vendas Privadas */}
        <Card>
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pink-500/10">
                <MessageCircle className="h-4 w-4 text-pink-500" />
              </div>
              <CardTitle className="text-sm">Vendas Privadas</CardTitle>
            </div>
            <CardDescription className="text-xs">Conversas 1:1 com clientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0.5 pt-0">
            <FeatureLink icon={<Sparkles className="h-4 w-4" />} title="Gerar Estratégia" description="Estratégias personalizadas" href="/privado" />
            <FeatureLink icon={<Search className="h-4 w-4" />} title="Análise de Conversa" description="Analise conversas reais" href="/privado/analise" />
            <FeatureLink icon={<FileText className="h-4 w-4" />} title="Scripts Prontos" description="Modelos de mensagens" href="/privado/scripts" />
          </CardContent>
        </Card>

        {/* Grupos */}
        <Card>
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-500/10">
                <Users className="h-4 w-4 text-violet-500" />
              </div>
              <CardTitle className="text-sm">Grupos & Comunidade</CardTitle>
            </div>
            <CardDescription className="text-xs">Engajamento em grupos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0.5 pt-0">
            <FeatureLink icon={<Users className="h-4 w-4" />} title="Conteúdo" description="Posts para grupos" href="/grupo/conteudo" />
            <FeatureLink icon={<Calendar className="h-4 w-4" />} title="Sequências" description="Séries de conteúdo" href="/grupo/sequencias" />
            <FeatureLink icon={<Layout className="h-4 w-4" />} title="Templates" description="Modelos prontos" href="/grupo/templates" />
            <FeatureLink icon={<MessageSquare className="h-4 w-4" />} title="Comunidade" description="Troque ideias" href="/comunidade" />
          </CardContent>
        </Card>

        {/* Ferramentas IA */}
        <Card>
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <Zap className="h-4 w-4 text-emerald-500" />
              </div>
              <CardTitle className="text-sm">Ferramentas IA</CardTitle>
            </div>
            <CardDescription className="text-xs">Inteligência artificial ao seu lado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0.5 pt-0">
            <FeatureLink icon={<BotMessageSquare className="h-4 w-4" />} title="Mentora Gi" description="Sua mentora de vendas" href="/mentora" isNew />
            <FeatureLink icon={<Brain className="h-4 w-4" />} title="Raio-X Persona" description="Mapa do cliente ideal" href="/persona" />
            <FeatureLink icon={<Lightbulb className="h-4 w-4" />} title="Gerador de Ideias" description="Ideias de conteúdo" href="/ideias" />
            <FeatureLink icon={<Camera className="h-4 w-4" />} title="Ensaio Fotográfico" description="Guia para fotos" href="/ensaio-fotografico" isNew />
          </CardContent>
        </Card>

        {/* Gestão & Aprendizado */}
        <Card>
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <GraduationCap className="h-4 w-4 text-blue-500" />
              </div>
              <CardTitle className="text-sm">Gestão & Aprendizado</CardTitle>
            </div>
            <CardDescription className="text-xs">Evolua seus resultados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0.5 pt-0">
            <FeatureLink icon={<Calculator className="h-4 w-4" />} title="Calculadora de Preços" description="Precifique corretamente" href="/calculadora" />
            <FeatureLink icon={<GraduationCap className="h-4 w-4" />} title="Aprendizado" description="Módulos educativos" href="/aprendizado" isNew />
            <FeatureLink icon={<Trophy className="h-4 w-4" />} title="Conquistas" description="Gamificação e XP" href="/conquistas" isNew />
            <FeatureLink icon={<Heart className="h-4 w-4" />} title="Favoritos" description="Conteúdo salvo" href="/favoritos" />
            <FeatureLink icon={<Clock className="h-4 w-4" />} title="Histórico" description="Conversas anteriores" href="/historico" />
          </CardContent>
        </Card>
      </div>

      {/* Install & Resources */}
      <Card className="border-dashed">
        <CardContent className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Instale o app no seu celular para acesso rápido</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/instalar" className="text-xs">Instalar</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

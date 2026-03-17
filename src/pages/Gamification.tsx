import { useGamification } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, Flame, Lock, CheckCircle2 } from "lucide-react";

const categoryLabels: Record<string, string> = {
  inicio: "🚀 Início",
  estrategia: "📝 Estratégia",
  persona: "🎯 Persona",
  sequencia: "📅 Sequências",
  ferramenta: "🛠️ Ferramentas",
  comunidade: "💬 Comunidade",
  streak: "🔥 Constância",
  nivel: "👑 Nível",
  geral: "⭐ Geral",
};

export default function Gamification() {
  const {
    achievements,
    userXP,
    loading,
    isUnlocked,
    unlockedCount,
    totalCount,
    progressPercent,
    xpForNextLevel,
    xpProgress,
    categories,
  } = useGamification();

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Conquistas</h1>
          <p className="text-xs text-muted-foreground">
            Desbloqueie badges e ganhe XP usando a plataforma
          </p>
        </div>
      </div>

      {/* XP & Level Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">
                  Nível {userXP?.level || 1}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userXP?.total_xp || 0} XP total
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">
                {userXP?.streak_days || 0} dias
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progresso para Nível {(userXP?.level || 1) + 1}</span>
              <span>{xpProgress}/{xpForNextLevel} XP</span>
            </div>
            <Progress value={(xpProgress / xpForNextLevel) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Conquistas Desbloqueadas</p>
              <p className="text-2xl font-bold text-primary">
                {unlockedCount}
                <span className="text-sm text-muted-foreground font-normal">
                  /{totalCount}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Progresso</p>
              <p className="text-lg font-bold">{progressPercent.toFixed(0)}%</p>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2 mt-2" />
        </CardContent>
      </Card>

      {/* Achievements by Category */}
      <Tabs defaultValue="todas">
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="todas" className="text-xs">
            Todas
          </TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="text-xs">
              {categoryLabels[cat] || cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="todas" className="mt-3">
          <AchievementGrid achievements={achievements} isUnlocked={isUnlocked} />
        </TabsContent>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-3">
            <AchievementGrid
              achievements={achievements.filter((a) => a.category === cat)}
              isUnlocked={isUnlocked}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function AchievementGrid({
  achievements,
  isUnlocked,
}: {
  achievements: Array<{
    id: string;
    title: string;
    description: string | null;
    icon: string;
    xp_reward: number;
  }>;
  isUnlocked: (id: string) => boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {achievements.map((ach) => {
        const unlocked = isUnlocked(ach.id);
        return (
          <Card
            key={ach.id}
            className={`transition-all ${
              unlocked
                ? "bg-primary/5 border-primary/30 shadow-sm"
                : "opacity-60 grayscale"
            }`}
          >
            <CardContent className="p-3 flex items-start gap-3">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${
                  unlocked ? "bg-primary/20" : "bg-muted"
                }`}
              >
                {ach.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{ach.title}</p>
                  {unlocked ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  ) : (
                    <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {ach.description}
                </p>
                <Badge variant="secondary" className="text-[10px] mt-1 px-1.5 py-0">
                  +{ach.xp_reward} XP
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

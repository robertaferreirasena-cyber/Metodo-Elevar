import { useState } from "react";
import { GraduationCap, BookOpen, Palette, UserCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLearning } from "@/hooks/useLearning";
import MissionChecklist from "@/components/learning/MissionChecklist";
import StrategicCommitmentForm from "@/components/learning/StrategicCommitmentForm";

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
        <TabsContent value="carousel"><CarouselCreator /></TabsContent>
        <TabsContent value="profile"><ProfileGenerator /></TabsContent>
      </Tabs>
    </div>
  );
}

function EncontrosTab() {
  const { modules, loading, getModuleLessons, getModuleProgress, toggleLessonComplete, totalProgress, progress } = useLearning();
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Overall Progress */}
      <Card className="border-primary/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progresso Geral do Método ELEVAR</span>
            <span className="text-sm text-primary font-bold">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {totalProgress === 100 ? "🎉 Parabéns! Você completou todo o Método ELEVAR!" : "Complete as missões de cada encontro para avançar."}
          </p>
        </CardContent>
      </Card>

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
            <MissionChecklist
              key={mod.id}
              module={mod}
              missions={missions}
              progressPercent={prog}
              onToggle={toggleLessonComplete}
              isExpanded={expandedModuleId === mod.id}
              onToggleExpand={() => setExpandedModuleId(expandedModuleId === mod.id ? null : mod.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function CarouselCreator() {
  const [topic, setTopic] = useState("");
  const [slides, setSlides] = useState(5);
  const [tone, setTone] = useState("profissional");
  const [result, setResult] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    if (!topic.trim()) { toast.error("Informe o tema do carrossel"); return; }
    setGenerating(true);
    setTimeout(() => {
      const generated = Array.from({ length: slides }, (_, i) => {
        if (i === 0) return `🎯 ${topic.toUpperCase()}\n\nVocê sabia que a maioria das pessoas erra nesse ponto?\n\nDeslize para descobrir →`;
        if (i === slides - 1) return `📌 RESUMO\n\n✅ Aplique essas dicas hoje\n✅ Salve este post\n✅ Compartilhe com alguém\n\n💬 Qual dica você vai aplicar primeiro?`;
        return `📍 Slide ${i + 1}\n\nDica ${i}: Texto persuasivo sobre ${topic} que gera valor e engajamento.\n\n👉 Continue deslizando...`;
      });
      setResult(generated);
      setGenerating(false);
      toast.success("Carrossel gerado com sucesso!");
    }, 1500);
  };

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" /> Criador de Carrossel
          </CardTitle>
          <p className="text-sm text-muted-foreground">Gere slides de carrossel para Instagram automaticamente</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tema do carrossel</Label>
            <Textarea placeholder="Ex: 5 dicas para vender mais no Instagram" value={topic} onChange={e => setTopic(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantidade de slides</Label>
              <Select value={String(slides)} onValueChange={v => setSlides(Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 5, 7, 10].map(n => <SelectItem key={n} value={String(n)}>{n} slides</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tom de voz</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="descontraido">Descontraído</SelectItem>
                  <SelectItem value="inspirador">Inspirador</SelectItem>
                  <SelectItem value="educativo">Educativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={generate} disabled={generating} className="w-full">
            {generating ? "Gerando..." : "Gerar Carrossel"}
          </Button>
        </CardContent>
      </Card>

      {result.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {result.map((slide, i) => (
            <Card key={i} className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-4">
                <Badge variant="secondary" className="mb-2 text-[10px]">Slide {i + 1}</Badge>
                <pre className="text-sm whitespace-pre-wrap font-sans text-foreground">{slide}</pre>
                <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => { navigator.clipboard.writeText(slide); toast.success("Copiado!"); }}>
                  Copiar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

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

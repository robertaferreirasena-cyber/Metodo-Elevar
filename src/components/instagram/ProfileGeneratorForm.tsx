import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sparkles, ChevronRight, ChevronLeft, Camera, Target, Palette, BarChart3, ChevronDown, Brain } from "lucide-react";
import type { RaioXData } from "@/hooks/usePersonaProfile";

export interface InstaFormData {
  niche: string;
  subNiche: string;
  showsFace: string;
  targetAudience: string;
  ageRange: string;
  mainGoals: string[];
  brandName: string;
  whatSells: string;
  differentiator: string;
  transformation: string;
  toneOfVoice: string;
  hasInstagram: string;
  followers: string;
  postFrequency: string;
  difficulties: string;
}

interface Props {
  onSubmit: (data: InstaFormData) => void;
  isGenerating: boolean;
  personaData?: {
    niche?: string;
    product?: string;
    differentiator?: string;
    transformation?: string;
    targetAudience?: string;
    ageRange?: string;
    brandName?: string;
    raioX?: RaioXData | null;
  };
}

const STEPS = [
  { icon: Camera, label: "Identidade & Nicho" },
  { icon: Target, label: "Público & Objetivo" },
  { icon: Palette, label: "Marca & Tom" },
  { icon: BarChart3, label: "Presença Atual" },
];

const NICHES = [
  "Moda feminina", "Coaching financeiro", "Fitness", "Nutrição", "Marketing digital",
  "Confeitaria", "Estética", "Psicologia", "Direito", "Educação", "Tecnologia",
  "Fotografia", "Arquitetura", "Saúde mental", "Outro",
];

const GOALS = ["Vender curso/produto", "Atrair clientes", "Construir autoridade", "Gerar leads", "Crescer seguidores"];
const TONES = ["Profissional", "Próximo/Amigável", "Divertido", "Inspiracional", "Técnico/Educativo"];
const AGE_RANGES = ["18-24 anos", "25-34 anos", "35-44 anos", "45-54 anos", "55+ anos", "Misto"];

export default function ProfileGeneratorForm({ onSubmit, isGenerating, personaData }: Props) {
  const [step, setStep] = useState(0);
  const [raioXOpen, setRaioXOpen] = useState(false);
  const [form, setForm] = useState<InstaFormData>({
    niche: "", subNiche: "", showsFace: "",
    targetAudience: "", ageRange: "", mainGoals: [],
    brandName: "", whatSells: "", differentiator: "", transformation: "", toneOfVoice: "",
    hasInstagram: "", followers: "", postFrequency: "", difficulties: "",
  });

  const raioX = personaData?.raioX;

  // Auto-fill from persona
  useEffect(() => {
    if (personaData) {
      const audienceParts: string[] = [];
      if (personaData.targetAudience) audienceParts.push(personaData.targetAudience);
      if (raioX) {
        if (raioX.desejos?.length) audienceParts.push(`Desejos: ${raioX.desejos.slice(0, 3).join(", ")}`);
        if (raioX.fontes_de_dor?.length) audienceParts.push(`Dores: ${raioX.fontes_de_dor.slice(0, 3).join(", ")}`);
      }

      setForm(prev => ({
        ...prev,
        niche: prev.niche || personaData.niche || "",
        whatSells: prev.whatSells || personaData.product || "",
        differentiator: prev.differentiator || personaData.differentiator || "",
        transformation: prev.transformation || personaData.transformation || "",
        targetAudience: prev.targetAudience || audienceParts.join("\n") || "",
        ageRange: prev.ageRange || personaData.ageRange || "",
        brandName: prev.brandName || personaData.brandName || "",
        toneOfVoice: prev.toneOfVoice || raioX?.estrategia_recomendada?.tom_comunicacao || "",
      }));
    }
  }, [personaData]);

  const set = (key: keyof InstaFormData, val: string) => setForm(p => ({ ...p, [key]: val }));

  const toggleGoal = (goal: string) => {
    setForm(p => ({
      ...p,
      mainGoals: p.mainGoals.includes(goal)
        ? p.mainGoals.filter(g => g !== goal)
        : [...p.mainGoals, goal],
    }));
  };

  const canAdvance = () => {
    if (step === 0) return !!form.niche && form.niche !== "__outro__" && !!form.showsFace;
    if (step === 1) return !!form.targetAudience && form.mainGoals.length > 0;
    if (step === 2) return !!form.brandName && !!form.whatSells;
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center justify-between gap-1">
        {STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => i <= step && setStep(i)}
            className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-xs ${
              i === step ? "bg-primary/10 text-primary font-semibold" :
              i < step ? "text-primary/60 cursor-pointer" : "text-muted-foreground"
            }`}
          >
            <s.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{s.label}</span>
            <div className={`h-1 w-full rounded-full mt-1 ${i <= step ? "bg-primary" : "bg-muted"}`} />
          </button>
        ))}
      </div>

      {personaData?.niche && step === 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs text-muted-foreground">Dados da sua Persona foram pré-preenchidos automaticamente</span>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="h-5 w-5 text-primary" />; })()}
            {STEPS[step].label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div>
                <Label>Qual é o seu nicho? *</Label>
                <Select value={NICHES.includes(form.niche) ? form.niche : form.niche ? "__outro__" : ""} onValueChange={v => { if (v === "__outro__") { set("niche", "__outro__"); } else { set("niche", v); } }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione seu nicho..." /></SelectTrigger>
                  <SelectContent>
                    {NICHES.filter(n => n !== "Outro").map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    <SelectItem value="__outro__">✏️ Outro (digitar)</SelectItem>
                  </SelectContent>
                </Select>
                {(form.niche === "__outro__" || (form.niche && !NICHES.includes(form.niche) && form.niche !== "__outro__")) && (
                  <div className="mt-2">
                    <Input 
                      placeholder="Digite seu nicho personalizado..." 
                      value={form.niche === "__outro__" ? "" : form.niche} 
                      onChange={e => set("niche", e.target.value || "__outro__")} 
                      className="border-primary/30 focus:border-primary"
                      autoFocus
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">💡 A IA vai identificar e usar seu nicho automaticamente</p>
                  </div>
                )}
              </div>
              <div>
                <Label>Sub-nicho específico</Label>
                <Input placeholder="Ex: Moda plus size sustentável" value={form.subNiche} onChange={e => set("subNiche", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Você aparece na câmera? *</Label>
                <div className="flex gap-2 mt-1">
                  {["Sim", "Não", "Às vezes"].map(opt => (
                    <Badge
                      key={opt}
                      variant={form.showsFace === opt ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2"
                      onClick={() => set("showsFace", opt)}
                    >
                      {opt}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              {/* Raio-X Summary */}
              {raioX && (
                <Collapsible open={raioXOpen} onOpenChange={setRaioXOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-foreground">Raio-X da Persona</span>
                        <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 text-[10px]">Carregado ✓</Badge>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${raioXOpen ? "rotate-180" : ""}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 p-3 rounded-lg border bg-card space-y-2">
                    {raioX.fontes_de_dor?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Dores</p>
                        <p className="text-xs text-foreground">{raioX.fontes_de_dor.slice(0, 4).join(" • ")}</p>
                      </div>
                    )}
                    {raioX.desejos?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Desejos</p>
                        <p className="text-xs text-foreground">{raioX.desejos.slice(0, 4).join(" • ")}</p>
                      </div>
                    )}
                    {raioX.medos?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Medos</p>
                        <p className="text-xs text-foreground">{raioX.medos.slice(0, 3).join(" • ")}</p>
                      </div>
                    )}
                    {raioX.neurocomportamentos && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Gatilhos de confiança</p>
                        <p className="text-xs text-foreground">{raioX.neurocomportamentos.gatilhos_confianca}</p>
                      </div>
                    )}
                    {raioX.estrategia_recomendada?.tom_comunicacao && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Tom recomendado</p>
                        <p className="text-xs text-primary font-medium">{raioX.estrategia_recomendada.tom_comunicacao}</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}

              <div>
                <Label>Quem é seu público ideal? *</Label>
                <Textarea placeholder="Ex: Mulheres 25-40 anos que querem emagrecer com saúde..." value={form.targetAudience} onChange={e => set("targetAudience", e.target.value)} className="mt-1" rows={3} />
              </div>
              <div>
                <Label>Faixa etária predominante</Label>
                <Select value={form.ageRange} onValueChange={v => set("ageRange", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{AGE_RANGES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quais são seus objetivos? * (selecione um ou mais)</Label>
                <div className="space-y-2 mt-2">
                  {GOALS.map(goal => (
                    <label key={goal} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={form.mainGoals.includes(goal)}
                        onCheckedChange={() => toggleGoal(goal)}
                      />
                      <span className="text-sm text-foreground">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Label>Nome da marca/perfil *</Label>
                <Input placeholder="Ex: Maria Silva Coach" value={form.brandName} onChange={e => set("brandName", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>O que você vende/oferece? *</Label>
                <Textarea placeholder="Ex: Mentoria de finanças pessoais para mulheres" value={form.whatSells} onChange={e => set("whatSells", e.target.value)} className="mt-1" rows={2} />
              </div>
              <div>
                <Label>Seu diferencial principal</Label>
                <Input placeholder="Ex: Método prático em 30 dias" value={form.differentiator} onChange={e => set("differentiator", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Transformação que você entrega</Label>
                <Input placeholder="Ex: Sair das dívidas e investir" value={form.transformation} onChange={e => set("transformation", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Tom de voz desejado</Label>
                <Select value={form.toneOfVoice} onValueChange={v => set("toneOfVoice", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{TONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <Label>Já tem conta no Instagram?</Label>
                <div className="flex gap-2 mt-1">
                  {["Sim", "Não"].map(opt => (
                    <Badge key={opt} variant={form.hasInstagram === opt ? "default" : "outline"} className="cursor-pointer px-4 py-2" onClick={() => set("hasInstagram", opt)}>{opt}</Badge>
                  ))}
                </div>
              </div>
              {form.hasInstagram === "Sim" && (
                <>
                  <div>
                    <Label>Quantos seguidores aproximadamente?</Label>
                    <Input placeholder="Ex: 500, 2k, 10k" value={form.followers} onChange={e => set("followers", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Frequência de postagem atual</Label>
                    <Select value={form.postFrequency} onValueChange={v => set("postFrequency", v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Diariamente">Diariamente</SelectItem>
                        <SelectItem value="3-5x por semana">3-5x por semana</SelectItem>
                        <SelectItem value="1-2x por semana">1-2x por semana</SelectItem>
                        <SelectItem value="Raramente">Raramente</SelectItem>
                        <SelectItem value="Nunca postei">Nunca postei</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div>
                <Label>Maiores dificuldades no Instagram</Label>
                <Textarea placeholder="Ex: Não sei o que postar, não consigo engajamento..." value={form.difficulties} onChange={e => set("difficulties", e.target.value)} className="mt-1" rows={2} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep(s => s - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        ) : <div />}
        {step < 3 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
            Próximo <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => onSubmit(form)} disabled={isGenerating} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {isGenerating ? "Gerando..." : "Gerar Perfil com IA"}
          </Button>
        )}
      </div>
    </div>
  );
}

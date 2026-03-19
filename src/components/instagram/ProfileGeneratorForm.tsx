import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronRight, ChevronLeft, Camera, Target, Palette, BarChart3 } from "lucide-react";

export interface InstaFormData {
  niche: string;
  subNiche: string;
  showsFace: string;
  targetAudience: string;
  ageRange: string;
  mainGoal: string;
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
  const [form, setForm] = useState<InstaFormData>({
    niche: "", subNiche: "", showsFace: "",
    targetAudience: "", ageRange: "", mainGoal: "",
    brandName: "", whatSells: "", differentiator: "", transformation: "", toneOfVoice: "",
    hasInstagram: "", followers: "", postFrequency: "", difficulties: "",
  });

  // Auto-fill from persona
  useEffect(() => {
    if (personaData) {
      setForm(prev => ({
        ...prev,
        niche: prev.niche || personaData.niche || "",
        whatSells: prev.whatSells || personaData.product || "",
        differentiator: prev.differentiator || personaData.differentiator || "",
        transformation: prev.transformation || personaData.transformation || "",
        targetAudience: prev.targetAudience || personaData.targetAudience || "",
        ageRange: prev.ageRange || personaData.ageRange || "",
        brandName: prev.brandName || personaData.brandName || "",
      }));
    }
  }, [personaData]);

  const set = (key: keyof InstaFormData, val: string) => setForm(p => ({ ...p, [key]: val }));

  const canAdvance = () => {
    if (step === 0) return !!form.niche && !!form.showsFace;
    if (step === 1) return !!form.targetAudience && !!form.mainGoal;
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
                <Select value={NICHES.includes(form.niche) ? form.niche : form.niche ? "Outro" : ""} onValueChange={v => v !== "Outro" && set("niche", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
                {(form.niche === "Outro" || (form.niche && !NICHES.includes(form.niche))) && (
                  <Input placeholder="Digite seu nicho" value={form.niche === "Outro" ? "" : form.niche} onChange={e => set("niche", e.target.value)} className="mt-2" />
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
                <Label>Qual seu principal objetivo? *</Label>
                <Select value={form.mainGoal} onValueChange={v => set("mainGoal", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{GOALS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
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

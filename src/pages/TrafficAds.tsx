import { useState, useRef } from "react";
import { Megaphone, Sparkles, Loader2, Copy, Check, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const PLATFORMS = [
  { value: "meta-ads", label: "Meta Ads (Facebook/Instagram)" },
  { value: "google-ads", label: "Google Ads" },
  { value: "tiktok-ads", label: "TikTok Ads" },
];

const OBJECTIVES = [
  { value: "vendas", label: "Vendas / Conversão" },
  { value: "leads", label: "Geração de Leads" },
  { value: "trafego", label: "Tráfego para Site/LP" },
  { value: "reconhecimento", label: "Reconhecimento de Marca" },
];

const TONES = [
  { value: "cinematografico", label: "🎬 Cinematográfico" },
  { value: "direto", label: "🎯 Direto e Objetivo" },
  { value: "emocional", label: "💖 Emocional" },
  { value: "aspiracional", label: "✨ Aspiracional" },
];

export default function TrafficAds() {
  const { user } = useAuth();
  const { enrichPrompt, hasProfile, formData, raioX } = usePersonaContext();

  const [platform, setPlatform] = useState("");
  const [objective, setObjective] = useState("");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [budget, setBudget] = useState("");
  const [tone, setTone] = useState("");
  const [result, setResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const canGenerate = platform && objective && product && audience && tone;

  const handleGenerate = async () => {
    if (!canGenerate || !user) return;
    setIsGenerating(true);
    setResult("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/ad-creator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          platform: PLATFORMS.find(p => p.value === platform)?.label || platform,
          objective: OBJECTIVES.find(o => o.value === objective)?.label || objective,
          product,
          audience,
          budget,
          tone: TONES.find(t => t.value === tone)?.label || tone,
          personaContext: hasProfile ? enrichPrompt("") : null,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(err.error || "Erro ao gerar anúncio");
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setResult(fullText);
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (e) {
      console.error("Error generating ad:", e);
      toast.error("Erro ao gerar anúncio. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-violet-500/10">
          <Megaphone className="h-7 w-7 text-violet-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Tráfego Pago</h1>
          <p className="text-sm text-muted-foreground">Crie anúncios de alta conversão com o Método ANDROMEDA</p>
        </div>
        <Badge className="ml-auto bg-violet-500/10 text-violet-600 border-violet-200">Método ANDROMEDA</Badge>
      </div>

      {/* ANDROMEDA Steps Visual */}
      <div className="flex flex-wrap gap-1.5">
        {["A·Atenção", "N·Narrativa", "D·Dor", "R·Resolução", "O·Oferta", "M·Movimento", "E·Escassez", "D·Dados", "A·Ação"].map((step, i) => (
          <Badge key={i} variant="outline" className="text-[10px] font-medium bg-violet-500/5 border-violet-200 text-violet-600">
            {step}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Configuração do Anúncio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Plataforma</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue placeholder="Selecione a plataforma" /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Objetivo</label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger><SelectValue placeholder="Selecione o objetivo" /></SelectTrigger>
                <SelectContent>
                  {OBJECTIVES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Produto / Serviço</label>
              <Textarea
                value={product}
                onChange={e => setProduct(e.target.value)}
                placeholder="Descreva seu produto ou serviço..."
                className="min-h-[80px] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Público-alvo</label>
              <Textarea
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder="Descreva seu público-alvo ideal..."
                className="min-h-[80px] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Orçamento estimado (opcional)</label>
              <Input
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="Ex: R$ 500/mês"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tom do anúncio</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue placeholder="Selecione o tom" /></SelectTrigger>
                <SelectContent>
                  {TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {hasProfile && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <p className="text-[10px] text-primary font-medium">✅ Dados do Raio-X da Persona serão usados automaticamente</p>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Gerando com ANDROMEDA...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Gerar Anúncio</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Resultado</CardTitle>
            {result && (
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1 text-xs">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]" ref={resultRef}>
              {result ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&>h2]:text-violet-600 [&>h3]:text-violet-500">
                  <ReactMarkdown>{result}</ReactMarkdown>
                  {isGenerating && <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5" />}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-3">
                  <div className="p-4 rounded-full bg-violet-500/10">
                    <Megaphone className="h-8 w-8 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Seu anúncio aparecerá aqui</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Preencha o formulário e clique em "Gerar Anúncio" para criar seu anúncio com o Método ANDROMEDA
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

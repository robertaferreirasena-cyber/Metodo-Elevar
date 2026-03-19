import { useState, useRef, useEffect } from "react";
import { Bot, Sparkles, Loader2, Copy, Check, MessageSquare, Zap, Key, GitBranch } from "lucide-react";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { SessionIndicator } from "@/components/SessionIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import FlowSimulator from "@/components/manychat/FlowSimulator";
import ManyChatApiConfig from "@/components/manychat/ManyChatApiConfig";

const FLOW_TYPES = [
  { value: "comentario-dm", label: "💬 Comentário → DM", desc: "Palavra-chave em post/Reel dispara DM automática" },
  { value: "story-reply", label: "📱 Story Reply → Funil", desc: "Resposta ao Story inicia sequência de qualificação" },
  { value: "dm-welcome", label: "👋 DM Welcome + Qualificação", desc: "Boas-vindas + perguntas para segmentar lead" },
  { value: "funil-lancamento", label: "🚀 Funil de Lançamento", desc: "Aquecimento → Oferta → Escassez" },
  { value: "recuperacao-carrinho", label: "🛒 Recuperação de Carrinho", desc: "Follow-up para quem não comprou" },
  { value: "nutricao-lead", label: "📚 Nutrição de Lead", desc: "Conteúdo de valor + oferta programada" },
];

const OBJECTIVES = [
  { value: "vendas", label: "💰 Vendas Diretas" },
  { value: "leads", label: "🎯 Geração de Leads" },
  { value: "engajamento", label: "❤️ Engajamento" },
  { value: "lancamento", label: "🚀 Lançamento" },
];

const TONES = [
  { value: "amigavel", label: "😊 Amigável" },
  { value: "profissional", label: "💼 Profissional" },
  { value: "descontraido", label: "🎉 Descontraído" },
  { value: "urgente", label: "⚡ Urgente" },
];

const STEPS_OPTIONS = [
  { value: "3", label: "3 mensagens (Rápido)" },
  { value: "5", label: "5 mensagens (Padrão)" },
  { value: "7", label: "7 mensagens (Completo)" },
];

interface ManyChatSessionState {
  flowType: string;
  product: string;
  audience: string;
  objective: string;
  tone: string;
  keyword: string;
  steps: string;
  result: string;
}

const EMPTY_MANYCHAT_STATE: ManyChatSessionState = {
  flowType: "", product: "", audience: "", objective: "", tone: "",
  keyword: "", steps: "5", result: "",
};

export default function ManyChatFlows() {
  const { user } = useAuth();
  const { enrichPrompt, hasProfile, formData, raioX } = usePersonaContext();

  const [sessionState, setSessionState, clearSession, hasRestoredSession] = useSessionPersistence<ManyChatSessionState>(
    "session_manychat_flows", EMPTY_MANYCHAT_STATE
  );

  const [activeTab, setActiveTab] = useState("create");
  const [flowType, setFlowType] = useState(sessionState.flowType);
  const [product, setProduct] = useState(sessionState.product);
  const [audience, setAudience] = useState(sessionState.audience);
  const [objective, setObjective] = useState(sessionState.objective);
  const [tone, setTone] = useState(sessionState.tone);
  const [keyword, setKeyword] = useState(sessionState.keyword);
  const [steps, setSteps] = useState(sessionState.steps);
  const [result, setResult] = useState(sessionState.result);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Sync to session storage
  useEffect(() => {
    setSessionState({ flowType, product, audience, objective, tone, keyword, steps, result });
  }, [flowType, product, audience, objective, tone, keyword, steps, result, setSessionState]);

  const canGenerate = flowType && product && audience && objective && tone;
  const showKeyword = flowType === "comentario-dm" || flowType === "funil-lancamento";

  const handleFillFromPersona = () => {
    const productParts = [
      formData.product_description,
      formData.main_differentiator,
      formData.transformation,
      formData.price_range ? `Faixa de preço: ${formData.price_range}` : "",
      formData.common_objections ? `Objeções comuns: ${formData.common_objections}` : "",
      formData.sales_channels?.length ? `Canais de venda: ${formData.sales_channels.join(", ")}` : "",
      formData.time_in_market ? `Tempo de mercado: ${formData.time_in_market}` : "",
    ].filter(Boolean);
    if (productParts.length) setProduct(productParts.join(". "));

    const audienceParts: string[] = [];
    if (formData.target_gender) audienceParts.push(formData.target_gender);
    if (formData.target_age_range) audienceParts.push(formData.target_age_range);
    if (formData.target_profession) audienceParts.push(formData.target_profession);
    if (formData.target_location) audienceParts.push(formData.target_location);
    if (formData.main_pain) audienceParts.push(`Dor principal: ${formData.main_pain}`);
    if (formData.previous_attempts) audienceParts.push(`Tentativas anteriores: ${formData.previous_attempts}`);
    if (formData.sales_challenges) audienceParts.push(`Desafios de vendas: ${formData.sales_challenges}`);
    if (raioX?.desejos?.length) audienceParts.push(`Desejos: ${(raioX.desejos as string[]).slice(0, 3).join(", ")}`);
    if (raioX?.medos?.length) audienceParts.push(`Medos: ${(raioX.medos as string[]).slice(0, 3).join(", ")}`);
    if (raioX?.padroes_de_compra?.objecoes_previsiveis) audienceParts.push(`Objeções: ${raioX.padroes_de_compra.objecoes_previsiveis}`);
    if (raioX?.padroes_de_compra?.gatilhos_decisao) audienceParts.push(`Gatilhos de decisão: ${raioX.padroes_de_compra.gatilhos_decisao}`);
    if (audienceParts.length) setAudience(audienceParts.join(". "));

    toast.success("Campos preenchidos com dados do Raio-X!");
  };

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

      const selectedFlow = FLOW_TYPES.find(f => f.value === flowType);
      const selectedObj = OBJECTIVES.find(o => o.value === objective);
      const selectedTone = TONES.find(t => t.value === tone);

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/manychat-flow-generator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          flowType: selectedFlow?.label || flowType,
          product,
          audience,
          objective: selectedObj?.label || objective,
          tone: selectedTone?.label || tone,
          keyword: showKeyword ? keyword : undefined,
          steps,
          personaContext: hasProfile ? enrichPrompt("") : null,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(err.error || "Erro ao gerar fluxo");
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
      console.error("Error generating flow:", e);
      toast.error("Erro ao gerar fluxo. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Fluxo copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-blue-500/10">
          <Bot className="h-7 w-7 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Automação Instagram</h1>
          <p className="text-sm text-muted-foreground">Crie fluxos ManyChat de alta conversão com IA</p>
        </div>
        <Badge className="ml-auto bg-blue-500/10 text-blue-600 border-blue-200">ManyChat 2026</Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full max-w-lg">
          <TabsTrigger value="create" className="flex-1 gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Criar Fluxo
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex-1 gap-1.5 text-xs">
            <GitBranch className="h-3.5 w-3.5" />
            Simulador
          </TabsTrigger>
          <TabsTrigger value="api" className="flex-1 gap-1.5 text-xs">
            <Key className="h-3.5 w-3.5" />
            API Key
          </TabsTrigger>
        </TabsList>

        {/* Create Tab */}
        <TabsContent value="create">
          <SessionIndicator show={hasRestoredSession} onClear={clearSession} className="mb-4" />
          {/* Flow Types Visual */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
            {FLOW_TYPES.map((ft) => (
              <button
                key={ft.value}
                onClick={() => setFlowType(ft.value)}
                className={`text-left p-3 rounded-lg border transition-all text-xs ${
                  flowType === ft.value
                    ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
                    : "border-border hover:border-blue-300 hover:bg-blue-500/5"
                }`}
              >
                <p className="font-medium text-foreground">{ft.label}</p>
                <p className="text-muted-foreground mt-0.5 text-[10px] leading-tight">{ft.desc}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Configuração do Fluxo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Produto / Serviço</label>
                  <Textarea
                    value={product}
                    onChange={e => setProduct(e.target.value)}
                    placeholder="Descreva seu produto ou serviço..."
                    className="min-h-[70px] text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Público-alvo</label>
                  <Textarea
                    value={audience}
                    onChange={e => setAudience(e.target.value)}
                    placeholder="Descreva seu público-alvo ideal..."
                    className="min-h-[70px] text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Objetivo</label>
                    <Select value={objective} onValueChange={setObjective}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder="Objetivo" /></SelectTrigger>
                      <SelectContent>
                        {OBJECTIVES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tom de Voz</label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder="Tom" /></SelectTrigger>
                      <SelectContent>
                        {TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {showKeyword && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Palavra-chave Trigger</label>
                    <Input
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                      placeholder="Ex: QUERO, INFO, LINK"
                      className="text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Quantidade de Etapas</label>
                  <Select value={steps} onValueChange={setSteps}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STEPS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {hasProfile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFillFromPersona}
                    className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Zap className="h-4 w-4" />
                    Preencher com Raio-X da Persona
                  </Button>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isGenerating}
                  className="w-full gap-2"
                >
                  {isGenerating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Gerando fluxo...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Gerar Fluxo ManyChat</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Result */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Fluxo Gerado</CardTitle>
                <div className="flex gap-1">
                  {result && !isGenerating && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setActiveTab("simulator")}
                      className="h-7 gap-1 text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      <GitBranch className="h-3 w-3" />
                      Abrir Simulador
                    </Button>
                  )}
                  {result && (
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1 text-xs">
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copiado" : "Copiar"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]" ref={resultRef}>
                  {result ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>h2]:text-blue-600 [&>h3]:text-blue-500">
                      <ReactMarkdown>{result}</ReactMarkdown>
                      {isGenerating && <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5" />}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-3">
                      <div className="p-4 rounded-full bg-blue-500/10">
                        <Bot className="h-8 w-8 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Seu fluxo aparecerá aqui</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Selecione o tipo de fluxo, preencha os dados e clique em "Gerar Fluxo ManyChat"
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 w-full max-w-xs text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1.5 bg-muted/50 rounded p-2">
                          <span>📋</span> Diagrama visual do fluxo
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/50 rounded p-2">
                          <span>💬</span> Textos prontos para cada mensagem
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/50 rounded p-2">
                          <span>⚙️</span> Tags, Custom Fields e Delays
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/50 rounded p-2">
                          <span>🔀</span> Variações A/B para teste
                        </div>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Simulator Tab */}
        <TabsContent value="simulator">
          <Card>
            <CardContent className="pt-6">
              <FlowSimulator markdownResult={result} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Key Tab */}
        <TabsContent value="api">
          <ManyChatApiConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}

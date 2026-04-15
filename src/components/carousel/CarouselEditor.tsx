import { useState, useRef, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import {
  ChevronLeft, ChevronRight, Download, Wand2, Loader2, Paintbrush, Type,
  AlignLeft, AlignCenter, DownloadCloud, ImagePlus, User, X, Smartphone,
  Square, Monitor, Sparkles, Send, ChevronDown, ChevronUp,
  Bold, Italic, Underline, ArrowUpFromLine, AlignVerticalSpaceAround, ArrowDownFromLine, Palette, Copy,
  CopyPlus, Trash2, Maximize, Minimize,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { SessionIndicator } from "@/components/SessionIndicator";
import SlidePreview from "./SlidePreview";
import {
  CAROUSEL_TEMPLATES, createSlidesFromTemplate, FORMAT_SPECS, FONT_OPTIONS, GRADIENT_PRESETS,
  type SlideData, type CarouselTemplate, type CarouselLayout, type AspectRatio,
} from "./CarouselTemplates";

const IMAGE_LAYOUTS: CarouselLayout[] = ["image-bg", "editorial"];
const MULTI_IMAGE_LAYOUTS: CarouselLayout[] = ["photo-grid"];
const PROFILE_LAYOUTS: CarouselLayout[] = ["profile-post", "photo-grid"];
const HIGHLIGHT_LAYOUTS: CarouselLayout[] = ["sales-highlight"];

type FormatFilter = "all" | "1:1" | "16:9" | "9:16";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface CarouselEditorProps {
  initialTopic?: string;
}

interface CarouselSessionState {
  topic: string;
  slideCount: number;
  tone: string;
  formatFilter: FormatFilter;
  selectedTemplateId: string;
  slides: SlideData[];
  currentSlide: number;
}

const EMPTY_CAROUSEL_STATE: CarouselSessionState = {
  topic: "", slideCount: 5, tone: "profissional", formatFilter: "all",
  selectedTemplateId: CAROUSEL_TEMPLATES[0].id, slides: [], currentSlide: 0,
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor-chat`;

// SSE stream reader helper
async function readStream(
  resp: Response,
  onContent: (full: string) => void,
): Promise<string> {
  if (!resp.body) throw new Error("Stream não disponível");
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") break;
      try {
        const c = JSON.parse(json).choices?.[0]?.delta?.content;
        if (c) { full += c; onContent(full); }
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  return full;
}

export default function CarouselEditor({ initialTopic }: CarouselEditorProps = {}) {
  const [sessionState, setSessionState, clearSession, hasRestoredSession] = useSessionPersistence<CarouselSessionState>(
    "session_carousel_editor", EMPTY_CAROUSEL_STATE
  );

  const [topic, setTopic] = useState(initialTopic || sessionState.topic);
  const [slideCount, setSlideCount] = useState(sessionState.slideCount);
  const [tone, setTone] = useState(sessionState.tone);
  const [formatFilter, setFormatFilter] = useState<FormatFilter>(sessionState.formatFilter);
  const [selectedTemplate, setSelectedTemplate] = useState<CarouselTemplate>(
    CAROUSEL_TEMPLATES.find(t => t.id === sessionState.selectedTemplateId) || CAROUSEL_TEMPLATES[0]
  );
  const [slides, setSlides] = useState<SlideData[]>(sessionState.slides);
  const [currentSlide, setCurrentSlide] = useState(sessionState.currentSlide);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Mentora Gi mini-chat state
  const [giOpen, setGiOpen] = useState(false);
  const [giInput, setGiInput] = useState("");
  const [giMessages, setGiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [giLoading, setGiLoading] = useState(false);

  useEffect(() => {
    setSessionState({
      topic, slideCount, tone, formatFilter,
      selectedTemplateId: selectedTemplate.id, slides, currentSlide,
    });
  }, [topic, slideCount, tone, formatFilter, selectedTemplate, slides, currentSlide, setSessionState]);

  const { hasProfile, formData, raioX } = usePersonaContext();

  const setSlideRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => { slideRefs.current[index] = el; },
    []
  );

  const filteredTemplates = CAROUSEL_TEMPLATES.filter((t) =>
    formatFilter === "all" ? true : t.aspectRatio === formatFilter
  );

  // ========== UNIFIED GENERATION VIA ai-mentor-chat ==========
  const generateContent = async () => {
    if (!topic.trim()) { toast.error("Informe o tema do carrossel"); return; }
    setGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      let personaCtx = "";
      if (hasProfile) {
        const parts: string[] = [];
        if (formData.niche) parts.push(`Nicho: ${formData.niche}`);
        if (formData.product_description) parts.push(`Produto: ${formData.product_description}`);
        if (formData.main_pain) parts.push(`Dor principal: ${formData.main_pain}`);
        if (formData.main_differentiator) parts.push(`Diferencial: ${formData.main_differentiator}`);
        if (raioX?.estrategia_recomendada?.tom_comunicacao) parts.push(`Tom: ${raioX.estrategia_recomendada.tom_comunicacao}`);
        if (parts.length) personaCtx = `\n\nDADOS DA PERSONA DO USUÁRIO:\n${parts.join("\n")}`;
      }

      const prompt = `Crie um carrossel de ${slideCount} slides sobre: "${topic}"

Tom: ${tone}${personaCtx}

REGRAS OBRIGATÓRIAS:
1. ARCO NARRATIVO: Slide 1-2 = Gancho + Dor, Slides do meio = Desenvolvimento com valor, Slides finais = Resolução + CTA
2. Títulos: 8-15 palavras, impactantes e emocionais
3. Corpo: 4-6 linhas com conteúdo denso, exemplos e linguagem conversacional
4. Cada slide deve ter conexão narrativa com o anterior
5. O último slide DEVE ter um CTA irresistível

Retorne APENAS um JSON válido sem markdown, neste formato exato:
{"slides":[{"title":"...","body":"..."}]}`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          persona: "copywriter",
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      const fullText = await readStream(resp, () => {});

      // Parse JSON from response
      const jsonMatch = fullText.match(/\{[\s\S]*"slides"[\s\S]*\}/);
      if (!jsonMatch) throw new Error("IA não retornou JSON válido");

      const data = JSON.parse(jsonMatch[0]) as { slides: { title: string; body: string }[] };
      if (!data.slides?.length) throw new Error("Resposta sem slides");

      const newSlides = createSlidesFromTemplate(selectedTemplate, data.slides);
      setSlides(newSlides);
      setCurrentSlide(0);
      slideRefs.current = new Array(newSlides.length).fill(null);
      toast.success("Carrossel gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Erro ao gerar carrossel");
    } finally {
      setGenerating(false);
    }
  };

  const updateSlide = (index: number, updates: Partial<SlideData>) => {
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const changeFormat = (newRatio: AspectRatio) => {
    const spec = FORMAT_SPECS[newRatio];
    setSelectedTemplate(prev => ({ ...prev, aspectRatio: newRatio, titleSize: spec.titleSize, bodySize: spec.bodySize }));
    setSlides(prev => prev.map(s => ({ ...s, titleSize: spec.titleSize, bodySize: spec.bodySize })));
  };

  const applyTemplateToAll = (template: CarouselTemplate) => {
    setSelectedTemplate(template);
    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        bgColor: template.bgColor, textColor: template.textColor, accentColor: template.accentColor,
        titleSize: template.titleSize, bodySize: template.bodySize, fontFamily: template.fontFamily,
        align: template.align, bgGradient: template.bgGradient, layout: template.layout,
        highlightBgColor: template.highlightBgColor,
      }))
    );
  };

  const applyTemplateToSlide = (template: CarouselTemplate, index: number) => {
    setSelectedTemplate(template);
    updateSlide(index, {
      bgColor: template.bgColor, textColor: template.textColor, accentColor: template.accentColor,
      titleSize: template.titleSize, bodySize: template.bodySize, fontFamily: template.fontFamily,
      align: template.align, bgGradient: template.bgGradient, layout: template.layout,
      highlightBgColor: template.highlightBgColor,
    });
  };

  const applyTemplatePreservingFormatting = (template: CarouselTemplate, index?: number) => {
    setSelectedTemplate(template);
    const applyToSlide = (s: SlideData): SlideData => ({
      ...s,
      bgColor: template.bgColor,
      bgGradient: template.bgGradient,
      layout: template.layout,
      fontFamily: template.fontFamily,
      align: s.align, // preserve user alignment
      titleSize: s.titleSize, // preserve user sizes
      bodySize: s.bodySize,
      textColor: s.titleColor ? s.textColor : template.textColor, // preserve if user customized
      accentColor: template.accentColor,
      highlightBgColor: template.highlightBgColor,
      // Preserve: titleColor, bodyColor, titleBold, titleItalic, bodyBold, bodyItalic, bodyUnderline, textShadow, bgImageUrl, overlayOpacity, verticalAlign
    });
    if (index !== undefined) {
      setSlides(prev => prev.map((s, i) => i === index ? applyToSlide(s) : s));
    } else {
      setSlides(prev => prev.map(applyToSlide));
    }
  };

  const [templateApplyMode, setTemplateApplyMode] = useState<"all" | "current" | "preserve">("all");

  const handleImageUpload = async (index: number, file: File) => {
    try { updateSlide(index, { imageUrl: await fileToDataUrl(file) }); }
    catch { toast.error("Erro ao carregar imagem"); }
  };

  const handleBgImageUpload = async (index: number, file: File) => {
    try { updateSlide(index, { bgImageUrl: await fileToDataUrl(file) }); }
    catch { toast.error("Erro ao carregar imagem de fundo"); }
  };

  const handleMultiImageUpload = async (index: number, files: FileList) => {
    try {
      const urls = await Promise.all(Array.from(files).map(fileToDataUrl));
      const current = slides[index]?.imageUrls || [];
      updateSlide(index, { imageUrls: [...current, ...urls].slice(0, 4) });
    } catch { toast.error("Erro ao carregar imagens"); }
  };

  const handleProfileImageUpload = async (index: number, file: File) => {
    try { updateSlide(index, { profileImageUrl: await fileToDataUrl(file) }); }
    catch { toast.error("Erro ao carregar foto de perfil"); }
  };

  // Hidden export refs for native-size rendering
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const setExportRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => { exportRefs.current[index] = el; },
    []
  );

  const exportSlide = async (index: number) => {
    const el = exportRefs.current[index] || slideRefs.current[index];
    if (!el) return;
    const spec = FORMAT_SPECS[selectedTemplate.aspectRatio];
    try {
      // Wait for all fonts to be loaded before capturing
      await document.fonts.ready;
      // Small delay to ensure rendering is complete
      await new Promise((r) => setTimeout(r, 200));
      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 1,
        width: spec.width,
        height: spec.height,
        style: { transform: 'none', position: 'static' },
        filter: (node: HTMLElement) => {
          // Skip hidden elements that might interfere
          return !(node instanceof HTMLElement && node.getAttribute?.('aria-hidden') === 'true');
        },
      });
      const link = document.createElement("a");
      link.download = `slide-${index + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Erro ao exportar slide");
    }
  };

  const exportAll = async () => {
    setExporting(true);
    try {
      // Pre-load fonts
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 300));
      for (let i = 0; i < slides.length; i++) {
        await exportSlide(i);
        await new Promise((r) => setTimeout(r, 500));
      }
      toast.success("Todos os slides exportados!");
    } finally { setExporting(false); }
  };

  // ========== MENTORA GI MINI-CHAT ==========
  const buildSlidesContext = () =>
    slides.map((s, i) => `Slide ${i + 1}:\nTítulo: ${s.title}\nCorpo: ${s.body}`).join("\n\n");

  const sendToGi = async (userMessage: string) => {
    if (!userMessage.trim() || giLoading) return;
    const fullMessage = `CONTEXTO — Slides atuais do carrossel:\n\n${buildSlidesContext()}\n\n---\n\nPedido do usuário: ${userMessage}`;
    setGiMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setGiInput("");
    setGiLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          messages: [...giMessages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: fullMessage }],
          persona: "copywriter",
        }),
      });
      if (!resp.ok) throw new Error(`Erro ${resp.status}`);

      await readStream(resp, (content) => {
        setGiMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
          return [...prev, { role: "assistant", content }];
        });
      });
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar Mentora Gi");
    } finally { setGiLoading(false); }
  };

  const improveAllCopies = () => {
    sendToGi("Analise todos os slides acima e reescreva cada um com copy mais envolvente, profunda e persuasiva. Mantenha o arco narrativo com começo, meio e fim. Para cada slide, forneça o novo título e corpo no formato:\n\nSlide X:\nTítulo: ...\nCorpo: ...");
  };

  const applyGiSuggestions = (content: string) => {
    const slideRegex = /Slide\s*(\d+)\s*:\s*\n?\s*T[ií]tulo:\s*(.+?)(?:\n)\s*Corpo:\s*([\s\S]*?)(?=\nSlide\s*\d+\s*:|$)/gi;
    let match: RegExpExecArray | null;
    let appliedCount = 0;

    const newSlides = [...slides];
    while ((match = slideRegex.exec(content)) !== null) {
      const idx = parseInt(match[1], 10) - 1;
      const title = match[2].trim();
      const body = match[3].trim();
      if (idx >= 0 && idx < newSlides.length && (title || body)) {
        newSlides[idx] = { ...newSlides[idx], ...(title && { title }), ...(body && { body }) };
        appliedCount++;
      }
    }

    if (appliedCount > 0) {
      setSlides(newSlides);
      toast.success(`✨ ${appliedCount} slide(s) atualizado(s) com as sugestões da Mentora Gi!`);
    } else {
      toast.error("Não foi possível identificar slides no formato esperado. Peça à Gi para usar o formato: Slide X:\\nTítulo: ...\\nCorpo: ...");
    }
  };

  const cur = slides[currentSlide];
  const curLayout = cur?.layout || "text-only";
  const showImageUpload = IMAGE_LAYOUTS.includes(curLayout);
  const showMultiImage = MULTI_IMAGE_LAYOUTS.includes(curLayout);
  const showProfile = PROFILE_LAYOUTS.includes(curLayout);
  const showHighlight = HIGHLIGHT_LAYOUTS.includes(curLayout);

  return (
    <div className="space-y-4 mt-4">
      <SessionIndicator show={hasRestoredSession && slides.length > 0} onClear={clearSession} />

      {/* ========== GENERATION FORM ========== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" /> Gerador de Carrossel Visual
          </CardTitle>
          <p className="text-sm text-muted-foreground">Mentora Gi gera copies com narrativa profunda — edite visual e exporte como imagem</p>
          {hasProfile && (
            <Badge variant="secondary" className="w-fit text-xs mt-1">✨ Persona conectada — conteúdo otimizado</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tema do carrossel</Label>
            <Textarea placeholder="Ex: 5 dicas para vender mais no WhatsApp" value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Slides</Label>
              <Select value={String(slideCount)} onValueChange={(v) => setSlideCount(Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 5, 7, 10].map((n) => (<SelectItem key={n} value={String(n)}>{n} slides</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tom</Label>
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

          {/* Format filter */}
          <div>
            <Label>Formato</Label>
            <div className="flex gap-2 mt-1">
              <Button size="sm" variant={formatFilter === "all" ? "default" : "outline"} onClick={() => setFormatFilter("all")}>Todos</Button>
              <Button size="sm" variant={formatFilter === "1:1" ? "default" : "outline"} onClick={() => setFormatFilter("1:1")}><Square className="h-3 w-3 mr-1" /> Feed</Button>
              <Button size="sm" variant={formatFilter === "9:16" ? "default" : "outline"} onClick={() => setFormatFilter("9:16")}><Smartphone className="h-3 w-3 mr-1" /> Stories</Button>
              <Button size="sm" variant={formatFilter === "16:9" ? "default" : "outline"} onClick={() => setFormatFilter("16:9")}><Monitor className="h-3 w-3 mr-1" /> Wide</Button>
            </div>
          </div>

          {/* Template selector */}
          <div>
            <Label>Template visual</Label>
            {slides.length > 0 && (
              <div className="flex gap-1.5 mt-1 mb-2">
                <Button size="sm" variant={templateApplyMode === "all" ? "default" : "outline"} className="text-xs h-7" onClick={() => setTemplateApplyMode("all")}>
                  Todos slides
                </Button>
                <Button size="sm" variant={templateApplyMode === "current" ? "default" : "outline"} className="text-xs h-7" onClick={() => setTemplateApplyMode("current")}>
                  Slide atual
                </Button>
                <Button size="sm" variant={templateApplyMode === "preserve" ? "default" : "outline"} className="text-xs h-7" onClick={() => setTemplateApplyMode("preserve")}>
                  <Palette className="h-3 w-3 mr-1" /> Preservar formatação
                </Button>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {filteredTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplate(t);
                    if (slides.length > 0) {
                      if (templateApplyMode === "current") {
                        applyTemplateToSlide(t, currentSlide);
                        toast.success(`Template aplicado ao slide ${currentSlide + 1}`);
                      } else if (templateApplyMode === "preserve") {
                        applyTemplatePreservingFormatting(t);
                        toast.success("Template aplicado preservando formatação personalizada");
                      } else {
                        applyTemplateToAll(t);
                      }
                    }
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${selectedTemplate.id === t.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-8 rounded" style={{ background: t.bgGradient || t.bgColor }} />
                    <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">{t.aspectRatio}</Badge>
                  </div>
                  <span className="text-xs font-medium text-foreground">{t.name}</span>
                  <p className="text-[10px] text-muted-foreground">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          <Button onClick={generateContent} disabled={generating} className="w-full">
            {generating ? (<><Loader2 className="h-4 w-4 animate-spin" /> Gerando com Mentora Gi...</>) : (<><Sparkles className="h-4 w-4" /> Gerar Carrossel com Mentora Gi</>)}
          </Button>
        </CardContent>
      </Card>

      {/* ========== EDITOR + PREVIEW ========== */}
      {slides.length > 0 && cur && (
        <>
          {/* Format toggle + Navigation */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground shrink-0">Formato:</Label>
              {(["1:1", "9:16", "16:9"] as AspectRatio[]).map((r) => (
                <Button key={r} size="sm" variant={selectedTemplate.aspectRatio === r ? "default" : "outline"} onClick={() => changeFormat(r)}>
                  {r === "1:1" && <Square className="h-3 w-3 mr-1" />}
                  {r === "9:16" && <Smartphone className="h-3 w-3 mr-1" />}
                  {r === "16:9" && <Monitor className="h-3 w-3 mr-1" />}
                  {FORMAT_SPECS[r].label}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" disabled={currentSlide === 0} onClick={() => setCurrentSlide((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Badge variant="secondary">Slide {currentSlide + 1} / {slides.length}</Badge>
                <Button size="icon" variant="outline" disabled={currentSlide === slides.length - 1} onClick={() => setCurrentSlide((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => exportSlide(currentSlide)}><Download className="h-4 w-4 mr-1" /> PNG</Button>
                <Button size="sm" onClick={exportAll} disabled={exporting}><DownloadCloud className="h-4 w-4 mr-1" />{exporting ? "Exportando..." : "Baixar Todos"}</Button>
              </div>
            </div>
          </div>



          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Preview */}
            <div className="flex justify-center">
              <SlidePreview ref={setSlideRef(currentSlide)} slide={cur} slideIndex={currentSlide} totalSlides={slides.length} aspectRatio={selectedTemplate.aspectRatio} />
            </div>

            {/* ========== EDITOR CONTROLS ========== */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Paintbrush className="h-4 w-4" /> Editar Slide {currentSlide + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {/* Title */}
                <div>
                  <Label className="text-xs">Título</Label>
                  <Input value={cur.title} onChange={(e) => updateSlide(currentSlide, { title: e.target.value })} className="mt-1" />
                  <div className="flex items-center gap-1 mt-1">
                    <Button size="icon" variant={cur.titleBold !== false ? "default" : "outline"} className="h-7 w-7" onClick={() => updateSlide(currentSlide, { titleBold: cur.titleBold === false ? true : false })}>
                      <Bold className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant={cur.titleItalic ? "default" : "outline"} className="h-7 w-7" onClick={() => updateSlide(currentSlide, { titleItalic: !cur.titleItalic })}>
                      <Italic className="h-3 w-3" />
                    </Button>
                    <input type="color" value={cur.titleColor || cur.textColor} onChange={(e) => updateSlide(currentSlide, { titleColor: e.target.value })} className="h-7 w-7 rounded border border-input cursor-pointer" title="Cor do título" />
                  </div>
                </div>

                {/* Body */}
                <div>
                  <Label className="text-xs">Corpo</Label>
                  <Textarea value={cur.body} onChange={(e) => updateSlide(currentSlide, { body: e.target.value })} className="mt-1" rows={4} />
                  <div className="flex items-center gap-1 mt-1">
                    <Button size="icon" variant={cur.bodyBold ? "default" : "outline"} className="h-7 w-7" onClick={() => updateSlide(currentSlide, { bodyBold: !cur.bodyBold })}>
                      <Bold className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant={cur.bodyItalic ? "default" : "outline"} className="h-7 w-7" onClick={() => updateSlide(currentSlide, { bodyItalic: !cur.bodyItalic })}>
                      <Italic className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant={cur.bodyUnderline ? "default" : "outline"} className="h-7 w-7" onClick={() => updateSlide(currentSlide, { bodyUnderline: !cur.bodyUnderline })}>
                      <Underline className="h-3 w-3" />
                    </Button>
                    <input type="color" value={cur.bodyColor || cur.textColor} onChange={(e) => updateSlide(currentSlide, { bodyColor: e.target.value })} className="h-7 w-7 rounded border border-input cursor-pointer" title="Cor do corpo" />
                  </div>
                </div>

                {/* ===== UNIVERSAL BG IMAGE ===== */}
                <div>
                  <Label className="text-xs flex items-center gap-1"><ImagePlus className="h-3 w-3" /> Imagem de fundo</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors text-xs text-muted-foreground">
                      <ImagePlus className="h-4 w-4" />
                      {cur.bgImageUrl ? "Trocar fundo" : "Adicionar fundo"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBgImageUpload(currentSlide, f); }} />
                    </label>
                    {cur.bgImageUrl && (
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateSlide(currentSlide, { bgImageUrl: undefined })}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {cur.bgImageUrl && (
                    <div className="mt-2">
                      <Label className="text-xs">Opacidade do overlay: {Math.round((cur.overlayOpacity ?? 0.55) * 100)}%</Label>
                      <Slider value={[cur.overlayOpacity ?? 0.55]} onValueChange={([v]) => updateSlide(currentSlide, { overlayOpacity: v })} min={0} max={1} step={0.05} className="mt-1" />
                    </div>
                  )}
                </div>

                {/* ===== LAYOUT-SPECIFIC IMAGE (image-bg, editorial) ===== */}
                {showImageUpload && (
                  <div>
                    <Label className="text-xs flex items-center gap-1"><ImagePlus className="h-3 w-3" /> Imagem do layout</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors text-xs text-muted-foreground">
                        <ImagePlus className="h-4 w-4" />
                        {cur.imageUrl ? "Trocar imagem" : "Enviar imagem"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(currentSlide, f); }} />
                      </label>
                      {cur.imageUrl && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateSlide(currentSlide, { imageUrl: undefined })}><X className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== MULTI IMAGE (photo-grid) ===== */}
                {showMultiImage && (
                  <div>
                    <Label className="text-xs flex items-center gap-1"><ImagePlus className="h-3 w-3" /> Fotos do grid (até 4)</Label>
                    <label className="mt-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors text-xs text-muted-foreground">
                      <ImagePlus className="h-4 w-4" /> Adicionar fotos
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) handleMultiImageUpload(currentSlide, e.target.files); }} />
                    </label>
                    {(cur.imageUrls?.length || 0) > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {cur.imageUrls!.map((url, i) => (
                          <div key={i} className="relative w-12 h-12 rounded overflow-hidden group">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" onClick={() => { const u = [...(cur.imageUrls || [])]; u.splice(i, 1); updateSlide(currentSlide, { imageUrls: u }); }}>
                              <X className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ===== PROFILE (profile-post, photo-grid) ===== */}
                {showProfile && (
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1"><User className="h-3 w-3" /> Dados do perfil</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Nome" value={cur.profileName || ""} onChange={(e) => updateSlide(currentSlide, { profileName: e.target.value })} className="text-xs" />
                      <Input placeholder="@handle" value={cur.profileHandle || ""} onChange={(e) => updateSlide(currentSlide, { profileHandle: e.target.value })} className="text-xs" />
                    </div>
                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors text-xs text-muted-foreground">
                      <User className="h-3 w-3" /> {cur.profileImageUrl ? "Trocar avatar" : "Enviar avatar"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleProfileImageUpload(currentSlide, f); }} />
                    </label>
                  </div>
                )}

                {/* ===== HIGHLIGHT (sales-highlight) ===== */}
                {showHighlight && (
                  <div>
                    <Label className="text-xs">Cor do bloco de destaque</Label>
                    <input type="color" value={cur.highlightBgColor || "#22C55E"} onChange={(e) => updateSlide(currentSlide, { highlightBgColor: e.target.value })} className="w-full h-9 rounded border border-input cursor-pointer mt-1" />
                  </div>
                )}

                {/* ===== TEXT SHADOW ===== */}
                <div>
                  <Label className="text-xs">Sombra no texto</Label>
                  <Select value={cur.textShadow || "none"} onValueChange={(v) => updateSlide(currentSlide, { textShadow: v === "none" ? undefined : v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem sombra</SelectItem>
                      <SelectItem value="1px 1px 2px rgba(0,0,0,0.5)">Sutil</SelectItem>
                      <SelectItem value="2px 2px 4px rgba(0,0,0,0.7)">Média</SelectItem>
                      <SelectItem value="3px 3px 8px rgba(0,0,0,0.9)">Forte</SelectItem>
                      <SelectItem value="0 0 10px rgba(255,255,255,0.8)">Glow claro</SelectItem>
                      <SelectItem value="0 0 10px rgba(0,0,0,0.8)">Glow escuro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Fundo</Label>
                    <input type="color" value={cur.bgColor} onChange={(e) => updateSlide(currentSlide, { bgColor: e.target.value, bgGradient: undefined })} className="w-full h-9 rounded border border-input cursor-pointer mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Texto</Label>
                    <input type="color" value={cur.textColor} onChange={(e) => updateSlide(currentSlide, { textColor: e.target.value })} className="w-full h-9 rounded border border-input cursor-pointer mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Destaque</Label>
                    <input type="color" value={cur.accentColor} onChange={(e) => updateSlide(currentSlide, { accentColor: e.target.value })} className="w-full h-9 rounded border border-input cursor-pointer mt-1" />
                  </div>
                </div>

                {/* ===== GRADIENT PRESETS ===== */}
                <div>
                  <Label className="text-xs flex items-center gap-1"><Palette className="h-3 w-3" /> Gradientes Premium</Label>
                  <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                    {GRADIENT_PRESETS.map((g) => (
                      <button
                        key={g.name}
                        title={g.name}
                        className={`h-8 rounded-md border-2 transition-all hover:scale-105 ${cur.bgGradient === g.value ? "border-primary ring-1 ring-primary/50" : "border-transparent hover:border-primary/40"}`}
                        style={{ background: g.value }}
                        onClick={() => updateSlide(currentSlide, { bgGradient: g.value })}
                      />
                    ))}
                    <button
                      title="Remover gradiente"
                      className={`h-8 rounded-md border-2 transition-all text-[10px] font-medium text-muted-foreground hover:border-primary/40 ${!cur.bgGradient ? "border-primary" : "border-border"}`}
                      style={{ background: cur.bgColor }}
                      onClick={() => updateSlide(currentSlide, { bgGradient: undefined })}
                    >✕</button>
                  </div>
                </div>

                {/* ===== FONT SELECTOR ===== */}
                <div>
                  <Label className="text-xs flex items-center gap-1"><Type className="h-3 w-3" /> Fonte</Label>
                  <div className="grid grid-cols-1 gap-1 mt-1.5 max-h-48 overflow-y-auto rounded-md border border-border p-1">
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => updateSlide(currentSlide, { fontFamily: f.family })}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all ${cur.fontFamily === f.family ? "bg-primary/10 border border-primary/30" : "hover:bg-accent/50 border border-transparent"}`}
                      >
                        <span className="text-lg leading-none min-w-[28px]" style={{ fontFamily: f.family }}>Aa</span>
                        <span className="text-xs font-medium">{f.name}</span>
                        <span className="text-[9px] text-muted-foreground ml-auto">{f.category}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font sizes */}
                <div>
                  <Label className="text-xs flex items-center gap-1"><Type className="h-3 w-3" /> Tamanho do título: {cur.titleSize}px</Label>
                  <Slider value={[cur.titleSize]} onValueChange={([v]) => updateSlide(currentSlide, { titleSize: v })} min={16} max={48} step={1} className="mt-2" />
                </div>
                <div>
                  <Label className="text-xs">Tamanho do corpo: {cur.bodySize}px</Label>
                  <Slider value={[cur.bodySize]} onValueChange={([v]) => updateSlide(currentSlide, { bodySize: v })} min={12} max={32} step={1} className="mt-2" />
                </div>

                {/* Horizontal Alignment */}
                <div>
                  <Label className="text-xs">Alinhamento horizontal</Label>
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" variant={cur.align === "left" ? "default" : "outline"} onClick={() => updateSlide(currentSlide, { align: "left" })}><AlignLeft className="h-4 w-4" /></Button>
                    <Button size="sm" variant={cur.align === "center" ? "default" : "outline"} onClick={() => updateSlide(currentSlide, { align: "center" })}><AlignCenter className="h-4 w-4" /></Button>
                  </div>
                </div>

                {/* Vertical Position */}
                <div>
                  <Label className="text-xs">Posição vertical do texto</Label>
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" variant={(cur.verticalAlign || "center") === "top" ? "default" : "outline"} onClick={() => updateSlide(currentSlide, { verticalAlign: "top" })}>
                      <ArrowUpFromLine className="h-4 w-4 mr-1" /> Topo
                    </Button>
                    <Button size="sm" variant={(cur.verticalAlign || "center") === "center" ? "default" : "outline"} onClick={() => updateSlide(currentSlide, { verticalAlign: "center" })}>
                      <AlignVerticalSpaceAround className="h-4 w-4 mr-1" /> Meio
                    </Button>
                    <Button size="sm" variant={(cur.verticalAlign || "center") === "bottom" ? "default" : "outline"} onClick={() => updateSlide(currentSlide, { verticalAlign: "bottom" })}>
                      <ArrowDownFromLine className="h-4 w-4 mr-1" /> Baixo
                    </Button>
                  </div>
                </div>

                {/* Copy formatting to other slides */}
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => {
                  const source = slides[currentSlide];
                  setSlides(prev => prev.map((s, i) => i === currentSlide ? s : {
                    ...s,
                    bgColor: source.bgColor, textColor: source.textColor, accentColor: source.accentColor,
                    titleSize: source.titleSize, bodySize: source.bodySize, fontFamily: source.fontFamily,
                    align: source.align, bgGradient: source.bgGradient, titleColor: source.titleColor,
                    bodyColor: source.bodyColor, titleBold: source.titleBold, titleItalic: source.titleItalic,
                    bodyBold: source.bodyBold, bodyItalic: source.bodyItalic, bodyUnderline: source.bodyUnderline,
                    textShadow: source.textShadow, verticalAlign: source.verticalAlign,
                    highlightBgColor: source.highlightBgColor,
                  }));
                  toast.success("Formatação copiada para todos os slides!");
                }}>
                  <Copy className="h-3 w-3 mr-1" /> Copiar formatação para todos os slides
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Thumbnail strip — aspect-ratio aware */}
          <div className="flex gap-3 overflow-x-auto pb-3 pt-1">
            {slides.map((s, i) => {
              const spec = FORMAT_SPECS[selectedTemplate.aspectRatio];
              const thumbH = 100;
              const thumbW = Math.round(thumbH * (spec.width / spec.height));
              return (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${i === currentSlide ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"}`}
                  style={{ width: thumbW, height: thumbH }}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center p-1.5 relative" style={{ background: s.bgImageUrl ? `linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)), url(${s.bgImageUrl}) center/cover` : s.imageUrl ? `linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)), url(${s.imageUrl}) center/cover` : s.bgGradient || s.bgColor }}>
                    <span className="text-[7px] font-bold uppercase tracking-wide mb-0.5" style={{ color: s.accentColor }}>{i + 1}/{slides.length}</span>
                    <span className="text-[9px] font-bold leading-tight text-center line-clamp-3" style={{ color: s.textColor }}>{s.title}</span>
                  </div>
                </button>
              );
            })}
          </div>



          {/* Mentora Gi Mini-Chat */}
          <Collapsible open={giOpen} onOpenChange={setGiOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">Mentora Gi — Copywriter</span>
                    <Badge variant="secondary" className="text-[10px]">IA</Badge>
                  </div>
                  {giOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-3">
                  <p className="text-xs text-muted-foreground">Peça melhorias nas copies, ajuste tom, peça mais storytelling ou refine slides específicos.</p>
                  <Button size="sm" variant="outline" onClick={improveAllCopies} disabled={giLoading} className="w-full">
                    <Sparkles className="h-4 w-4 mr-1" /> ✨ Melhorar todas as copies
                  </Button>
                  {giMessages.length > 0 && (
                    <ScrollArea className="max-h-60 rounded-md border p-3">
                      <div className="space-y-3">
                        {giMessages.map((msg, i) => (
                          <div key={i} className={`text-sm ${msg.role === "user" ? "text-right" : ""}`}>
                            <div className={`inline-block max-w-[90%] rounded-lg px-3 py-2 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                              <p className="whitespace-pre-wrap text-xs">{msg.content}</p>
                            </div>
                            {msg.role === "assistant" && !giLoading && (
                              <Button size="sm" variant="outline" className="mt-1 text-xs h-7" onClick={() => applyGiSuggestions(msg.content)}>
                                <Wand2 className="h-3 w-3 mr-1" /> Aplicar nos slides
                              </Button>
                            )}
                          </div>
                        ))}
                        {giLoading && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Mentora Gi pensando...</div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                  <div className="flex gap-2">
                    <Input placeholder="Ex: Deixe o slide 3 mais agressivo..." value={giInput} onChange={(e) => setGiInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendToGi(giInput); } }} className="text-sm" />
                    <Button size="icon" onClick={() => sendToGi(giInput)} disabled={!giInput.trim() || giLoading}><Send className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Hidden slides for export at native resolution */}
          <div className="absolute -left-[9999px] top-0" aria-hidden>
            {slides.map((s, i) => (
              <SlidePreview key={i} ref={setExportRef(i)} slide={s} slideIndex={i} totalSlides={slides.length} aspectRatio={selectedTemplate.aspectRatio} nativeSize />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

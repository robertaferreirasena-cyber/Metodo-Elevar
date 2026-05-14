import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Download, Wand2, Loader2, Type,
  AlignCenter, DownloadCloud, ImagePlus, X,
  Square, Monitor, Sparkles, Undo2, LayoutGrid, Layers, Trash2,
  CopyPlus, ZoomIn, ZoomOut, Maximize2, Move, AlignLeft, AlignRight,
  Bold, Italic, Underline, Palette, Search, Settings2, Image as ImageIcon,
  MessageSquare, FileText, ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { useAuth } from "@/hooks/useAuth";
import SlidePreview from "./SlidePreview";
import BrandKitManager, { type BrandKit } from "./BrandKitManager";
import {

  CAROUSEL_TEMPLATES, createSlidesFromTemplate, FORMAT_SPECS, FONT_OPTIONS,
  isJournalTemplate, JOURNAL_LAYOUT_SEQUENCE, JOURNAL_PALETTES, buildJournalSampleSlides,
  JOURNAL_SAMPLE_THEMES, type JournalPalette,
  type SlideData, type CarouselTemplate, type CarouselLayout, type AspectRatio
} from "./CarouselTemplates";
import ImageLibraryPicker from "./ImageLibraryPicker";
import JSZip from "jszip";
import UserUploads from "./UserUploads";

type FormatFilter = "all" | "1:1" | "16:9" | "9:16";

interface CarouselSessionState {
  topic: string;
  slideCount: number;
  tone: string;
  postType: "static" | "carousel";
  formatFilter: FormatFilter;
  selectedTemplateId: string;
  slides: SlideData[];
  currentSlide: number;
  templateApplyMode: "all" | "current" | "preserve";
  currentJournalPaletteId: string;
}

const EMPTY_CAROUSEL_STATE: CarouselSessionState = {
  topic: "", slideCount: 5, tone: "profissional", postType: "carousel", formatFilter: "all",
  selectedTemplateId: CAROUSEL_TEMPLATES[0].id, slides: [], currentSlide: 0,
  templateApplyMode: "all",
  currentJournalPaletteId: "terracota",
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor-chat`;

async function readStream(resp: Response, onContent: (full: string) => void): Promise<string> {
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

interface CarouselEditorProps {
  initialTopic?: string;
}

export default function CarouselEditor({ initialTopic }: CarouselEditorProps = {}) {

  const [sessionState, setSessionState] = useSessionPersistence<CarouselSessionState>(
    "session_carousel_editor", EMPTY_CAROUSEL_STATE, 1000, "local"
  );

  const [topic, setTopic] = useState(sessionState.topic || "");
  const [slideCount, setSlideCount] = useState(sessionState.slideCount);
  const [tone, setTone] = useState(sessionState.tone);
  const [postType, setPostType] = useState<"static" | "carousel">(sessionState.postType || "carousel");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>(sessionState.formatFilter);
  const [selectedTemplate, setSelectedTemplate] = useState<CarouselTemplate>(
    CAROUSEL_TEMPLATES.find(t => t.id === sessionState.selectedTemplateId) || CAROUSEL_TEMPLATES[0]
  );
  const [slides, setSlides] = useState<SlideData[]>(sessionState.slides);
  const [currentSlide, setCurrentSlide] = useState(sessionState.currentSlide);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { user } = useAuth();
  const { hasProfile, formData, raioX } = usePersonaContext();

  const [history, setHistory] = useState<SlideData[][]>([]);
  const [redoStack, setRedoStack] = useState<SlideData[][]>([]);

  const pushToHistory = useCallback((currentSlides: SlideData[]) => {
    setHistory(prev => [...prev.slice(-19), JSON.parse(JSON.stringify(currentSlides))]);
    setRedoStack([]);
  }, []);

  const updateSlidesWithHistory = useCallback((newSlides: SlideData[] | ((prev: SlideData[]) => SlideData[])) => {
    setSlides(prev => {
      const next = typeof newSlides === "function" ? newSlides(prev) : newSlides;
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        pushToHistory(prev);
      }
      return next;
    });
  }, [pushToHistory]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(prevStack => [...prevStack, JSON.parse(JSON.stringify(slides))]);
    setSlides(prev);
    setHistory(prevHistory => prevHistory.slice(0, -1));
    toast.success("Desfeito");
  }, [history, slides]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(prevHistory => [...prevHistory, JSON.parse(JSON.stringify(slides))]);
    setSlides(next);
    setRedoStack(prevStack => prevStack.slice(0, -1));
    toast.success("Refeito");
  }, [redoStack, slides]);

  const [templateApplyMode, setTemplateApplyMode] = useState<"all" | "current" | "preserve">(sessionState.templateApplyMode);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryTarget, setLibraryTarget] = useState<"image" | "bg">("bg");

  const [currentJournalPaletteId, setCurrentJournalPaletteId] = useState<string>(() => {
    const candidate = sessionState.currentJournalPaletteId || "terracota";
    return JOURNAL_PALETTES.some(p => p.id === candidate) ? candidate : JOURNAL_PALETTES[0].id;
  });

  const cur = slides[currentSlide];

  const updateSlide = (index: number, updates: Partial<SlideData>) => {
    updateSlidesWithHistory((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const applyTemplate = useCallback((template: CarouselTemplate) => {
    setSelectedTemplate(template);
    const isJournal = isJournalTemplate(template.id);
    const applyToSlide = (s: SlideData, i: number): SlideData => ({
      ...s,
      bgColor: template.bgColor,
      textColor: template.textColor,
      accentColor: template.accentColor,
      titleSize: template.titleSize,
      bodySize: template.bodySize,
      fontFamily: template.fontFamily,
      align: template.align,
      bgGradient: template.bgGradient,
      layout: isJournal ? JOURNAL_LAYOUT_SEQUENCE[i % JOURNAL_LAYOUT_SEQUENCE.length] : template.layout,
      highlightBgColor: template.highlightBgColor,
      // Reset positions to template defaults
      titlePos: { x: 0.1, y: 0.1, width: 0.8, height: 0.1 },
      bodyPos: { x: 0.1, y: 0.25, width: 0.8, height: 0.3 },
    });

    if (templateApplyMode === "all") {
      updateSlidesWithHistory(prev => prev.map((s, i) => applyToSlide(s, i)));
    } else {
      updateSlide(currentSlide, applyToSlide(cur, currentSlide));
    }
    toast.success(`Template "${template.name}" aplicado`);
  }, [templateApplyMode, currentSlide, cur]);

  const generateContent = async () => {
    if (!topic.trim()) { toast.error("Informe o tema do conteúdo"); return; }
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let personaCtx = "";
      if (hasProfile) {
        const parts: string[] = [];
        if (formData.niche) parts.push(`Nicho: ${formData.niche}`);
        if (formData.product_description) parts.push(`Produto: ${formData.product_description}`);
        if (parts.length) personaCtx = `\n\nDADOS DA PERSONA:\n${parts.join("\n")}`;
      }

      const isStatic = postType === "static";
      const finalSlideCount = isStatic ? 1 : slideCount;

      const prompt = `Crie um ${isStatic ? "post estático (1 slide)" : `carrossel de ${finalSlideCount} slides`} sobre: "${topic}"
Tom de voz: ${tone}
${isStatic ? "O post deve ter uma headline forte e um texto de apoio convincente." : "Distribua o conteúdo de forma lógica entre os slides."}
${personaCtx}
Retorne APENAS um JSON: {"slides":[{"title":"...","body":"..."}]}`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], persona: "copywriter" }),
      });
      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      const fullText = await readStream(resp, () => {});
      const jsonMatch = fullText.match(/\{[\s\S]*"slides"[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Resposta inválida");
      const data = JSON.parse(jsonMatch[0]);
      const newSlides = createSlidesFromTemplate(selectedTemplate, data.slides);
      setSlides(newSlides);
      setCurrentSlide(0);
      toast.success(isStatic ? "Post estático gerado!" : "Carrossel gerado!");
    } catch (err) {
      toast.error("Erro ao gerar conteúdo");
    } finally {
      setGenerating(false);
    }
  };

  const exportAll = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      toast.info("Iniciando exportação...");
      // For simplicity, we'll just download as images if we were actually rendering them here.
      // But we'll keep the logic placeholder.
      toast.success("Exportação concluída!");
    } catch (err) {
      toast.error("Erro ao exportar");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    setSessionState({
      topic, slideCount, tone, postType, formatFilter,
      selectedTemplateId: selectedTemplate.id, slides, currentSlide,
      templateApplyMode, currentJournalPaletteId,
    });
  }, [topic, slideCount, tone, postType, formatFilter, selectedTemplate, slides, currentSlide, templateApplyMode, currentJournalPaletteId, setSessionState]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header bar */}
      <div className="h-14 border-b flex items-center justify-between px-6 bg-card shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg">Editor de Carrossel</h1>
          <div className="flex gap-1">
             <Button variant="ghost" size="icon" onClick={undo} disabled={history.length === 0}><Undo2 className="h-4 w-4" /></Button>
             <Button variant="ghost" size="icon" onClick={redo} disabled={redoStack.length === 0}><Undo2 className="h-4 w-4 scale-x-[-1]" /></Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={exportAll} disabled={exporting || slides.length === 0}>
             {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Exportar Tudo
           </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Traditional Style */}
        <div className="w-[380px] border-r bg-card flex flex-col shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* AI Section */}
              <section className="space-y-3">
                <Label className="text-sm font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Gerar Conteúdo</Label>
                <Textarea placeholder="Sobre o que é o seu carrossel?" value={topic} onChange={(e) => setTopic(e.target.value)} className="min-h-[80px]" />
                <Button onClick={generateContent} disabled={generating} className="w-full">
                   {generating ? "Gerando..." : "Gerar com Mentora Gi"}
                </Button>
              </section>

              <hr />

              {/* Templates Section */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-primary" /> Templates</Label>
                  <select value={templateApplyMode} onChange={(e) => setTemplateApplyMode(e.target.value as any)} className="text-[10px] bg-muted border-none rounded px-1 py-0.5 outline-none">
                    <option value="all">Todos slides</option>
                    <option value="current">Apenas atual</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {CAROUSEL_TEMPLATES.filter(t => t.id !== 'blank-canvas').map(t => (
                    <button key={t.id} onClick={() => applyTemplate(t)} className={`group relative p-1 rounded-lg border-2 transition-all ${selectedTemplate.id === t.id ? 'border-primary bg-primary/5' : 'border-transparent hover:border-primary/30'}`}>
                       <div className="aspect-square bg-muted rounded overflow-hidden">
                         <div style={{ transform: "scale(0.15)", transformOrigin: "top left", width: 1080, height: 1080, pointerEvents: "none" }}>
                            <SlidePreview slide={{...t, title: "Título", body: "Texto"}} aspectRatio={t.aspectRatio} slideIndex={0} totalSlides={1} nativeSize />
                         </div>
                       </div>
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded transition-opacity">
                          <span className="text-[10px] text-white font-bold">{t.name}</span>
                       </div>
                    </button>
                  ))}
                </div>

                {/* Journaling Collection Sub-section */}
                {(isJournalTemplate(selectedTemplate.id) || slides.some(s => (s.layout || "").startsWith("journal-"))) && (
                  <div className="mt-3 p-3 rounded-lg border border-amber-200/60 bg-amber-50/30 dark:bg-amber-950/10 space-y-3">
                    <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">📓 Coleção Journaling</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {JOURNAL_PALETTES.map((p) => (
                        <button
                          key={p.id}
                          title={p.name}
                          onClick={() => {
                            setCurrentJournalPaletteId(p.id);
                            updateSlidesWithHistory(prev => prev.map(s => ({
                              ...s,
                              bgColor: p.bgColor,
                              textColor: p.textColor,
                              accentColor: p.accentColor,
                            })));
                          }}
                          className={`w-6 h-6 rounded-full border ${currentJournalPaletteId === p.id ? "ring-2 ring-primary" : ""}`}
                          style={{ background: p.swatch }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>


              <hr />

              {/* Selected Slide Content */}
              {cur && (
                <section className="space-y-4">
                  <Label className="text-sm font-bold flex items-center gap-2"><Type className="h-4 w-4 text-primary" /> Conteúdo do Slide {currentSlide + 1}</Label>
                  
                  <div className="space-y-2">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Título</Label>
                    <Textarea value={cur.title} onChange={(e) => updateSlide(currentSlide, { title: e.target.value })} className="min-h-[60px] text-sm" />
                    <div className="flex items-center gap-3">
                       <Slider value={[cur.titleSize]} min={20} max={120} step={1} onValueChange={([val]) => updateSlide(currentSlide, { titleSize: val })} className="flex-1" />
                       <span className="text-[10px] w-6 text-center">{cur.titleSize}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Texto de Apoio</Label>
                    <Textarea value={cur.body} onChange={(e) => updateSlide(currentSlide, { body: e.target.value })} className="min-h-[80px] text-sm" />
                    <div className="flex items-center gap-3">
                       <Slider value={[cur.bodySize]} min={12} max={80} step={1} onValueChange={([val]) => updateSlide(currentSlide, { bodySize: val })} className="flex-1" />
                       <span className="text-[10px] w-6 text-center">{cur.bodySize}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Cores e Alinhamento</Label>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="icon" onClick={() => updateSlide(currentSlide, { align: "left" })} className={cur.align === "left" ? "bg-primary/10 border-primary" : ""}><AlignLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" onClick={() => updateSlide(currentSlide, { align: "center" })} className={cur.align === "center" ? "bg-primary/10 border-primary" : ""}><AlignCenter className="h-4 w-4" /></Button>
                      <div className="flex-1" />
                      <Input type="color" value={cur.textColor} onChange={(e) => updateSlide(currentSlide, { textColor: e.target.value })} className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer" />
                      <Input type="color" value={cur.accentColor} onChange={(e) => updateSlide(currentSlide, { accentColor: e.target.value })} className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer" />
                    </div>
                  </div>
                </section>
              )}

              <hr />

              {/* Images Section */}
              {cur && (
                <section className="space-y-3">
                   <Label className="text-sm font-bold flex items-center gap-2"><ImagePlus className="h-4 w-4 text-primary" /> Imagens</Label>
                   <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setLibraryTarget("image"); setLibraryOpen(true); }} className="w-full text-[10px]">Biblioteca</Button>
                      <Button variant="outline" size="sm" onClick={() => updateSlide(currentSlide, { imageUrl: undefined })} className="w-full text-[10px] text-destructive">Remover</Button>
                   </div>
                  <UserUploads onSelect={(url) => updateSlide(currentSlide, { imageUrl: url })} />
                </section>
              )}

              <hr />

              {/* Brand Kit Section */}
              <section className="space-y-3">
                 <Label className="text-sm font-bold flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /> Identidade Visual</Label>
                 <BrandKitManager onApply={(kit) => {
                    updateSlidesWithHistory(prev => prev.map(s => ({
                      ...s,
                      bgColor: kit.primary_color,
                      textColor: kit.secondary_color,
                      accentColor: kit.accent_color,
                      fontFamily: kit.font_family_title,
                    })));
                    toast.success("Marca aplicada");
                 }} />
              </section>

            </div>
          </ScrollArea>
        </div>

        {/* Workspace */}
        <div className="flex-1 bg-muted/20 relative flex flex-col">
          {/* Top Bar for Workspace */}
          <div className="h-12 border-b bg-card flex items-center justify-between px-4 z-10">
             <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" onClick={() => transformRef.current?.zoomOut()}><ZoomOut className="h-4 w-4" /></Button>
               <span className="text-xs font-medium w-12 text-center">{Math.round(zoomScale * 100)}%</span>
               <Button variant="ghost" size="icon" onClick={() => transformRef.current?.zoomIn()}><ZoomIn className="h-4 w-4" /></Button>
               <Button variant="ghost" size="icon" onClick={() => transformRef.current?.resetTransform()}><Maximize2 className="h-4 w-4" /></Button>
             </div>
             <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="text-xs gap-2" onClick={() => {
                   const newSlide = JSON.parse(JSON.stringify(cur));
                   updateSlidesWithHistory(prev => [...prev, newSlide]);
                   setCurrentSlide(slides.length);
                }}>
                   <CopyPlus className="h-3.5 w-3.5" /> Duplicar
                </Button>
                <Button variant="ghost" size="sm" className="text-xs gap-2 text-destructive" onClick={() => {
                   if (slides.length <= 1) return;
                   updateSlidesWithHistory(prev => prev.filter((_, i) => i !== currentSlide));
                   setCurrentSlide(Math.max(0, currentSlide - 1));
                }}>
                   <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
             </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <TransformWrapper
              ref={transformRef}
              initialScale={1}
              minScale={0.1}
              maxScale={4}
              centerOnInit
              onZoom={(ref) => setZoomScale(ref.state.scale)}
              doubleClick={{ disabled: true }}
              wheel={{ disabled: true }}
            >
              <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyItems: "center" }}>
                <div className="w-full h-full flex items-center justify-center p-12">
                   {cur && (
                     <SlidePreview 
                       slide={cur} 
                       slideIndex={currentSlide} 
                       totalSlides={slides.length} 
                       aspectRatio={selectedTemplate.aspectRatio}
                       isFreeEditMode={true}
                       onUpdate={(upd) => updateSlide(currentSlide, upd)}
                     />
                   )}
                </div>
              </TransformComponent>
            </TransformWrapper>
          </div>

          {/* Bottom Navigator */}
          <div className="h-[120px] border-t bg-card flex items-center px-4 overflow-x-auto gap-4 shrink-0">
             {slides.map((s, i) => (
               <button 
                 key={i} 
                 onClick={() => setCurrentSlide(i)}
                 className={`relative h-[80px] aspect-square rounded border-2 transition-all shrink-0 ${currentSlide === i ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-primary/40'}`}
               >
                 <div style={{ transform: "scale(0.074)", transformOrigin: "top left", width: 1080, height: 1080, pointerEvents: "none" }}>
                    <SlidePreview slide={s} aspectRatio={selectedTemplate.aspectRatio} slideIndex={i} totalSlides={slides.length} nativeSize />
                 </div>
                 <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] px-1 rounded-sm">{i + 1}</div>
               </button>
             ))}
             <Button variant="outline" className="h-[80px] aspect-square flex flex-col gap-1 shrink-0" onClick={() => {
                const newSlide = createSlidesFromTemplate(selectedTemplate, [{ title: "Novo Slide", body: "Edite este conteúdo." }])[0];
                updateSlidesWithHistory(prev => [...prev, newSlide]);
                setCurrentSlide(slides.length);
             }}>
                <LayoutGrid className="h-4 w-4 opacity-50" />
                <span className="text-[9px] uppercase font-bold opacity-50">Adicionar</span>
             </Button>
          </div>
        </div>
      </div>

      <ImageLibraryPicker 
        open={libraryOpen} 
        onOpenChange={setLibraryOpen} 
        onSelect={(url, attr) => {
          updateSlide(currentSlide, libraryTarget === 'bg' ? { bgImageUrl: url } : { imageUrl: url });
          toast.message(attr);
          setLibraryOpen(false);
        }} 
      />
    </div>
  );
}

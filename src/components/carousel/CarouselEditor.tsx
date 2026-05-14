import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Download, Wand2, Loader2, Type,
  AlignCenter, DownloadCloud, ImagePlus, X, Check,
  Square, Monitor, Sparkles, Undo2, LayoutGrid, Layers, Trash2,
  CopyPlus, ZoomIn, ZoomOut, Maximize2, Move, AlignLeft, AlignRight,
  Bold, Italic, Underline, Palette, Search, Settings2, Image as ImageIcon,
  MessageSquare, FileText, ChevronDown, Highlighter, ArrowUpDown,
  Upload, Cloud, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { useAuth } from "@/hooks/useAuth";
import SlidePreview from "./SlidePreview";
import BrandKitManager, { type BrandKit } from "./BrandKitManager";
import {
  CAROUSEL_TEMPLATES, createSlidesFromTemplate, FORMAT_SPECS, FONT_OPTIONS,
  isJournalTemplate, JOURNAL_LAYOUT_SEQUENCE, JOURNAL_PALETTES,
  type SlideData, type CarouselTemplate, type CarouselLayout, type AspectRatio
} from "./CarouselTemplates";
import ImageLibraryPicker from "./ImageLibraryPicker";
import JSZip from "jszip";
import { toPng } from "html-to-image";
import UserUploads from "./UserUploads";

type FormatFilter = "all" | "1:1" | "4:5" | "16:9" | "9:16";

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
    "session_carousel_editor_v2", EMPTY_CAROUSEL_STATE, 1000, "local"
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
  const [selectedSlides, setSelectedSlides] = useState<number[]>([]);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSlideIndex, setExportSlideIndex] = useState<number | null>(null);
  const { user } = useAuth();
  const { hasProfile, formData } = usePersonaContext();

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
  const [libraryDefaultTab, setLibraryDefaultTab] = useState<"search" | "uploads">("search");

  const [currentJournalPaletteId, setCurrentJournalPaletteId] = useState<string>(() => {
    const candidate = sessionState.currentJournalPaletteId || "terracota";
    return JOURNAL_PALETTES.some(p => p.id === candidate) ? candidate : JOURNAL_PALETTES[0].id;
  });

  const cur = slides[currentSlide];

  const updateSlide = (index: number, updates: Partial<SlideData>) => {
    updateSlidesWithHistory((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const applyTemplate = useCallback((template: CarouselTemplate) => {
    // Preserve current selection when changing template
    const currentSelectedIndices = [...selectedSlides];
    
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
      titlePos: { x: 0.1, y: 0.1, width: 0.8, height: 0.1 },
      bodyPos: { x: 0.1, y: 0.25, width: 0.8, height: 0.3 },
    });

    if (templateApplyMode === "all") {
      updateSlidesWithHistory(prev => prev.map((s, i) => applyToSlide(s, i)));
    } else {
      updateSlide(currentSlide, applyToSlide(cur, currentSlide));
    }
    setSelectedSlides(currentSelectedIndices);
    toast.success(`Template "${template.name}" aplicado`);
  }, [templateApplyMode, currentSlide, cur, updateSlidesWithHistory, selectedSlides]);

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
${isStatic ? "O post deve ter uma headline forte e um texto de apoio convincente." : "Distribua o conteúdo de forma lógica entre os slides. Cada slide deve ter um título curto e impactante e um texto de apoio."}
${personaCtx}
Retorne EXATAMENTE um JSON neste formato: {"slides":[{"title":"...","body":"...","caption":"..."}]}
Importante: O campo "caption" deve ser uma legenda persuasiva para o post no Instagram (apenas no primeiro slide). Nos outros slides pode ser vazio.`;

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
      // Mantemos a seleção atual se os índices ainda existirem (útil para regenerar mantendo filtros)
      setSelectedSlides(prev => prev.filter(idx => idx < newSlides.length));
      setCurrentSlide(0);
      toast.success(isStatic ? "Post estático gerado!" : "Carrossel gerado!");
    } catch (err) {
      toast.error("Erro ao gerar conteúdo");
    } finally {
      setGenerating(false);
    }
  };

  const exportSlides = async (indices: number[]) => {
    if (indices.length === 0) { toast.error("Selecione pelo menos um slide"); return; }
    setExporting(true);
    setExportProgress(0);
    try {
      const zip = new JSZip();
      toast.info(`Iniciando exportação de ${indices.length} slides...`);
      
      const spec = FORMAT_SPECS[selectedTemplate.aspectRatio];

      for (let i = 0; i < indices.length; i++) {
        const idx = indices[i];
        setExportProgress(Math.round((i / indices.length) * 100));
        setExportSlideIndex(idx);
        
        // Espera o React renderizar o slide oculto e as imagens carregarem
        // O SlideRenderer já tem lógica de esperar imagens se usarmos o onReady do SlidePreview
        // Mas aqui vamos fazer um polling simples ou esperar um tempo seguro
        await new Promise(r => setTimeout(r, 800)); 

        const el = document.querySelector(".export-slide-root .slide-content-root");
        if (el) {
          try {
            const dataUrl = await toPng(el as HTMLElement, { 
              width: spec.width, 
              height: spec.height,
              pixelRatio: 2, // Melhor qualidade para exportação
              skipFonts: false,
              cacheBust: true,
            });
            const base64Data = dataUrl.split(',')[1];
            zip.file(`slide-${idx + 1}.png`, base64Data, { base64: true });
          } catch (pngErr) {
            console.error(`Erro ao capturar slide ${idx + 1}:`, pngErr);
            toast.error(`Erro no slide ${idx + 1}`);
          }
        } else {
          console.error(`Elemento de exportação não encontrado para o slide ${idx + 1}`);
        }
      }

      setExportProgress(100);
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = indices.length === 1 ? `slide-${indices[0] + 1}.png` : `carrossel-${Date.now()}.zip`;
      
      if (indices.length === 1) {
        // Se for só um, baixamos o PNG direto se possível
        const el = document.querySelector(".export-slide-root .slide-content-root");
        if (el) {
           const dataUrl = await toPng(el as HTMLElement, { width: spec.width, height: spec.height, pixelRatio: 2 });
           const singleLink = document.createElement('a');
           singleLink.href = dataUrl;
           singleLink.download = `slide-${indices[0] + 1}.png`;
           singleLink.click();
        } else {
          link.click();
        }
      } else {
        link.click();
      }
      
      toast.success("Exportação concluída!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Erro ao exportar slides");
    } finally {
      setExporting(false);
      setExportSlideIndex(null);
      setExportProgress(0);
    }
  };

  const exportAll = () => exportSlides(slides.map((_, i) => i));
  const exportSelected = () => exportSlides(selectedSlides);

  useEffect(() => {
    setSessionState({
      topic, slideCount, tone, postType, formatFilter,
      selectedTemplateId: selectedTemplate.id, slides, currentSlide,
      templateApplyMode, currentJournalPaletteId,
    });
  }, [topic, slideCount, tone, postType, formatFilter, selectedTemplate, slides, currentSlide, templateApplyMode, currentJournalPaletteId, setSessionState]);

  const insertTag = (field: 'title' | 'body', tag: string) => {
    const textarea = document.getElementById(`${field}-textarea`) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    
    let newText = "";
    if (tag === 'b') newText = `${before}<b>${selected}</b>${after}`;
    else if (tag === 'i') newText = `${before}<i>${selected}</i>${after}`;
    else if (tag === 'u') newText = `${before}<u>${selected}</u>${after}`;
    else if (tag === 'mark') newText = `${before}<mark style="background-color: ${cur.accentColor}; color: white; padding: 0 4px; border-radius: 2px;">${selected}</mark>${after}`;

    updateSlide(currentSlide, { [field]: newText });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header bar */}
      <div className="h-14 border-b flex items-center justify-between px-6 bg-card shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg">PostStudio Editor</h1>
          <div className="flex gap-1">
             <Button variant="ghost" size="icon" onClick={undo} disabled={history.length === 0}><Undo2 className="h-4 w-4" /></Button>
             <Button variant="ghost" size="icon" onClick={redo} disabled={redoStack.length === 0}><Undo2 className="h-4 w-4 scale-x-[-1]" /></Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {selectedSlides.length > 0 && (
             <Button variant="outline" size="sm" onClick={exportSelected} disabled={exporting} className="border-green-500/50 text-green-600 hover:bg-green-50">
               <Download className="h-4 w-4 mr-2" /> Baixar Selecionados ({selectedSlides.length})
             </Button>
           )}
           <Button variant="outline" size="sm" onClick={exportAll} disabled={exporting || slides.length === 0}>
             {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Exportar Tudo
           </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-full lg:w-[400px] border-r bg-card flex flex-col shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Generation Section */}
              <section className="space-y-4">
                <Label className="text-sm font-bold flex items-center gap-2 text-primary"><Sparkles className="h-4 w-4" /> Criar Conteúdo com Mentora Gi</Label>
                
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground uppercase">O que vamos criar hoje?</Label>
                  <Textarea 
                    placeholder="Ex: 5 dicas para melhorar o engajamento no Instagram..." 
                    value={topic} 
                    onChange={(e) => setTopic(e.target.value)} 
                    className="min-h-[80px]" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Tipo de Post</Label>
                    <div className="flex bg-muted p-1 rounded-md gap-1">
                      <Button 
                        variant={postType === 'static' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className="flex-1 text-[10px] h-7 px-1"
                        onClick={() => setPostType('static')}
                      >
                        <Square className="h-3 w-3 mr-1" /> Estático
                      </Button>
                      <Button 
                        variant={postType === 'carousel' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className="flex-1 text-[10px] h-7 px-1"
                        onClick={() => setPostType('carousel')}
                      >
                        <Layers className="h-3 w-3 mr-1" /> Carrossel
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Tom de Voz</Label>
                    <select 
                      value={tone} 
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full h-9 bg-muted border-none rounded-md px-2 text-xs outline-none"
                    >
                      <option value="profissional">Profissional</option>
                      <option value="amigavel">Amigável</option>
                      <option value="autoridade">Autoridade</option>
                      <option value="persuasivo">Persuasivo</option>
                      <option value="humorado">Humorado</option>
                    </select>
                  </div>
                </div>

                {postType === 'carousel' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[11px] text-muted-foreground uppercase">Quantidade de Slides</Label>
                      <span className="text-xs font-bold">{slideCount}</span>
                    </div>
                    <Slider value={[slideCount]} min={3} max={10} step={1} onValueChange={([val]) => setSlideCount(val)} />
                  </div>
                )}

                <Button onClick={generateContent} disabled={generating} className="w-full gap-2 bg-primary hover:bg-primary/90">
                   {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} 
                   {generating ? "Processando..." : "Gerar Conteúdo"}
                </Button>
              </section>

              <hr />

              {/* Templates Section */}
              <section className="space-y-3">
                <Label className="text-sm font-bold flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-primary" /> Templates</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CAROUSEL_TEMPLATES.filter(t => t.id !== 'blank-canvas').map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => applyTemplate(t)} 
                      className={`group relative p-1 rounded-lg border-2 transition-all ${selectedTemplate.id === t.id ? 'border-primary bg-primary/5' : 'border-transparent hover:border-primary/30'}`}
                    >
                       <div className="aspect-square bg-muted rounded overflow-hidden">
                         <div style={{ transform: "scale(0.15)", transformOrigin: "top left", width: 1080, height: 1080, pointerEvents: "none" }}>
                            <SlidePreview slide={{...t, title: "Título", body: "Texto"}} aspectRatio={t.aspectRatio} slideIndex={0} totalSlides={1} />
                         </div>
                       </div>
                    </button>
                  ))}
                </div>
              </section>

              <hr />

              {/* Media Section */}
              <section className="space-y-3">
                <Label className="text-sm font-bold flex items-center gap-2 text-primary"><ImageIcon className="h-4 w-4" /> Imagens e Fundo</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase">Imagem de Fundo</Label>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px]" onClick={() => { setLibraryTarget("bg"); setLibraryDefaultTab("search"); setLibraryOpen(true); }}>
                        <Search className="h-3 w-3 mr-1" /> Banco
                      </Button>
                      {cur?.bgImageUrl && (
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => updateSlide(currentSlide, { bgImageUrl: undefined })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase">Imagem Template</Label>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px]" onClick={() => { setLibraryTarget("image"); setLibraryDefaultTab("search"); setLibraryOpen(true); }}>
                        <Search className="h-3 w-3 mr-1" /> Banco
                      </Button>
                      {cur?.imageUrl && (
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => updateSlide(currentSlide, { imageUrl: undefined })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full gap-2 text-xs h-8 border-dashed" onClick={() => { setLibraryTarget("bg"); setLibraryDefaultTab("uploads"); setLibraryOpen(true); }}>
                   <Upload className="h-3 w-3" /> Meus Uploads
                </Button>
              </section>

              <hr />

              {/* Detailed Editor */}
              {cur && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" /> Edição Detalhada</Label>
                    <Badge variant="outline" className="text-[10px] uppercase">Slide {currentSlide + 1}</Badge>
                  </div>

                  {/* Title Controls */}
                  <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold uppercase tracking-wider">Título Principal</Label>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertTag('title', 'b')}><Bold className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertTag('title', 'i')}><Italic className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertTag('title', 'u')}><Underline className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertTag('title', 'mark')}><Highlighter className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <Textarea 
                      id="title-textarea"
                      value={cur.title} 
                      onChange={(e) => updateSlide(currentSlide, { title: e.target.value })} 
                      className="min-h-[60px] text-sm bg-background" 
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Tamanho</Label>
                        <Slider value={[cur.titleSize]} min={20} max={120} onValueChange={([v]) => updateSlide(currentSlide, { titleSize: v })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Alinhamento</Label>
                        <div className="flex gap-1">
                          <Button variant={cur.titleAlign === 'left' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => updateSlide(currentSlide, { titleAlign: 'left' })}><AlignLeft className="h-3.5 w-3.5" /></Button>
                          <Button variant={cur.titleAlign === 'center' || !cur.titleAlign ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => updateSlide(currentSlide, { titleAlign: 'center' })}><AlignCenter className="h-3.5 w-3.5" /></Button>
                          <Button variant={cur.titleAlign === 'right' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => updateSlide(currentSlide, { titleAlign: 'right' })}><AlignRight className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Controls */}
                  <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold uppercase tracking-wider">Texto de Apoio</Label>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertTag('body', 'b')}><Bold className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertTag('body', 'i')}><Italic className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertTag('body', 'u')}><Underline className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertTag('body', 'mark')}><Highlighter className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <Textarea 
                      id="body-textarea"
                      value={cur.body} 
                      onChange={(e) => updateSlide(currentSlide, { body: e.target.value })} 
                      className="min-h-[80px] text-sm bg-background" 
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Tamanho</Label>
                        <Slider value={[cur.bodySize]} min={12} max={80} onValueChange={([v]) => updateSlide(currentSlide, { bodySize: v })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Alinhamento</Label>
                        <div className="flex gap-1">
                          <Button variant={cur.bodyAlign === 'left' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => updateSlide(currentSlide, { bodyAlign: 'left' })}><AlignLeft className="h-3.5 w-3.5" /></Button>
                          <Button variant={cur.bodyAlign === 'center' || !cur.bodyAlign ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => updateSlide(currentSlide, { bodyAlign: 'center' })}><AlignCenter className="h-3.5 w-3.5" /></Button>
                          <Button variant={cur.bodyAlign === 'right' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => updateSlide(currentSlide, { bodyAlign: 'right' })}><AlignRight className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Caption Controls (if static or specific slide) */}
                  <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                    <Label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><FileText className="h-3 w-3" /> Legenda Sugerida</Label>
                    <Textarea 
                      value={cur.caption || ""} 
                      onChange={(e) => updateSlide(currentSlide, { caption: e.target.value })} 
                      placeholder="Legenda para o post..."
                      className="min-h-[100px] text-xs bg-background" 
                    />
                  </div>

                  {/* Vertical Alignment and Spacing */}
                  <div className="space-y-4 p-3 rounded-lg border bg-muted/30">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">Alinhamento do Título</Label>
                      <div className="flex bg-muted p-1 rounded-md gap-1">
                        <Button 
                          variant={cur.titleVerticalAlign === 'top' ? 'secondary' : 'ghost'} 
                          size="sm" 
                          className="flex-1 h-7 text-[10px]"
                          onClick={() => updateSlide(currentSlide, { titleVerticalAlign: 'top', titlePos: undefined })}
                        >
                          Topo
                        </Button>
                        <Button 
                          variant={cur.titleVerticalAlign === 'center' || !cur.titleVerticalAlign ? 'secondary' : 'ghost'} 
                          size="sm" 
                          className="flex-1 h-7 text-[10px]"
                          onClick={() => updateSlide(currentSlide, { titleVerticalAlign: 'center', titlePos: undefined })}
                        >
                          Meio
                        </Button>
                        <Button 
                          variant={cur.titleVerticalAlign === 'bottom' ? 'secondary' : 'ghost'} 
                          size="sm" 
                          className="flex-1 h-7 text-[10px]"
                          onClick={() => updateSlide(currentSlide, { titleVerticalAlign: 'bottom', titlePos: undefined })}
                        >
                          Baixo
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">Alinhamento do Corpo</Label>
                      <div className="flex bg-muted p-1 rounded-md gap-1">
                        <Button 
                          variant={cur.bodyVerticalAlign === 'top' ? 'secondary' : 'ghost'} 
                          size="sm" 
                          className="flex-1 h-7 text-[10px]"
                          onClick={() => updateSlide(currentSlide, { bodyVerticalAlign: 'top', bodyPos: undefined })}
                        >
                          Topo
                        </Button>
                        <Button 
                          variant={cur.bodyVerticalAlign === 'center' || !cur.bodyVerticalAlign ? 'secondary' : 'ghost'} 
                          size="sm" 
                          className="flex-1 h-7 text-[10px]"
                          onClick={() => updateSlide(currentSlide, { bodyVerticalAlign: 'center', bodyPos: undefined })}
                        >
                          Meio
                        </Button>
                        <Button 
                          variant={cur.bodyVerticalAlign === 'bottom' ? 'secondary' : 'ghost'} 
                          size="sm" 
                          className="flex-1 h-7 text-[10px]"
                          onClick={() => updateSlide(currentSlide, { bodyVerticalAlign: 'bottom', bodyPos: undefined })}
                        >
                          Baixo
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><ArrowUpDown className="h-3 w-3" /> Espaçamento Vertical</Label>
                        <span className="text-[10px] font-mono">{cur.gap || 0}px</span>
                      </div>
                      <Slider value={[cur.gap || 0]} min={-20} max={100} step={1} onValueChange={([v]) => updateSlide(currentSlide, { gap: v })} />
                    </div>
                  </div>

                  {/* Appearance Controls */}
                  <div className="space-y-4 p-3 rounded-lg border bg-muted/30">
                    <Label className="text-[11px] font-bold uppercase tracking-wider">Cores e Fundo</Label>
                    <div className="grid grid-cols-3 gap-2">
                       <div className="space-y-1">
                          <Label className="text-[9px] uppercase">Texto</Label>
                          <div className="flex items-center gap-1.5 p-1 bg-background rounded border">
                            <Input type="color" value={cur.textColor} onChange={(e) => updateSlide(currentSlide, { textColor: e.target.value })} className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer" />
                            <span className="text-[9px] truncate">{cur.textColor}</span>
                          </div>
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[9px] uppercase">Destaque</Label>
                          <div className="flex items-center gap-1.5 p-1 bg-background rounded border">
                            <Input type="color" value={cur.accentColor} onChange={(e) => updateSlide(currentSlide, { accentColor: e.target.value })} className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer" />
                            <span className="text-[9px] truncate">{cur.accentColor}</span>
                          </div>
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[9px] uppercase">Fundo</Label>
                          <div className="flex items-center gap-1.5 p-1 bg-background rounded border">
                            <Input type="color" value={cur.bgColor} onChange={(e) => updateSlide(currentSlide, { bgColor: e.target.value, bgGradient: undefined })} className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer" />
                            <span className="text-[9px] truncate">{cur.bgColor}</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <Label className="text-[10px] text-muted-foreground uppercase">Fonte do Template</Label>
                       <select 
                         value={cur.fontFamily} 
                         onChange={(e) => updateSlide(currentSlide, { fontFamily: e.target.value })}
                         className="w-full h-8 bg-background border rounded-md px-2 text-[11px] outline-none"
                       >
                         {FONT_OPTIONS.map(f => <option key={f.name} value={f.family}>{f.name}</option>)}
                       </select>
                    </div>
                  </div>
                </section>
              )}

              <hr />

              {/* Brand Kit Section */}
              <section className="space-y-3">
                 <Label className="text-sm font-bold flex items-center gap-2 text-primary"><Palette className="h-4 w-4" /> Identidade Visual</Label>
                 <BrandKitManager onApply={(kit) => {
                    updateSlidesWithHistory(prev => prev.map(s => ({
                      ...s,
                      bgColor: kit.primary_color,
                      textColor: kit.secondary_color,
                      accentColor: kit.accent_color,
                      fontFamily: kit.font_family_title,
                    })));
                    toast.success("Marca aplicada a todos os slides");
                 }} />
              </section>

            </div>
          </ScrollArea>
        </div>

        {/* Main Workspace (Simplified) */}
        <div className="flex-1 bg-muted/40 relative flex flex-col overflow-hidden">
          {/* Workspace Header */}
          <div className="h-12 border-b bg-card flex items-center justify-between px-4 z-10 shrink-0">
             <div className="flex items-center gap-4">
               <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                 {selectedTemplate.aspectRatio} • {slides.length} Slides
               </Badge>
               <div className="flex items-center gap-1.5 border rounded-md p-1 bg-muted/50">
                 {(['1:1', '4:5', '9:16', '16:9'] as AspectRatio[]).map((ratio) => (
                   <Button 
                    key={ratio}
                    variant={selectedTemplate.aspectRatio === ratio ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 text-[10px] px-2"
                     onClick={() => {
                       const currentSelectedIndices = [...selectedSlides];
                       const newT = { ...selectedTemplate, aspectRatio: ratio };
                       setSelectedTemplate(newT);
                       setSelectedSlides(currentSelectedIndices);
                       toast.success(`Formato ${ratio} selecionado`);
                     }}
                    >
                     {ratio}
                    </Button>
                 ))}
               </div>
             </div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-xs gap-2" onClick={() => {
                   const newSlide = JSON.parse(JSON.stringify(cur));
                   updateSlidesWithHistory(prev => [...prev.slice(0, currentSlide + 1), newSlide, ...prev.slice(currentSlide + 1)]);
                   setCurrentSlide(currentSlide + 1);
                   toast.success("Slide duplicado");
                }}>
                   <CopyPlus className="h-3.5 w-3.5" /> Duplicar
                </Button>
                <Button variant="ghost" size="sm" className="text-xs gap-2 text-destructive" onClick={() => {
                   if (slides.length <= 1) return;
                   updateSlidesWithHistory(prev => prev.filter((_, i) => i !== currentSlide));
                   setCurrentSlide(Math.max(0, currentSlide - 1));
                   toast.info("Slide removido");
                }}>
                   <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
             </div>
          </div>

           {/* Centered Preview */}
           <div className="flex-1 overflow-hidden flex items-center justify-center p-2 md:p-6 bg-[#f5f7f9] dark:bg-zinc-950">
              {/* Progress Bar for Export */}
              {exporting && (
                <div className="absolute top-0 left-0 right-0 z-50 p-3 bg-background/95 backdrop-blur-sm border-b shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="max-w-md mx-auto space-y-2">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-primary">
                      <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Gerando imagens...</span>
                      <span>{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} className="h-1.5" />
                  </div>
                </div>
              )}

              <div className="relative w-full h-full flex items-center justify-center">
                 {cur ? (
                  <div className="shadow-2xl rounded-sm overflow-hidden bg-white dark:bg-zinc-900 border transition-all duration-300 w-full h-full flex items-center justify-center relative">
                    <SlidePreview 
                      slide={cur} 
                      slideIndex={currentSlide} 
                      totalSlides={slides.length} 
                      aspectRatio={selectedTemplate.aspectRatio}
                      onUpdate={(upd) => updateSlide(currentSlide, upd)}
                      isFreeEditMode={false}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full max-w-[400px] max-h-[400px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-card/50">
                    <Wand2 className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-sm">Gere conteúdo para começar</p>
                  </div>
                )}
             </div>
          </div>

          {/* Bottom Navigator */}
          <div className="h-10 border-t bg-card/50 flex items-center justify-between px-4 shrink-0">
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold uppercase text-muted-foreground">Slides</span>
               <Badge variant="secondary" className="text-[10px]">{slides.length}</Badge>
             </div>
             <div className="flex items-center gap-2">
               <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setSelectedSlides(slides.map((_, i) => i))}>Selecionar Todos</Button>
               <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setSelectedSlides([])}>Limpar Seleção</Button>
             </div>
          </div>
          <div className="h-[140px] border-t bg-card flex items-center px-4 overflow-x-auto gap-4 shrink-0 pb-2 custom-scrollbar">
             {slides.map((s, i) => {
               const spec = FORMAT_SPECS[selectedTemplate.aspectRatio];
               const thumbScale = Math.min(80 / spec.width, 80 / spec.height);
               const isSelected = selectedSlides.includes(i);
               
               return (
                 <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                   <button 
                     onClick={() => setCurrentSlide(i)}
                     className={`relative h-[90px] w-[90px] rounded-md border-2 transition-all flex items-center justify-center bg-muted/20 ${currentSlide === i ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-transparent hover:border-primary/40'}`}
                   >
                     <div style={{ 
                       transform: `scale(${thumbScale})`, 
                       width: spec.width, 
                       height: spec.height, 
                       pointerEvents: "none",
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center'
                     }}>
                        <SlidePreview slide={s} aspectRatio={selectedTemplate.aspectRatio} slideIndex={i} totalSlides={slides.length} nativeSize />
                     </div>
                     <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-md z-10">{i + 1}</div>
                     
                     <div 
                       onClick={(e) => {
                         e.stopPropagation();
                         setSelectedSlides(prev => isSelected ? prev.filter(idx => idx !== i) : [...prev, i]);
                       }}
                       className={`absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center border shadow-sm cursor-pointer z-10 transition-colors ${isSelected ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-gray-300 text-transparent'}`}
                     >
                       <Check className="h-3 w-3" />
                     </div>
                   </button>
                 </div>
               );
             })}
             <Button variant="outline" className="h-[90px] aspect-square flex flex-col gap-1 shrink-0 rounded-md border-dashed" onClick={() => {
                const newSlide = createSlidesFromTemplate(selectedTemplate, [{ title: "Novo Slide", body: "Edite este conteúdo clicando no texto." }])[0];
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
        defaultTab={libraryDefaultTab}
        onSelect={(url) => {
          updateSlide(currentSlide, libraryTarget === "bg" ? { bgImageUrl: url } : { imageUrl: url });
          setLibraryOpen(false);
        }} 
      />

      {/* Hidden container for high-quality export rendering */}
      {exportSlideIndex !== null && (
        <div className="export-slide-root fixed left-[-9999px] top-0 pointer-events-none" style={{ width: FORMAT_SPECS[selectedTemplate.aspectRatio].width, height: FORMAT_SPECS[selectedTemplate.aspectRatio].height }}>
          <SlidePreview 
            slide={slides[exportSlideIndex]} 
            slideIndex={exportSlideIndex} 
            totalSlides={slides.length} 
            aspectRatio={selectedTemplate.aspectRatio}
            nativeSize={true}
          />
        </div>
      )}
    </div>
  );
}

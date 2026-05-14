import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { toPng } from "html-to-image";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import {
  ChevronLeft, ChevronRight, Download, Wand2, Loader2, Paintbrush, Type,
  AlignLeft, AlignCenter, DownloadCloud, ImagePlus, User, X, Smartphone,
  Square, Monitor, Sparkles, Send, ChevronDown, ChevronUp,
  Bold, Italic, Underline, ArrowUpFromLine, AlignVerticalSpaceAround, ArrowDownFromLine, Palette, Copy,
  CopyPlus, Trash2, Maximize, Minimize, Undo2, CheckCircle2, LayoutGrid, Layers, MousePointer2, PlusCircle,
  Search, ZoomIn, ZoomOut, Maximize2
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { SessionIndicator } from "@/components/SessionIndicator";
import { useAuth } from "@/hooks/useAuth";
import SlidePreview from "./SlidePreview";
import CanvasElementsLibrary from "./CanvasElementsLibrary";
import { scopedLocal } from "@/lib/userScopedKey";
import TemplatePreviewTooltip from "./TemplatePreviewTooltip";
import ImageAdjustPanel, { type ImageAdjustValues } from "./ImageAdjustPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CAROUSEL_TEMPLATES, createSlidesFromTemplate, FORMAT_SPECS, FONT_OPTIONS, GRADIENT_PRESETS,
  JOURNAL_TEMPLATE_IDS, JOURNAL_LAYOUT_SEQUENCE, isJournalTemplate,
  JOURNAL_PALETTES, applyPaletteToSlide, buildJournalSampleSlides,
  JOURNAL_SAMPLE_THEMES, type JournalPalette,
  type SlideData, type CarouselTemplate, type CarouselLayout, type AspectRatio, type LayerData,
} from "./CarouselTemplates";
import ImageLibraryPicker from "./ImageLibraryPicker";
import JournalCollectionExporter, { type JournalExporterHandle } from "./JournalCollectionExporter";
import JSZip from "jszip";
import LayerList from "./LayerList";
import UserUploads from "./UserUploads";
import BrandKitManager, { type BrandKit } from "./BrandKitManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";

const IMAGE_LAYOUTS: CarouselLayout[] = ["image-bg", "editorial", "journal-photo-card", "journal-torn-paper"];
const MULTI_IMAGE_LAYOUTS: CarouselLayout[] = ["photo-grid", "tweet-post"];
const PROFILE_LAYOUTS: CarouselLayout[] = ["profile-post", "photo-grid", "tweet-post", "prompt-card", "sticker-card"];
const HIGHLIGHT_LAYOUTS: CarouselLayout[] = ["sales-highlight"];
const BG_IMAGE_LAYOUTS: CarouselLayout[] = ["journal-photo-card", "journal-torn-paper", "image-bg"];

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
  giMessages: { role: "user" | "assistant"; content: string }[];
  giOpen: boolean;
  templateApplyMode: "all" | "current" | "preserve";
  currentJournalPaletteId: string;
}

const EMPTY_CAROUSEL_STATE: CarouselSessionState = {
  topic: "", slideCount: 5, tone: "profissional", formatFilter: "all",
  selectedTemplateId: CAROUSEL_TEMPLATES[0].id, slides: [], currentSlide: 0,
  giMessages: [], giOpen: false, templateApplyMode: "all",
  currentJournalPaletteId: "terracota",
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
    "session_carousel_editor", EMPTY_CAROUSEL_STATE, 1000, "local"
  );

  // Restore session FIRST. Only fall back to initialTopic when there is no saved session.
  const [topic, setTopic] = useState(sessionState.topic || initialTopic || "");
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
  const isMobile = useIsMobile();
  const { hasProfile, formData, raioX } = usePersonaContext();
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const [zoomScale, setZoomScale] = useState(1);

  // Supabase Sync logic
  useEffect(() => {
    if (!user || slides.length === 0) return;

    const timer = setTimeout(async () => {
      const designData: any = {
        slides,
        topic,
        slideCount,
        tone,
        selectedTemplateId: selectedTemplate.id,
      };

      try {
        if (projectId) {
          await supabase
            .from("carousel_designs")
            .update({ data: designData, updated_at: new Date().toISOString() })
            .eq("id", projectId);
        } else {
          const { data, error } = await supabase
            .from("carousel_designs")
            .insert({
              user_id: user.id,
              name: topic || "Projeto de Carrossel",
              data: designData,
            } as any)
            .select("id")
            .single();

          if (data) setProjectId((data as any).id);
        }
      } catch (err) {
        console.error("Failed to sync carousel to Supabase:", err);
      }
    }, 5000); 

    return () => clearTimeout(timer);
  }, [slides, topic, slideCount, tone, selectedTemplate.id, user, projectId]);

  // Mentora Gi mini-chat state — persisted
  const [giOpen, setGiOpen] = useState(sessionState.giOpen);
  const [giInput, setGiInput] = useState("");
  const [giMessages, setGiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>(sessionState.giMessages);
  const [giLoading, setGiLoading] = useState(false);
  const [isFreeEditMode, setIsFreeEditMode] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState("templates");
  const [activeEditorTab, setActiveEditorTab] = useState("templates");
  const [searchParams] = useSearchParams();
  
  // History state
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

  // Persisted template apply mode
  const [templateApplyMode, setTemplateApplyMode] = useState<"all" | "current" | "preserve">(sessionState.templateApplyMode);

  const sidebarTabs = [
    { id: "templates", label: "Design", icon: LayoutGrid },
    { id: "elements", label: "Elementos", icon: Square },
    { id: "text", label: "Texto", icon: Type },
    { id: "brand", label: "Marca", icon: Palette },
    { id: "uploads", label: "Mídia", icon: ImagePlus },
    { id: "layers", label: "Camadas", icon: Layers },
  ];
  const applyTemplate = useCallback((template: CarouselTemplate) => {
    if (templateApplyMode === "all") {
      applyTemplateToAll(template);
    } else if (templateApplyMode === "current") {
      applyTemplateToSlide(template, currentSlide);
    } else {
      applyTemplatePreservingFormatting(template, currentSlide);
    }
    toast.success(`Template "${template.name}" aplicado`);
  }, [templateApplyMode, currentSlide]);

  // "Create from scratch" detection
  useEffect(() => {
    if (searchParams.get("mode") === "blank") {
      const blankTemplate = CAROUSEL_TEMPLATES.find(t => t.id === "blank-canvas") || CAROUSEL_TEMPLATES[0];
      setSelectedTemplate(blankTemplate);
      const initialSlides = createSlidesFromTemplate(blankTemplate, [{ title: "Seu Título", body: "Seu subtítulo ou texto de apoio aqui." }]);
      setSlides(initialSlides);
      setIsFreeEditMode(true);
      setActiveEditorTab("layers");
    }
  }, [searchParams]);

  const applyBrandKit = useCallback((kit: BrandKit) => {
    updateSlidesWithHistory(prev => prev.map(s => ({
      ...s,
      bgColor: kit.primary_color,
      textColor: kit.secondary_color,
      accentColor: kit.accent_color,
      fontFamily: kit.font_family_title,
    })));
    toast.success("Identidade Visual aplicada ao carrossel");
  }, []);

  const addLayer = useCallback((layerType: LayerData["type"], content?: string) => {
    const newLayer: LayerData = {
      id: Math.random().toString(36).substring(7),
      type: layerType,
      content: content || (layerType === 'text' ? 'Novo Texto' : ''),
      x: 0.25,
      y: 0.25,
      width: layerType === 'image' ? 0.3 : 0.4,
      height: layerType === 'image' ? 0.3 : 0.1,
      style: layerType === 'shape' ? { backgroundColor: selectedTemplate.accentColor, borderRadius: '8px' } : {}
    };

    updateSlidesWithHistory(prev => prev.map((s, i) => i === currentSlide ? {
      ...s,
      layers: [...(s.layers || []), newLayer]
    } : s));
    
    setSelectedLayerId(newLayer.id);
    setIsFreeEditMode(true);
    toast.success("Camada adicionada");
  }, [currentSlide, selectedTemplate.accentColor]);

  // Persisted template apply mode
  // templateApplyMode is already declared above

  // Image library + collection export state
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryTarget, setLibraryTarget] = useState<"image" | "bg">("bg");
  const [exportingCollection, setExportingCollection] = useState(false);

  // Current journal palette (persisted) — derived from id, source-of-truth is the id.
  // Validates the persisted id against the current palette list so renames/removals fall back gracefully.
  const [currentJournalPaletteId, setCurrentJournalPaletteId] = useState<string>(() => {
    const candidate = sessionState.currentJournalPaletteId || "terracota";
    return JOURNAL_PALETTES.some(p => p.id === candidate) ? candidate : JOURNAL_PALETTES[0].id;
  });
  const currentJournalPalette = useMemo(
    () => JOURNAL_PALETTES.find(p => p.id === currentJournalPaletteId) || JOURNAL_PALETTES[0],
    [currentJournalPaletteId]
  );

  // Offline sample-text theme selector (for "📋 Texto exemplo" button)
  const [sampleThemeId, setSampleThemeId] = useState<string>("generico");
  // Real mini-thumb slides for the 6 layouts using current palette (memoized for perf)
  const journalThumbSlides = useMemo(
    () => buildJournalSampleSlides(currentJournalPalette).map(s => ({
      ...s,
      title: s.title.length > 40 ? s.title.slice(0, 38) + "…" : s.title,
      body: s.body.length > 60 ? s.body.slice(0, 58) + "…" : s.body,
    })),
    [currentJournalPalette]
  );

  // Off-screen exporter (mounted only during export)
  const [exporterMounted, setExporterMounted] = useState(false);
  const exporterRef = useRef<JournalExporterHandle>(null);

  const applyJournalPalette = useCallback((palette: JournalPalette) => {
    setCurrentJournalPaletteId(palette.id);
    updateSlidesWithHistory(prev => prev.map(s => {
      const isJournalSlide = isJournalTemplate(selectedTemplate.id) || (s.layout || "").startsWith("journal-");
      if (!isJournalSlide) return s;
      // Preserve user color customizations: only swap base palette colors,
      // keep titleColor/bodyColor if user has explicitly set them.
      return {
        ...s,
        bgColor: palette.bgColor,
        textColor: palette.textColor,
        accentColor: palette.accentColor,
        // titleColor / bodyColor / highlightBgColor: NOT touched
      };
    }));
    toast.success(`Paleta "${palette.name}" aplicada`);
  }, [selectedTemplate.id]);

  const exportJournalCollection = useCallback(async () => {
    setExportingCollection(true);
    setExporterMounted(true);
    try {
      // Wait for the off-screen exporter to mount and the browser to commit a frame
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      // Pre-load all fonts the journaling templates rely on
      try {
        await Promise.all([
          (document as any).fonts?.load?.('700 64px "Playfair Display"'),
          (document as any).fonts?.load?.('600 48px "Cormorant Garamond"'),
          (document as any).fonts?.load?.('400 48px "Caveat"'),
          (document as any).fonts?.load?.('700 32px "Inter"'),
          (document as any).fonts?.load?.('400 36px "Bebas Neue"'),
        ]);
      } catch { /* ignore */ }
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 500));

      const nodes = exporterRef.current?.getNodes() || [];
      if (!nodes.length || nodes.some((n) => !n)) {
        throw new Error("Falha ao montar prévia da coleção");
      }

      const { toPng } = await import("html-to-image");
      const zip = new JSZip();

      // Wait for all <img> inside each node to finish loading
      const waitForImages = async (root: HTMLElement) => {
        const imgs = Array.from(root.querySelectorAll("img"));
        await Promise.all(imgs.map(img =>
          (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0
            ? Promise.resolve()
            : new Promise<void>((r) => {
                const done = () => r();
                img.addEventListener("load", done, { once: true });
                img.addEventListener("error", done, { once: true });
              })
        ));
      };

      const captureOnce = (node: HTMLDivElement) => toPng(node, {
        width: 1080,
        height: 1080,
        canvasWidth: 1080,
        canvasHeight: 1080,
        pixelRatio: 1,
        cacheBust: true,
        style: {
          transform: "none",
          position: "static",
          margin: "0",
          padding: "0",
          width: "1080px",
          height: "1080px",
        },
      });

      // Warm-up capture (first render of html-to-image sometimes misses fonts)
      try { await captureOnce(nodes[0] as HTMLDivElement); } catch { /* ignore */ }

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as HTMLDivElement;
        const layoutName = JOURNAL_LAYOUT_SEQUENCE[i];
        await waitForImages(node);

        let dataUrl = await captureOnce(node);

        // Validate dimensions; retry once if off
        const ok = await new Promise<boolean>((r) => {
          const im = new Image();
          im.onload = () => r(im.naturalWidth === 1080 && im.naturalHeight === 1080);
          im.onerror = () => r(false);
          im.src = dataUrl;
        });
        if (!ok) {
          await new Promise((r) => setTimeout(r, 200));
          dataUrl = await captureOnce(node);
        }

        const blob = await (await fetch(dataUrl)).blob();
        const fileName = `${String(i + 1).padStart(2, "0")}-${layoutName}.png`;
        zip.file(fileName, blob);
      }

      const palette = currentJournalPalette;
      const readme = [
        "Coleção Journaling — Mentora Gi",
        "",
        `Paleta: ${palette.emoji} ${palette.name}`,
        `  - Fundo:    ${palette.bgColor}`,
        `  - Texto:    ${palette.textColor}`,
        `  - Destaque: ${palette.accentColor}`,
        "",
        "Layouts (na ordem narrativa):",
        ...JOURNAL_LAYOUT_SEQUENCE.map((l, i) => `  ${i + 1}. ${l}`),
        "",
        "Conteúdo de exemplo gerado automaticamente.",
      ].join("\n");
      zip.file("README.txt", readme);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `colecao-journaling-${palette.id}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Prévia da Coleção Journaling exportada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao exportar coleção");
    } finally {
      setExporterMounted(false);
      setExportingCollection(false);
    }
  }, [currentJournalPalette]);

  // Snapshot for undo of last template change
  const lastSlidesSnapshot = useRef<SlideData[] | null>(null);
  const lastTemplateSnapshot = useRef<CarouselTemplate | null>(null);

  // Snapshot for undo of last single-slide image change/removal/reset
  const snapshotSlideForUndo = useCallback((index: number, label: string) => {
    const before = slides[index];
    if (!before) return;
    const snap = { ...before };
    toast.success(label, {
      duration: 6000,
      action: {
        label: "Desfazer",
        onClick: () => {
          setSlides(prev => prev.map((s, i) => (i === index ? snap : s)));
        },
      },
    });
  }, [slides]);

  // Pending topic confirmation (when a new initialTopic arrives but user already has work in progress)
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const lastAppliedInitialTopic = useRef<string>(sessionState.topic || initialTopic || "");

  // React to changes in initialTopic (e.g., user clicks a new topic in MentorChat).
  useEffect(() => {
    if (!initialTopic) return;
    if (initialTopic === lastAppliedInitialTopic.current) return;
    if (slides.length > 0 && topic && initialTopic !== topic) {
      // User has an existing carousel — ask before overwriting
      setPendingTopic(initialTopic);
    } else {
      setTopic(initialTopic);
      lastAppliedInitialTopic.current = initialTopic;
    }
  }, [initialTopic]);

  useEffect(() => {
    setSessionState({
      topic, slideCount, tone, formatFilter,
      selectedTemplateId: selectedTemplate.id, slides, currentSlide,
      giMessages, giOpen, templateApplyMode,
      currentJournalPaletteId,
    });
  }, [topic, slideCount, tone, formatFilter, selectedTemplate, slides, currentSlide, giMessages, giOpen, templateApplyMode, currentJournalPaletteId, setSessionState]);

  // Apply the entire Journaling Collection (6 slides, 6 layouts in order, current palette).
  // keepContent=true → preserves user's title/body/images/profile; only swaps layout + colors.
  const applyJournalCollection = useCallback((
    template: CarouselTemplate,
    opts: { keepContent: boolean; themeId?: string; forceSampleText?: boolean } = { keepContent: true },
  ) => {
    const palette = currentJournalPalette;
    const sample = buildJournalSampleSlides(palette, slides[0]?.profileHandle, opts.themeId);
    const newSlides: SlideData[] = sample.map((s, i) => {
      const existing = slides[i];
      if (opts.keepContent && existing) {
        return {
          ...existing,
          layout: s.layout,
          bgColor: palette.bgColor,
          textColor: palette.textColor,
          accentColor: palette.accentColor,
          fontFamily: template.fontFamily,
          body: existing.body || s.body,
          title: existing.title || s.title,
        };
      }
      // Replace mode (texto modelo). When forceSampleText, the chosen theme overrides existing text.
      return {
        ...s,
        title: opts.forceSampleText ? s.title : (existing?.title || s.title),
        body: opts.forceSampleText ? s.body : (existing?.body || s.body),
        fontFamily: template.fontFamily,
        titleSize: template.titleSize,
        bodySize: template.bodySize,
        align: template.align,
        imageUrl: existing?.imageUrl,
        bgImageUrl: existing?.bgImageUrl,
        profileHandle: existing?.profileHandle || s.profileHandle,
        profileName: existing?.profileName,
        profileImageUrl: existing?.profileImageUrl,
      };
    });
    setSelectedTemplate(template);
    setSlides(newSlides);
    setCurrentSlide(0);
    slideRefs.current = new Array(newSlides.length).fill(null);
    toast.success(
      opts.keepContent
        ? "Coleção aplicada — seu conteúdo foi preservado"
        : "Coleção aplicada com texto modelo (6 slides)"
    );
  }, [currentJournalPalette, slides]);

  // Generate the full Journaling Collection using Mentora Gi:
  // forces 6 slides, distributes the 6 narrative layouts, applies current palette.
  const [generatingJournalColl, setGeneratingJournalColl] = useState(false);
  const generateJournalCollection = useCallback(async () => {
    if (!topic.trim()) {
      toast.error("Informe o tema do carrossel acima primeiro");
      return;
    }
    const journalTemplate =
      CAROUSEL_TEMPLATES.find(t => isJournalTemplate(t.id) && t.id === selectedTemplate.id)
      || CAROUSEL_TEMPLATES.find(t => isJournalTemplate(t.id));
    if (!journalTemplate) {
      toast.error("Template Journaling não encontrado");
      return;
    }
    setGeneratingJournalColl(true);
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
      const prompt = `Crie um carrossel de EXATAMENTE 6 slides sobre: "${topic}"

Tom: ${tone}${personaCtx}

CONTEXTO VISUAL: Os 6 slides serão renderizados em layouts visuais distintos de uma coleção "Journaling" estilo caderno artesanal:
1. Capa com fita adesiva (gancho forte e curto)
2. Página de caderno com selo dourado (amplificação da dor)
3. Foto + card sobreposto (revelação de valor)
4. Espiral metálico (dica prática / framework)
5. Papel rasgado sobre foto (prova/transformação)
6. Envelope de cera (CTA final, fecha o arco)

REGRAS OBRIGATÓRIAS:
1. ARCO NARRATIVO consistente entre os 6 slides
2. Títulos curtos e impactantes (6-12 palavras), perfeitos para leitura rápida em página de caderno
3. Corpo enxuto (3-5 linhas), íntimo e conversacional, como uma anotação pessoal
4. Conexão clara entre slides
5. Slide 6 com CTA irresistível

Retorne APENAS um JSON válido sem markdown:
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
      const jsonMatch = fullText.match(/\{[\s\S]*"slides"[\s\S]*\}/);
      if (!jsonMatch) throw new Error("IA não retornou JSON válido");
      const data = JSON.parse(jsonMatch[0]) as { slides: { title: string; body: string }[] };
      if (!data.slides?.length) throw new Error("Resposta sem slides");

      // Force exactly 6 slides; pad/truncate if needed
      const six = data.slides.slice(0, 6);
      while (six.length < 6) six.push({ title: "", body: "" });

      const palette = currentJournalPalette;
      const built = createSlidesFromTemplate(journalTemplate, six).map(s => ({
        ...s,
        bgColor: palette.bgColor,
        textColor: palette.textColor,
        accentColor: palette.accentColor,
      }));
      setSelectedTemplate(journalTemplate);
      setSlides(built);
      setCurrentSlide(0);
      slideRefs.current = new Array(built.length).fill(null);
      toast.success("Coleção Journaling gerada com Mentora Gi");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Erro ao gerar coleção");
    } finally {
      setGeneratingJournalColl(false);
    }
  }, [topic, tone, selectedTemplate, currentJournalPalette, hasProfile, formData, raioX]);

  // Apply only one journal layout to the current slide (used by thumbnails).
  // Preserves the user's title/body/imageUrl/bgImageUrl AND custom titleColor/bodyColor.
  const applyJournalLayoutToCurrent = useCallback((layout: CarouselLayout) => {
    const palette = currentJournalPalette;
    setSlides(prev => prev.map((s, i) => i === currentSlide ? {
      ...s,
      layout,
      bgColor: palette.bgColor,
      textColor: palette.textColor,
      accentColor: palette.accentColor,
      // Preserve titleColor / bodyColor / titleBold / highlightBgColor / etc.
    } : s));
    toast.success(`Layout aplicado ao slide ${currentSlide + 1}`);
  }, [currentJournalPalette, currentSlide]);

  // Library picker target → applies returned data URL to current slide
  const handleLibrarySelect = useCallback((dataUrl: string, attribution: string) => {
    if (libraryTarget === "bg") {
      snapshotSlideForUndo(currentSlide, "Imagem de fundo aplicada do banco");
      updateSlide(currentSlide, { bgImageUrl: dataUrl });
    } else {
      snapshotSlideForUndo(currentSlide, "Imagem aplicada do banco");
      updateSlide(currentSlide, { imageUrl: dataUrl });
    }
    toast.message(attribution, { duration: 5000 });
  }, [libraryTarget, currentSlide]);

  

  const setSlideRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => { slideRefs.current[index] = el; },
    []
  );

  // Show dedicated "Coleção Journaling" section when the active format allows 1:1.
  const showJournalSection = formatFilter === "all" || formatFilter === "1:1";
  const journalTemplates = JOURNAL_TEMPLATE_IDS
    .map(id => CAROUSEL_TEMPLATES.find(t => t.id === id))
    .filter((t): t is CarouselTemplate => !!t);
  const filteredTemplates = CAROUSEL_TEMPLATES.filter((t) => {
    if (formatFilter !== "all" && t.aspectRatio !== formatFilter) return false;
    // When the dedicated Journaling section is visible, hide journals from the main grid
    // to avoid duplication on the same screen.
    if (showJournalSection && isJournalTemplate(t.id)) return false;
    return true;
  });

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
2. Títulos: 8-15 palavras, impactantes e emocionais. Substitua o título original do template por este conteúdo.
3. Subtítulos/Corpo: 4-6 linhas com conteúdo denso, exemplos e linguagem conversacional. Substitua o subtítulo do template.
4. Cada slide deve ter conexão narrativa com o anterior.
5. O último slide DEVE ter um CTA irresistível.
6. Retorne APENAS um JSON válido sem markdown: {"slides":[{"title":"...","body":"..."}]}`;

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
    updateSlidesWithHistory((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const changeFormat = (newRatio: AspectRatio) => {
    const spec = FORMAT_SPECS[newRatio];
    setSelectedTemplate(prev => ({ ...prev, aspectRatio: newRatio, titleSize: spec.titleSize, bodySize: spec.bodySize }));
    setSlides(prev => prev.map(s => ({ ...s, titleSize: spec.titleSize, bodySize: spec.bodySize })));
  };

  const snapshotBeforeTemplate = (template: CarouselTemplate) => {
    lastSlidesSnapshot.current = slides.map(s => ({ ...s }));
    lastTemplateSnapshot.current = selectedTemplate;
    toast.success(`Template "${template.name}" aplicado`, {
      description: "Textos e imagens preservados.",
      duration: 8000,
      action: {
        label: "Desfazer",
        onClick: () => {
          if (lastSlidesSnapshot.current) setSlides(lastSlidesSnapshot.current);
          if (lastTemplateSnapshot.current) setSelectedTemplate(lastTemplateSnapshot.current);
          lastSlidesSnapshot.current = null;
          lastTemplateSnapshot.current = null;
        },
      },
    });
  };

  const applyTemplateToAll = (template: CarouselTemplate) => {
    setSelectedTemplate(template);
    const isJournal = isJournalTemplate(template.id);
    updateSlidesWithHistory((prev) =>
      prev.map((s, i) => ({
        ...s,
        bgColor: template.bgColor, textColor: template.textColor, accentColor: template.accentColor,
        titleSize: template.titleSize, bodySize: template.bodySize, fontFamily: template.fontFamily,
        align: template.align, bgGradient: template.bgGradient,
        // Journaling: distribui variantes em sequência para criar narrativa visual coerente
        layout: isJournal
          ? JOURNAL_LAYOUT_SEQUENCE[i % JOURNAL_LAYOUT_SEQUENCE.length]
          : template.layout,
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
      // Preserve: titleColor, bodyColor, titleBold, titleItalic, bodyBold, bodyItalic, bodyUnderline, textShadow, bgImageUrl, overlayOpacity, verticalAlign, all image-* and bgImage-* adjustments
    });
    if (index !== undefined) {
      setSlides(prev => prev.map((s, i) => i === index ? applyToSlide(s) : s));
    } else {
      setSlides(prev => prev.map(applyToSlide));
    }
  };

  // Save current carousel as a draft (scoped to current user)
  const saveCurrentAsDraft = () => {
    try {
      const drafts: any[] = JSON.parse(scopedLocal.get("carousel_drafts") || "[]");
      drafts.unshift({
        id: Date.now(),
        topic, slides, selectedTemplateId: selectedTemplate.id,
        slideCount, tone, formatFilter, currentSlide,
        savedAt: new Date().toISOString(),
      });
      scopedLocal.set("carousel_drafts", JSON.stringify(drafts.slice(0, 10)));
      toast.success("Carrossel atual salvo como rascunho");
    } catch (e) {
      console.error("Failed to save draft:", e);
    }
  };

  // templateApplyMode is declared earlier (with persisted initial value via state restore below)

  const handleImageUpload = async (index: number, file: File) => {
    try {
      snapshotSlideForUndo(index, "Imagem do layout atualizada");
      updateSlide(index, { imageUrl: await fileToDataUrl(file) });
    } catch { toast.error("Erro ao carregar imagem"); }
  };

  const handleBgImageUpload = async (index: number, file: File) => {
    try {
      snapshotSlideForUndo(index, "Imagem de fundo atualizada");
      updateSlide(index, { bgImageUrl: await fileToDataUrl(file) });
    } catch { toast.error("Erro ao carregar imagem de fundo"); }
  };

  const handleMultiImageUpload = async (index: number, files: FileList) => {
    try {
      snapshotSlideForUndo(index, "Fotos do grid atualizadas");
      const urls = await Promise.all(Array.from(files).map(fileToDataUrl));
      const current = slides[index]?.imageUrls || [];
      updateSlide(index, { imageUrls: [...current, ...urls].slice(0, 4) });
    } catch { toast.error("Erro ao carregar imagens"); }
  };

  const handleProfileImageUpload = async (index: number, file: File) => {
    try {
      snapshotSlideForUndo(index, "Avatar atualizado");
      updateSlide(index, { profileImageUrl: await fileToDataUrl(file) });
    } catch { toast.error("Erro ao carregar foto de perfil"); }
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
      await new Promise((r) => setTimeout(r, 300));
      
      // Ensure all images in the element are loaded
      const images = Array.from(el.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 2, // Higher quality
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
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 500));
      
      const zip = new JSZip();
      
      for (let i = 0; i < slides.length; i++) {
        const el = exportRefs.current[i] || slideRefs.current[i];
        if (!el) continue;
        
        // Wait for images in this slide
        const imgs = Array.from(el.querySelectorAll("img"));
        await Promise.all(imgs.map(img => 
          img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
        ));

        const spec = FORMAT_SPECS[selectedTemplate.aspectRatio];
        const dataUrl = await toPng(el, {
          cacheBust: true,
          pixelRatio: 2,
          width: spec.width,
          height: spec.height,
          style: { transform: 'none', position: 'static' },
        });
        
        const base64Data = dataUrl.split(',')[1];
        zip.file(`slide-${i + 1}.png`, base64Data, { base64: true });
      }
      
      // Add JSON metadata for later import
      const metadata = {
        name: topic || "Projeto de Carrossel",
        created_at: new Date().toISOString(),
        template: selectedTemplate.id,
        slides: slides
      };
      zip.file("project_data.json", JSON.stringify(metadata, null, 2));

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `carrossel-${topic.slice(0, 20).replace(/\s+/g, '-') || 'projeto'}.zip`;
      link.click();

      toast.success("Arquivo .zip gerado com todos os slides!");
    } catch (err) {
      console.error("Export all error:", err);
      toast.error("Erro ao gerar ZIP");
    } finally {
      setExporting(false);
    }
  };

  // ========== SLIDE MANAGEMENT ==========
  const duplicateSlide = (index: number) => {
    const newSlide = { ...slides[index] };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, newSlide);
    updateSlidesWithHistory(newSlides);
    setCurrentSlide(index + 1);
    slideRefs.current = new Array(newSlides.length).fill(null);
    toast.success(`Slide ${index + 1} duplicado!`);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) { toast.error("Mínimo de 1 slide"); return; }
    const newSlides = slides.filter((_, i) => i !== index);
    updateSlidesWithHistory(newSlides);
    setCurrentSlide(Math.min(currentSlide, newSlides.length - 1));
    slideRefs.current = new Array(newSlides.length).fill(null);
    toast.success(`Slide ${index + 1} removido`);
  };

  const addElement = (type: "text" | "image" | "shape" | "sticker", content?: string, style?: any) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newLayer = {
      id,
      type,
      content: content || (type === "text" ? "Novo Texto" : undefined),
      x: 0.25,
      y: 0.25,
      width: 0.5,
      height: 0.1,
      style,
    };
    updateSlide(currentSlide, {
      layers: [...(cur.layers || []), newLayer]
    });
    setIsFreeEditMode(true);
    toast.success("Elemento adicionado!");
  };

  // ========== FULLSCREEN PRESENTATION ==========
  const toggleFullscreen = () => setFullscreen(prev => !prev);

  useEffect(() => {
    if (!fullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentSlide(p => Math.min(p + 1, slides.length - 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentSlide(p => Math.max(p - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [fullscreen, slides.length]);

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
      console.error("Erro na Mentora Gi:", err);
      toast.error(err.message || "Erro ao consultar Mentora Gi. Tente novamente em instantes.");
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

  const renderActiveTabContent = () => {
    if (!cur) return null;

    switch (activeTab) {
      case "templates":
        return (
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Designs</h3>
                  <div className="flex gap-1">
                    <Button variant={formatFilter === "all" ? "default" : "outline"} size="icon" className="h-6 w-6" onClick={() => setFormatFilter("all")} title="Todos"><LayoutGrid className="h-3 w-3" /></Button>
                    <Button variant={formatFilter === "1:1" ? "default" : "outline"} size="icon" className="h-6 w-6" onClick={() => setFormatFilter("1:1")} title="1:1"><Square className="h-3 w-3" /></Button>
                    <Button variant={formatFilter === "9:16" ? "default" : "outline"} size="icon" className="h-6 w-6" onClick={() => setFormatFilter("9:16")} title="9:16"><Smartphone className="h-3 w-3" /></Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {CAROUSEL_TEMPLATES.filter(t => formatFilter === "all" || t.aspectRatio === formatFilter).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      className={`group relative aspect-[4/5] rounded-lg overflow-hidden border-2 transition-all hover:border-primary/50 ${
                        selectedTemplate.id === t.id ? "border-primary shadow-md" : "border-transparent"
                      }`}
                    >
                      <div 
                        className="w-full h-full flex items-center justify-center text-[10px] font-bold p-2 text-center"
                        style={{ backgroundColor: t.bgColor, color: t.textColor, background: t.bgGradient || t.bgColor }}
                      >
                        {t.name}
                      </div>
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        );
      case "elements":
        return (
          <ScrollArea className="h-[600px]">
            <div className="p-4">
              <CanvasElementsLibrary onAddElement={addLayer} />
            </div>
          </ScrollArea>
        );
      case "text":
        return (
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Adicionar Texto</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full h-12 justify-start text-xl font-bold px-4" onClick={() => addLayer("text", "Título Principal")}>Título</Button>
                  <Button variant="outline" className="w-full h-10 justify-start text-base font-semibold px-4" onClick={() => addLayer("text", "Subtítulo")}>Subtítulo</Button>
                  <Button variant="outline" className="w-full h-8 justify-start text-sm px-4" onClick={() => addLayer("text", "Corpo de texto")}>Corpo de texto</Button>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Fontes</h3>
                <div className="grid grid-cols-1 gap-1 max-h-[300px] overflow-auto">
                  {FONT_OPTIONS.map(font => (
                    <Button
                      key={font.name}
                      variant="ghost"
                      className="justify-start text-sm font-normal px-2 h-9"
                      style={{ fontFamily: font.name }}
                      onClick={() => updateSlide(currentSlide, { fontFamily: font.name })}
                    >
                      {font.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        );
      case "brand":
        return (
          <ScrollArea className="h-[600px]">
            <div className="p-4">
              <BrandKitManager onApply={applyBrandKit} />
            </div>
          </ScrollArea>
        );
      case "uploads":
        return (
          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Banco de Imagens</h3>
                <div className="flex gap-2">
                  <Button 
                    variant={libraryTarget === "image" ? "default" : "outline"} 
                    className="flex-1 text-xs" 
                    onClick={() => { setLibraryTarget("image"); setLibraryOpen(true); }}
                  >
                    Imagem Principal
                  </Button>
                  <Button 
                    variant={libraryTarget === "bg" ? "default" : "outline"} 
                    className="flex-1 text-xs" 
                    onClick={() => { setLibraryTarget("bg"); setLibraryOpen(true); }}
                  >
                    Fundo
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Seus Uploads</h3>
                <UserUploads onSelect={(url) => {
                  if (libraryTarget === "bg") {
                    snapshotSlideForUndo(currentSlide, "Upload aplicado ao fundo");
                    updateSlide(currentSlide, { bgImageUrl: url });
                  } else {
                    addLayer("image", url);
                  }
                }} />
              </div>

              {(cur.imageUrl || cur.bgImageUrl) && (
                <div className="pt-4 border-t space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ajustes da Imagem</h3>
                  
                  {cur.imageUrl && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold">Ajustar Imagem Principal</Label>
                      <ImageAdjustPanel 
                        imageUrl={cur.imageUrl}
                        aspectRatio={FORMAT_SPECS[selectedTemplate.aspectRatio].width / FORMAT_SPECS[selectedTemplate.aspectRatio].height}
                        values={{
                          positionX: cur.imagePositionX,
                          positionY: cur.imagePositionY,
                          scale: cur.imageScale,
                          blur: cur.imageBlur,
                          brightness: cur.imageBrightness,
                          contrast: cur.imageContrast
                        }}
                        onChange={(vals) => updateSlide(currentSlide, {
                          imagePositionX: vals.positionX,
                          imagePositionY: vals.positionY,
                          imageScale: vals.scale,
                          imageBlur: vals.blur,
                          imageBrightness: vals.brightness,
                          imageContrast: vals.contrast
                        })}
                      />
                    </div>
                  )}

                  {cur.bgImageUrl && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold">Ajustar Fundo</Label>
                      <ImageAdjustPanel 
                        imageUrl={cur.bgImageUrl}
                        aspectRatio={FORMAT_SPECS[selectedTemplate.aspectRatio].width / FORMAT_SPECS[selectedTemplate.aspectRatio].height}
                        values={{
                          positionX: cur.bgImagePositionX,
                          positionY: cur.bgImagePositionY,
                          scale: cur.bgImageScale,
                          blur: cur.bgImageBlur,
                          brightness: cur.bgImageBrightness,
                          contrast: cur.bgImageContrast
                        }}
                        onChange={(vals) => updateSlide(currentSlide, {
                          bgImagePositionX: vals.positionX,
                          bgImagePositionY: vals.positionY,
                          bgImageScale: vals.scale,
                          bgImageBlur: vals.blur,
                          bgImageBrightness: vals.brightness,
                          bgImageContrast: vals.contrast
                        })}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        );
      case "layers":
        return (
          <ScrollArea className="h-[600px]">
            <div className="p-4">
              <LayerList 
                slide={cur} 
                onUpdate={(upd) => updateSlide(currentSlide, upd)} 
                selectedLayerId={selectedLayerId}
                onSelectLayer={setSelectedLayerId}
              />
            </div>
          </ScrollArea>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 mt-4" style={{ paddingBottom: isMobile && slides.length > 0 ? "calc(72px + env(safe-area-inset-bottom))" : undefined }}>
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
            <Textarea placeholder="Ex: 5 dicas para vender mais no Instagram" value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1" />
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
              <>
                <div className="flex gap-1.5 mt-1 mb-1 flex-wrap">
                  <Button size="sm" variant={templateApplyMode === "all" ? "default" : "outline"} className="text-xs h-7" onClick={() => setTemplateApplyMode("all")} title="Aplica visual em todos os slides — mantém textos e imagens">
                    Todos slides
                  </Button>
                  <Button size="sm" variant={templateApplyMode === "current" ? "default" : "outline"} className="text-xs h-7" onClick={() => setTemplateApplyMode("current")} title="Aplica somente neste slide">
                    Só este slide
                  </Button>
                  <Button size="sm" variant={templateApplyMode === "preserve" ? "default" : "outline"} className="text-xs h-7" onClick={() => setTemplateApplyMode("preserve")} title="Troca o fundo e mantém ajustes manuais (cores, tamanhos)">
                    <Palette className="h-3 w-3 mr-1" /> Preservar ajustes
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                  <span>Seus textos e imagens são mantidos ao trocar o template.</span>
                </div>
              </>
            )}

            {/* ========== SEÇÃO DESTACADA: COLEÇÃO JOURNALING ========== */}
            {showJournalSection && journalTemplates.length > 0 && (
              <div className="mt-3 p-3 rounded-lg border-2 border-amber-300/60 bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      ✨ Coleção Journaling
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-400/60 text-amber-800 dark:text-amber-300">
                      6 layouts narrativos
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground hidden md:inline">
                    Papelaria orgânica · 1:1
                  </span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {journalTemplates.map((t) => (
                    <TemplatePreviewTooltip key={t.id} template={t}>
                      <button
                        onClick={() => {
                          if (slides.length > 0) {
                            snapshotBeforeTemplate(t);
                            if (templateApplyMode === "current") {
                              applyTemplateToSlide(t, currentSlide);
                            } else if (templateApplyMode === "preserve") {
                              applyTemplatePreservingFormatting(t);
                            } else {
                              applyTemplateToAll(t);
                            }
                          } else {
                            setSelectedTemplate(t);
                          }
                        }}
                        className={`group relative rounded-md border-2 overflow-hidden transition-all ${
                          selectedTemplate.id === t.id
                            ? "border-primary ring-2 ring-primary/40"
                            : "border-amber-200/50 hover:border-amber-400 dark:border-amber-800/40"
                        }`}
                        title={t.name}
                      >
                        <div className="relative w-full aspect-square overflow-hidden bg-background">
                          <div
                            style={{
                              transform: "scale(0.10185)",
                              transformOrigin: "top left",
                              width: 1080,
                              height: 1080,
                              pointerEvents: "none",
                            }}
                          >
                            <SlidePreview
                              slide={{
                                ...(cur || { title: "Título exemplo", body: "Texto de visualização." }),
                                bgColor: t.bgColor,
                                textColor: t.textColor,
                                accentColor: t.accentColor,
                                titleSize: t.titleSize,
                                bodySize: t.bodySize,
                                fontFamily: t.fontFamily,
                                align: t.align,
                                bgGradient: t.bgGradient,
                                layout: t.layout,
                                highlightBgColor: t.highlightBgColor,
                                profileName: cur?.profileName || "Mentora Gi",
                                profileHandle: cur?.profileHandle || "@mentoragi",
                              }}
                              aspectRatio={t.aspectRatio}
                              slideIndex={0}
                              totalSlides={1}
                            />
                          </div>
                        </div>
                        <div className="px-1.5 py-1 bg-background/95 border-t border-border/50">
                          <span className="block text-[10px] font-medium text-foreground truncate leading-tight">
                            {t.name}
                          </span>
                        </div>
                      </button>
                    </TemplatePreviewTooltip>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 leading-snug">
                  Clique em qualquer template para aplicar com o modo selecionado acima. Use o painel de paletas abaixo para variar as cores.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                <Card 
                  className="cursor-pointer hover:border-primary transition-all overflow-hidden bg-primary/5 border-primary/20"
                  onClick={() => {
                    const blankTemplate = CAROUSEL_TEMPLATES.find(t => t.id === "blank-canvas") || CAROUSEL_TEMPLATES[0];
                    setSelectedTemplate(blankTemplate);
                    const initialSlides = createSlidesFromTemplate(blankTemplate, [{ title: "Seu Título", body: "Adicione seu conteúdo" }]);
                    updateSlidesWithHistory(initialSlides);
                    setIsFreeEditMode(true);
                    setActiveTab("layers");
                    toast.success("Começando do zero!");
                  }}
                >
                  <CardContent className="p-2 flex flex-col items-center justify-center h-full min-h-[80px] text-center gap-1">
                    <PlusCircle className="h-6 w-6 text-primary" />
                    <span className="text-[10px] font-bold">Criar do Zero</span>
                  </CardContent>
                </Card>
              {filteredTemplates.map((t) => (
                <TemplatePreviewTooltip key={t.id} template={t}>
                  <button
                    onClick={() => {
                      if (slides.length > 0) {
                        snapshotBeforeTemplate(t);
                        if (templateApplyMode === "current") {
                          applyTemplateToSlide(t, currentSlide);
                        } else if (templateApplyMode === "preserve") {
                          applyTemplatePreservingFormatting(t);
                        } else {
                          applyTemplateToAll(t);
                        }
                      } else {
                        setSelectedTemplate(t);
                      }
                    }}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${selectedTemplate.id === t.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 aspect-square rounded overflow-hidden bg-background">
                        <div style={{ transform: "scale(0.12)", transformOrigin: "top left", width: 1080, height: 1080, pointerEvents: "none" }}>
                          <SlidePreview 
                            slide={{
                              ...(cur || { title: "Título", body: "Texto" }),
                              bgColor: t.bgColor,
                              textColor: t.textColor,
                              accentColor: t.accentColor,
                              titleSize: t.titleSize,
                              bodySize: t.bodySize,
                              fontFamily: t.fontFamily,
                              align: t.align,
                              bgGradient: t.bgGradient,
                              layout: t.layout,
                              highlightBgColor: t.highlightBgColor,
                            }}
                            aspectRatio={t.aspectRatio}
                            slideIndex={0}
                            totalSlides={1}
                          />
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">{t.aspectRatio}</Badge>
                    </div>
                    <span className="text-xs font-medium text-foreground">{t.name}</span>
                    <p className="text-[10px] text-muted-foreground">{t.description}</p>
                  </button>
                </TemplatePreviewTooltip>
              ))}
            </div>

            {/* ========== COLEÇÃO JOURNALING — paletas + ações ========== */}
            {(isJournalTemplate(selectedTemplate.id) || slides.some(s => (s.layout || "").startsWith("journal-"))) && (
              <div className="mt-3 p-3 rounded-lg border border-amber-200/60 bg-amber-50/30 dark:bg-amber-950/10 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                    📓 Coleção Journaling
                  </span>
                  <Badge variant="outline" className="text-[10px]">6 layouts narrativos</Badge>
                </div>

                {/* Palette swatches */}
                <div>
                  <Label className="text-[11px] text-muted-foreground">Paleta</Label>
                  <div className="flex gap-1.5 mt-1 flex-wrap items-center">
                    {JOURNAL_PALETTES.map((p) => (
                      <button
                        key={p.id}
                        title={`${p.emoji} ${p.name}`}
                        onClick={() => applyJournalPalette(p)}
                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${currentJournalPaletteId === p.id ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
                        style={{ background: p.swatch }}
                        aria-label={p.name}
                      />
                    ))}
                    <button
                      title="Paleta aleatória"
                      onClick={() => {
                        const rest = JOURNAL_PALETTES.filter(p => p.id !== currentJournalPaletteId);
                        applyJournalPalette(rest[Math.floor(Math.random() * rest.length)]);
                      }}
                      className="w-8 h-8 rounded-full border-2 border-dashed border-border hover:border-primary/60 text-sm"
                    >🎲</button>
                  </div>
                </div>

                {/* Real mini-thumbnails of the 6 layouts (120x120) using current palette */}
                <div>
                  <Label className="text-[11px] text-muted-foreground">Layouts (clique para aplicar ao slide atual)</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-1">
                    {journalThumbSlides.map((thumbSlide, i) => (
                      <button
                        key={`${currentJournalPaletteId}-thumb-${i}`}
                        onClick={() => applyJournalLayoutToCurrent(JOURNAL_LAYOUT_SEQUENCE[i])}
                        title={JOURNAL_LAYOUT_SEQUENCE[i]}
                        className="relative w-[120px] h-[120px] rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all bg-muted shrink-0"
                        style={{ width: 120, height: 120 }}
                      >
                        <div
                          style={{
                            width: 1080,
                            height: 1080,
                            transform: "scale(0.1111)",
                            transformOrigin: "top left",
                            pointerEvents: "none",
                          }}
                        >
                          <SlidePreview
                            slide={thumbSlide}
                            slideIndex={i}
                            totalSlides={6}
                            aspectRatio="1:1"
                            nativeSize
                          />
                        </div>
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] py-0.5 text-center font-medium">
                          {i + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="default"
                    className="text-xs"
                    onClick={generateJournalCollection}
                    disabled={generatingJournalColl}
                    title="Gera 6 títulos e corpos consistentes para os 6 layouts da coleção, baseado no tema acima"
                  >
                    {generatingJournalColl
                      ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Gerando...</>
                      : <>🪄 Gerar coleção com Mentora Gi</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      const tpl = CAROUSEL_TEMPLATES.find(t => isJournalTemplate(t.id) && t.id === selectedTemplate.id)
                        || CAROUSEL_TEMPLATES.find(t => isJournalTemplate(t.id))!;
                      applyJournalCollection(tpl, { keepContent: true });
                    }}
                    title="Aplica os 6 layouts mantendo seus textos e imagens"
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> ✨ Manter meu texto
                  </Button>
                  <div className="flex items-center gap-1.5 border border-border rounded-md pl-1.5 pr-1 py-0.5">
                    <Select value={sampleThemeId} onValueChange={setSampleThemeId}>
                      <SelectTrigger className="h-7 text-[11px] border-0 px-1 gap-1 w-[150px] focus:ring-0">
                        <SelectValue placeholder="Tema" />
                      </SelectTrigger>
                      <SelectContent>
                        {JOURNAL_SAMPLE_THEMES.map(t => (
                          <SelectItem key={t.id} value={t.id} className="text-xs">
                            {t.emoji} {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 px-2"
                      onClick={() => {
                        const tpl = CAROUSEL_TEMPLATES.find(t => isJournalTemplate(t.id) && t.id === selectedTemplate.id)
                          || CAROUSEL_TEMPLATES.find(t => isJournalTemplate(t.id))!;
                        applyJournalCollection(tpl, {
                          keepContent: false,
                          themeId: sampleThemeId,
                          forceSampleText: true,
                        });
                      }}
                      title="Substitui textos pelo conteúdo modelo do tema escolhido (offline)"
                    >
                      📋 Aplicar exemplo
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={exportJournalCollection}
                    disabled={exportingCollection}
                  >
                    {exportingCollection
                      ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Gerando...</>
                      : <><DownloadCloud className="h-3 w-3 mr-1" /> 📥 Exportar (.zip)</>}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  🪄 = gera 6 títulos/corpos com Mentora Gi e distribui nos 6 layouts. Cores, fontes, imagens e fundo continuam totalmente editáveis no painel direito.
                </p>
              </div>
            )}
          </div>

          <Button onClick={generateContent} disabled={generating} className="w-full">
            {generating ? (<><Loader2 className="h-4 w-4 animate-spin" /> Gerando com Mentora Gi...</>) : (<><Sparkles className="h-4 w-4" /> Gerar Carrossel com Mentora Gi</>)}
          </Button>
        </CardContent>
      </Card>

      {/* ========== EDITOR + PREVIEW ========== */}
      {slides.length > 0 && cur && (
        <div className={`flex flex-col lg:flex-row h-[700px] lg:h-[850px] border border-border/50 rounded-2xl overflow-hidden bg-card shadow-2xl relative ${fullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none' : ''}`}>
          {/* Canva-style Side Sidebar (Icon Bar) */}
          <div className="w-[70px] bg-muted/30 border-r border-border/50 flex flex-col py-4 gap-2 items-center shrink-0 z-20">
            {sidebarTabs.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex flex-col items-center justify-center py-3 gap-1 transition-all relative ${
                  activeTab === tab.id ? 'text-primary bg-background' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {activeTab === tab.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            ))}
            
            <div className="mt-auto flex flex-col gap-2 items-center w-full px-2">
               <Button size="icon" variant="ghost" onClick={() => setFullscreen(!fullscreen)} title={fullscreen ? "Sair da Tela Cheia" : "Tela Cheia"} className="h-10 w-10">
                 {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
               </Button>
            </div>
          </div>

          {/* Canva-style Content Panel */}
          {activeTab && (
            <div className="w-[320px] bg-background border-r border-border/50 flex flex-col shrink-0 animate-in slide-in-from-left-2 duration-300 z-10 shadow-xl">
               <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/5">
                  <h2 className="text-sm font-bold capitalize">{sidebarTabs.find(t => t.id === activeTab)?.label}</h2>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveTab("")}>
                    <X className="h-4 w-4" />
                  </Button>
               </div>
               <div className="flex-1 overflow-hidden">
                  {renderActiveTabContent()}
               </div>
            </div>
          )}

          {/* Main Workspace */}
          <div className="flex-1 bg-muted/10 relative flex flex-col overflow-hidden">
            {/* Top Toolbar */}
            <div className="h-14 bg-background border-b border-border/50 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentSlide(p => Math.max(0, p - 1))} disabled={currentSlide === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-semibold px-2 py-1 bg-muted/50 rounded-md min-w-[100px] text-center">
                      Página {currentSlide + 1} de {slides.length}
                    </span>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentSlide(p => Math.min(slides.length - 1, p + 1))} disabled={currentSlide === slides.length - 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="h-6 w-[1px] bg-border mx-2" />
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={undo} disabled={history.length === 0} title="Desfazer">
                       <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={redo} disabled={redoStack.length === 0} title="Refazer">
                       <Undo2 className="h-4 w-4" style={{ transform: "scaleX(-1)" }} />
                    </Button>
                    <div className="h-4 w-[1px] bg-border mx-1 self-center" />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                        const newSlide = JSON.parse(JSON.stringify(slides[currentSlide]));
                        updateSlidesWithHistory(prev => [...prev, newSlide]);
                        setCurrentSlide(slides.length);
                        toast.success("Slide duplicado");
                    }} title="Duplicar">
                       <CopyPlus className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => {
                        if (slides.length <= 1) return;
                        updateSlidesWithHistory(prev => {
                          const next = prev.filter((_, i) => i !== currentSlide);
                          setCurrentSlide(Math.max(0, currentSlide - 1));
                          return next;
                        });
                        toast.success("Slide removido");
                    }} disabled={slides.length <= 1} title="Excluir">
                       <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className={`h-8 w-8 ${isFreeEditMode ? 'text-primary bg-primary/10' : ''}`} onClick={() => setIsFreeEditMode(!isFreeEditMode)} title={isFreeEditMode ? 'Sair do Modo Edição Livre' : 'Modo Edição Livre'}>
                       <MousePointer2 className="h-4 w-4" />
                    </Button>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => {
                      const blankSlide = JSON.parse(JSON.stringify(slides[0]));
                      blankSlide.title = "Nova Página";
                      blankSlide.body = "Adicione seu texto aqui.";
                      blankSlide.id = Math.random().toString(36).substr(2, 9);
                      updateSlidesWithHistory(prev => [...prev, blankSlide]);
                      setCurrentSlide(slides.length);
                  }} className="gap-2 hidden sm:flex">
                    <PlusCircle className="h-4 w-4" /> Adicionar Página
                  </Button>
                  <Button size="sm" onClick={() => exportSlide(currentSlide)} disabled={exporting} className="gap-2 bg-primary hover:bg-primary/90 shadow-md">
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Exportar
                  </Button>
               </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-hidden bg-[#f0f2f5] dark:bg-[#111111] relative">
              <TransformWrapper
                ref={transformRef}
                initialScale={1}
                minScale={0.1}
                maxScale={5}
                centerOnInit={true}
                limitToBounds={false}
                onTransform={(ref) => setZoomScale(ref.state.scale)}
                doubleClick={{ disabled: true }}
                panning={{ activationKeys: [" "], disabled: false }}
                wheel={{ disabled: false }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 bg-background/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-border/50">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => zoomOut()}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="text-[10px] font-bold min-w-[40px] text-center">{Math.round(zoomScale * 100)}%</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => zoomIn()}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <div className="h-4 w-[1px] bg-border mx-1" />
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => resetTransform()} title="Ajustar">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <TransformComponent
                      wrapperStyle={{
                        width: "100%",
                        height: "100%",
                      }}
                      contentStyle={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div className={`relative shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-shadow duration-500 ${isFreeEditMode ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}>
                        <SlidePreview 
                            ref={(ref) => { 
                              if (ref && slideRefs.current) {
                                slideRefs.current[currentSlide] = ref.container as any; 
                              }
                            }}
                            slide={cur} 
                            slideIndex={currentSlide} 
                            totalSlides={slides.length} 
                            aspectRatio={selectedTemplate.aspectRatio} 
                            isFreeEditMode={isFreeEditMode}
                            selectedLayerId={selectedLayerId}
                            onSelectLayer={setSelectedLayerId}
                            onUpdate={(updates) => {
                              updateSlidesWithHistory(prev => prev.map((s, i) => 
                                i === currentSlide ? { ...s, ...updates } : s
                              ));
                            }}
                            zoom={zoomScale}
                        />
                      </div>
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>

            {/* Bottom Timeline */}
            <div className="h-28 bg-background border-t border-border/50 flex items-center px-6 gap-4 overflow-x-auto shrink-0 scrollbar-hide">
               {slides.map((s, idx) => {
                 const spec = FORMAT_SPECS[selectedTemplate.aspectRatio];
                 const thumbRatio = spec.width / spec.height;
                 return (
                   <button 
                    key={idx} 
                    onClick={() => setCurrentSlide(idx)}
                    className={`relative rounded-lg border-2 shrink-0 transition-all flex flex-col items-center ${
                      currentSlide === idx ? 'border-primary ring-4 ring-primary/10 scale-105 z-10' : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                   >
                     <div 
                       className="rounded-md overflow-hidden bg-muted shadow-sm"
                       style={{ 
                         width: 60 * thumbRatio, 
                         height: 60,
                       }}
                     >
                        <div 
                          className="origin-top-left" 
                          style={{ 
                            width: spec.width, 
                            height: spec.height,
                            transform: `scale(${60 / spec.height})`,
                            background: s.bgGradient || s.bgColor,
                          }}
                        >
                          <SlidePreview slide={s} slideIndex={idx} totalSlides={slides.length} aspectRatio={selectedTemplate.aspectRatio} />
                        </div>
                     </div>
                     <span className="text-[10px] mt-1 font-bold text-muted-foreground">{idx + 1}</span>
                   </button>
                 );
               })}
               <Button 
                 variant="outline" 
                 size="icon" 
                 className="w-16 h-16 shrink-0 rounded-lg border-dashed"
                 onClick={() => setSlides(prev => [...prev, { ...cur, id: Math.random().toString(36).substr(2, 9), title: "Nova Página", body: "Adicione seu texto aqui." }])}
               >
                 <PlusCircle className="h-6 w-6 text-muted-foreground" />
               </Button>
            </div>
          </div>

          {/* AI Helper (Gi) Floating Button/Panel */}
          <div className="absolute bottom-32 right-6 z-40">
             {!giOpen ? (
               <Button size="icon" className="h-12 w-12 rounded-full shadow-2xl animate-bounce hover:animate-none" onClick={() => setGiOpen(true)}>
                  <Sparkles className="h-6 w-6" />
               </Button>
             ) : (
               <div className="w-80 h-[500px] bg-card border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
                  <div className="p-3 bg-primary text-primary-foreground flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-xs font-bold">Mentora Gi IA</span>
                     </div>
                     <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-white/10" onClick={() => setGiOpen(false)}>
                        <X className="h-4 w-4" />
                     </Button>
                  </div>
                  <div className="flex-1 p-4 overflow-hidden flex flex-col gap-3">
                    <p className="text-[10px] text-muted-foreground">Otimize suas copies, ajuste o tom ou peça novos slides.</p>
                    <ScrollArea className="flex-1 pr-3">
                      <div className="space-y-4">
                        {giMessages.map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] p-2 rounded-xl text-[11px] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              {msg.content}
                            </div>
                            {msg.role === 'assistant' && (
                              <Button size="sm" variant="link" className="h-auto p-0 text-[10px] mt-1" onClick={() => applyGiSuggestions(msg.content)}>
                                Aplicar alterações
                              </Button>
                            )}
                          </div>
                        ))}
                        {giLoading && <div className="text-[10px] text-muted-foreground animate-pulse italic">Gi está digitando...</div>}
                      </div>
                    </ScrollArea>
                    <div className="flex gap-2 pt-2 border-t">
                      <Input 
                        placeholder="Diga algo para Gi..." 
                        value={giInput} 
                        onChange={(e) => setGiInput(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && sendToGi(giInput)}
                        className="text-xs h-8"
                      />
                      <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => sendToGi(giInput)} disabled={giLoading}>
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Confirm overwrite when a new initialTopic arrives */}
      <AlertDialog open={!!pendingTopic} onOpenChange={(o) => { if (!o) setPendingTopic(null); }}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir carrossel atual?</AlertDialogTitle>
            <AlertDialogDescription>
              Você já tem um carrossel em andamento sobre <strong>"{topic}"</strong> com{" "}
              <strong>{slides.length} slide(s)</strong>. O que deseja fazer com o novo tema{" "}
              <strong>"{pendingTopic}"</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0" onClick={() => {
              // KEEP CURRENT — preserve everything (slides, template, mode, chat, images, adjustments)
              if (pendingTopic) lastAppliedInitialTopic.current = pendingTopic;
              setPendingTopic(null);
              toast.success("Carrossel atual mantido", { description: "Nada foi alterado." });
            }}>Manter o atual</AlertDialogCancel>
            <Button variant="secondary" onClick={() => {
              // Save current as draft, then start new
              if (pendingTopic) {
                saveCurrentAsDraft();
                setTopic(pendingTopic);
                setSlides([]);
                setCurrentSlide(0);
                setGiMessages([]);
                lastAppliedInitialTopic.current = pendingTopic;
              }
              setPendingTopic(null);
            }}>Salvar atual e começar novo</Button>
            <AlertDialogAction onClick={() => {
              if (pendingTopic) {
                setTopic(pendingTopic);
                setSlides([]);
                setCurrentSlide(0);
                setGiMessages([]);
                lastAppliedInitialTopic.current = pendingTopic;
              }
              setPendingTopic(null);
            }}>Substituir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Image Library Picker ===== */}
      <ImageLibraryPicker
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        orientation={selectedTemplate.aspectRatio}
        suggestedQuery={topic || formData?.niche || ""}
        onSelect={handleLibrarySelect}
      />

      {/* ===== Off-screen Journal Collection Exporter (mounted only during export) ===== */}
      {exporterMounted && (
        <JournalCollectionExporter
          ref={exporterRef}
          palette={currentJournalPalette}
          profileHandle={slides[0]?.profileHandle}
        />
      )}
    </div>
  );
}

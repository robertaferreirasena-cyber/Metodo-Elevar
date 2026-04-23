import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { toPng } from "html-to-image";
import {
  ChevronLeft, ChevronRight, Download, Wand2, Loader2, Paintbrush, Type,
  AlignLeft, AlignCenter, DownloadCloud, ImagePlus, User, X, Smartphone,
  Square, Monitor, Sparkles, Send, ChevronDown, ChevronUp,
  Bold, Italic, Underline, ArrowUpFromLine, AlignVerticalSpaceAround, ArrowDownFromLine, Palette, Copy,
  CopyPlus, Trash2, Maximize, Minimize, Undo2, CheckCircle2,
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
import SlidePreview from "./SlidePreview";
import TemplatePreviewTooltip from "./TemplatePreviewTooltip";
import ImageAdjustPanel, { type ImageAdjustValues } from "./ImageAdjustPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CAROUSEL_TEMPLATES, createSlidesFromTemplate, FORMAT_SPECS, FONT_OPTIONS, GRADIENT_PRESETS,
  JOURNAL_TEMPLATE_IDS, JOURNAL_LAYOUT_SEQUENCE, isJournalTemplate,
  JOURNAL_PALETTES, applyPaletteToSlide, buildJournalSampleSlides, type JournalPalette,
  type SlideData, type CarouselTemplate, type CarouselLayout, type AspectRatio,
} from "./CarouselTemplates";
import ImageLibraryPicker from "./ImageLibraryPicker";
import JournalCollectionExporter, { type JournalExporterHandle } from "./JournalCollectionExporter";
import JSZip from "jszip";

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
    "session_carousel_editor", EMPTY_CAROUSEL_STATE
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

  // Mentora Gi mini-chat state — persisted
  const [giOpen, setGiOpen] = useState(sessionState.giOpen);
  const [giInput, setGiInput] = useState("");
  const [giMessages, setGiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>(sessionState.giMessages);
  const [giLoading, setGiLoading] = useState(false);

  // Persisted template apply mode
  const [templateApplyMode, setTemplateApplyMode] = useState<"all" | "current" | "preserve">(sessionState.templateApplyMode);

  // Image library + collection export state
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryTarget, setLibraryTarget] = useState<"image" | "bg">("bg");
  const [exportingCollection, setExportingCollection] = useState(false);

  // Current journal palette (persisted) — derived from id, source-of-truth is the id
  const [currentJournalPaletteId, setCurrentJournalPaletteId] = useState<string>(
    sessionState.currentJournalPaletteId || "terracota"
  );
  const currentJournalPalette = useMemo(
    () => JOURNAL_PALETTES.find(p => p.id === currentJournalPaletteId) || JOURNAL_PALETTES[0],
    [currentJournalPaletteId]
  );

  // Off-screen exporter (mounted only during export)
  const [exporterMounted, setExporterMounted] = useState(false);
  const exporterRef = useRef<JournalExporterHandle>(null);

  const applyJournalPalette = useCallback((palette: JournalPalette) => {
    setCurrentJournalPaletteId(palette.id);
    setSlides(prev => prev.map(s => isJournalTemplate(selectedTemplate.id) || (s.layout || "").startsWith("journal-")
      ? applyPaletteToSlide(s, palette)
      : s
    ));
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
  const applyJournalCollection = useCallback((template: CarouselTemplate, opts: { keepContent: boolean } = { keepContent: true }) => {
    const palette = currentJournalPalette;
    const sample = buildJournalSampleSlides(palette, slides[0]?.profileHandle);
    const newSlides: SlideData[] = sample.map((s, i) => {
      const existing = slides[i];
      if (opts.keepContent && existing) {
        // Preserve user content; swap only layout, colors, and font family from template/palette
        return {
          ...existing,
          layout: s.layout,
          bgColor: palette.bgColor,
          textColor: palette.textColor,
          accentColor: palette.accentColor,
          titleColor: undefined,
          bodyColor: undefined,
          fontFamily: template.fontFamily,
          // fill body if empty AND layout typically expects body
          body: existing.body || s.body,
          title: existing.title || s.title,
        };
      }
      // Replace mode (texto modelo)
      return {
        ...s,
        title: existing?.title || s.title,
        body: existing?.body || s.body,
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

  // Apply only one journal layout to the current slide (used by thumbnails).
  const applyJournalLayoutToCurrent = useCallback((layout: CarouselLayout) => {
    const palette = currentJournalPalette;
    setSlides(prev => prev.map((s, i) => i === currentSlide ? {
      ...s,
      layout,
      bgColor: palette.bgColor,
      textColor: palette.textColor,
      accentColor: palette.accentColor,
      titleColor: undefined,
      bodyColor: undefined,
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
    setSlides((prev) =>
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

  // Save current carousel as a draft in localStorage so user can restore later
  const saveCurrentAsDraft = () => {
    try {
      const drafts: any[] = JSON.parse(localStorage.getItem("carousel_drafts") || "[]");
      drafts.unshift({
        id: Date.now(),
        topic, slides, selectedTemplateId: selectedTemplate.id,
        slideCount, tone, formatFilter, currentSlide,
        savedAt: new Date().toISOString(),
      });
      // Keep only last 10
      localStorage.setItem("carousel_drafts", JSON.stringify(drafts.slice(0, 10)));
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

  // ========== SLIDE MANAGEMENT ==========
  const duplicateSlide = (index: number) => {
    const newSlide = { ...slides[index] };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, newSlide);
    setSlides(newSlides);
    setCurrentSlide(index + 1);
    slideRefs.current = new Array(newSlides.length).fill(null);
    toast.success(`Slide ${index + 1} duplicado!`);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) { toast.error("Mínimo de 1 slide"); return; }
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    setCurrentSlide(Math.min(currentSlide, newSlides.length - 1));
    slideRefs.current = new Array(newSlides.length).fill(null);
    toast.success(`Slide ${index + 1} removido`);
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
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
                      <div className="flex-1 h-8 rounded" style={{ background: t.bgGradient || t.bgColor }} />
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

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="default"
                    className="text-xs"
                    onClick={() => {
                      const tpl = CAROUSEL_TEMPLATES.find(t => isJournalTemplate(t.id) && t.id === selectedTemplate.id)
                        || CAROUSEL_TEMPLATES.find(t => isJournalTemplate(t.id))!;
                      applyJournalCollection(tpl);
                    }}
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Aplicar Coleção (6 slides)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={exportJournalCollection}
                    disabled={exportingCollection}
                  >
                    {exportingCollection
                      ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Gerando...</>
                      : <><DownloadCloud className="h-3 w-3 mr-1" /> 📥 Exportar prévia da coleção</>}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  A paleta troca cores em todos os slides Journaling. A exportação gera um ZIP com 6 PNGs reais (1080×1080) usando o conteúdo de exemplo.
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
        <>
          {/* Format toggle + Navigation */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="icon" variant="outline" disabled={currentSlide === 0} onClick={() => setCurrentSlide((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Badge variant="secondary">Slide {currentSlide + 1} / {slides.length}</Badge>
                <Button size="icon" variant="outline" disabled={currentSlide === slides.length - 1} onClick={() => setCurrentSlide((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                <div className="border-l border-border pl-2 flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" title="Duplicar slide" onClick={() => duplicateSlide(currentSlide)}>
                    <CopyPlus className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" title="Excluir slide" onClick={() => deleteSlide(currentSlide)} disabled={slides.length <= 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap md:flex-nowrap md:static fixed bottom-0 left-0 right-0 md:bg-transparent bg-background/95 backdrop-blur md:p-0 p-2 md:border-0 border-t border-border z-40 md:z-auto justify-center md:justify-end" style={{ paddingBottom: isMobile ? "max(0.5rem, env(safe-area-inset-bottom))" : undefined }}>
                <Button size="sm" variant="outline" onClick={toggleFullscreen} title="Modo apresentação" className="min-h-11 md:min-h-9">
                  <Maximize className="h-4 w-4 mr-1" /> <span>Apresentar</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportSlide(currentSlide)} disabled={exporting} className="min-h-11 md:min-h-9"><Download className="h-4 w-4 mr-1" /> PNG</Button>
                <Button size="sm" onClick={exportAll} disabled={exporting} className="min-h-11 md:min-h-9"><DownloadCloud className="h-4 w-4 mr-1" />{exporting ? "Exportando..." : "Baixar Todos"}</Button>
              </div>
            </div>
          </div>



          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Preview */}
            <div className="flex justify-center w-full overflow-hidden">
              <div className="w-full max-w-full">
                <SlidePreview ref={setSlideRef(currentSlide)} slide={cur} slideIndex={currentSlide} totalSlides={slides.length} aspectRatio={selectedTemplate.aspectRatio} />
              </div>
            </div>

            {/* ========== EDITOR CONTROLS ========== */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Paintbrush className="h-4 w-4" /> Editar Slide {currentSlide + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[60vh] lg:max-h-[600px] overflow-y-auto">
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-9 shrink-0"
                      onClick={() => { setLibraryTarget("bg"); setLibraryOpen(true); }}
                      title="Buscar no banco de imagens grátis"
                    >
                      🖼 Banco
                    </Button>
                    {cur.bgImageUrl && (
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { snapshotSlideForUndo(currentSlide, "Imagem de fundo removida"); updateSlide(currentSlide, { bgImageUrl: undefined, bgImagePositionX: undefined, bgImagePositionY: undefined, bgImageScale: undefined, bgImageBlur: undefined, bgImageBrightness: undefined, bgImageContrast: undefined }); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {cur.bgImageUrl && (
                    <div className="mt-2 space-y-3">
                      <div>
                        <Label className="text-xs">Opacidade do overlay (sombra): {Math.round((cur.overlayOpacity ?? 0.55) * 100)}%</Label>
                        <Slider value={[cur.overlayOpacity ?? 0.55]} onValueChange={([v]) => updateSlide(currentSlide, { overlayOpacity: v })} min={0} max={1} step={0.05} className="mt-1" />
                      </div>
                      <ImageAdjustPanel
                        imageUrl={cur.bgImageUrl}
                        aspectRatio={FORMAT_SPECS[selectedTemplate.aspectRatio].width / FORMAT_SPECS[selectedTemplate.aspectRatio].height}
                        values={{
                          positionX: cur.bgImagePositionX, positionY: cur.bgImagePositionY,
                          scale: cur.bgImageScale, blur: cur.bgImageBlur,
                          brightness: cur.bgImageBrightness, contrast: cur.bgImageContrast,
                        }}
                        onChange={(v) => {
                          const isReset = v.positionX === undefined && v.positionY === undefined && v.scale === undefined && v.blur === undefined && v.brightness === undefined && v.contrast === undefined;
                          if (isReset) snapshotSlideForUndo(currentSlide, "Ajustes do fundo resetados");
                          updateSlide(currentSlide, {
                            bgImagePositionX: v.positionX, bgImagePositionY: v.positionY,
                            bgImageScale: v.scale, bgImageBlur: v.blur,
                            bgImageBrightness: v.brightness, bgImageContrast: v.contrast,
                          });
                        }}
                      />
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-9 shrink-0"
                        onClick={() => { setLibraryTarget("image"); setLibraryOpen(true); }}
                        title="Buscar no banco de imagens grátis"
                      >
                        🖼 Banco
                      </Button>
                      {cur.imageUrl && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { snapshotSlideForUndo(currentSlide, "Imagem do layout removida"); updateSlide(currentSlide, { imageUrl: undefined, imagePositionX: undefined, imagePositionY: undefined, imageScale: undefined, imageBlur: undefined, imageBrightness: undefined, imageContrast: undefined }); }}><X className="h-4 w-4" /></Button>
                      )}
                    </div>
                    {cur.imageUrl && (
                      <div className="mt-2">
                        <ImageAdjustPanel
                          imageUrl={cur.imageUrl}
                          aspectRatio={curLayout === "editorial" ? 0.9 : (FORMAT_SPECS[selectedTemplate.aspectRatio].width / FORMAT_SPECS[selectedTemplate.aspectRatio].height)}
                          values={{
                            positionX: cur.imagePositionX, positionY: cur.imagePositionY,
                            scale: cur.imageScale, blur: cur.imageBlur,
                            brightness: cur.imageBrightness, contrast: cur.imageContrast,
                          }}
                          onChange={(v) => {
                            const isReset = v.positionX === undefined && v.positionY === undefined && v.scale === undefined && v.blur === undefined && v.brightness === undefined && v.contrast === undefined;
                            if (isReset) snapshotSlideForUndo(currentSlide, "Ajustes da imagem resetados");
                            updateSlide(currentSlide, {
                              imagePositionX: v.positionX, imagePositionY: v.positionY,
                              imageScale: v.scale, imageBlur: v.blur,
                              imageBrightness: v.brightness, imageContrast: v.contrast,
                            });
                          }}
                        />
                      </div>
                    )}
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
                            <button className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" onClick={() => { snapshotSlideForUndo(currentSlide, "Foto removida do grid"); const u = [...(cur.imageUrls || [])]; u.splice(i, 1); updateSlide(currentSlide, { imageUrls: u }); }}>
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

      {/* ========== FULLSCREEN PRESENTATION MODE ========== */}
      {fullscreen && slides.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setFullscreen(false); }}>
          {/* Top bar — always visible on mobile, hover-reveal on desktop */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-b from-black/80 to-transparent z-10 md:opacity-0 md:hover:opacity-100 transition-opacity duration-300" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
            <Badge variant="secondary" className="text-sm">
              Slide {currentSlide + 1} / {slides.length}
            </Badge>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 min-h-11 min-w-11" onClick={() => setFullscreen(false)}>
                <Minimize className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Sair (Esc)</span><span className="sm:hidden">Sair</span>
              </Button>
            </div>
          </div>

          {/* Slide */}
          <div className="flex items-center justify-center w-full h-full" style={{ paddingTop: "calc(56px + env(safe-area-inset-top))", paddingBottom: "calc(56px + env(safe-area-inset-bottom))", paddingLeft: "max(0.5rem, env(safe-area-inset-left))", paddingRight: "max(0.5rem, env(safe-area-inset-right))" }}>
            <div style={{ maxWidth: "min(94vw, calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right) - 1rem))", maxHeight: "78vh" }}>
              <SlidePreview
                slide={slides[currentSlide]}
                slideIndex={currentSlide}
                totalSlides={slides.length}
                aspectRatio={selectedTemplate.aspectRatio}
              />
            </div>
          </div>

          {/* Navigation arrows — bigger touch target, always visible */}
          <button
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 active:bg-white/40 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-20"
            onClick={() => setCurrentSlide(p => Math.max(p - 1, 0))}
            disabled={currentSlide === 0}
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-7 w-7 text-white" />
          </button>
          <button
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 active:bg-white/40 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-20"
            onClick={() => setCurrentSlide(p => Math.min(p + 1, slides.length - 1))}
            disabled={currentSlide === slides.length - 1}
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-7 w-7 text-white" />
          </button>

          {/* Bottom dots */}
          <div className="absolute left-1/2 -translate-x-1/2 flex gap-2" style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-3 h-3 rounded-full transition-all ${i === currentSlide ? "bg-white scale-125" : "bg-white/30 hover:bg-white/60"}`}
                aria-label={`Ir para slide ${i + 1}`}
              />
            ))}
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

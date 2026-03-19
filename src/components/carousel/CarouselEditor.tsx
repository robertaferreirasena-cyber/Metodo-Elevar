import { useState, useRef, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Wand2,
  Loader2,
  Paintbrush,
  Type,
  AlignLeft,
  AlignCenter,
  DownloadCloud,
  ImagePlus,
  User,
  X,
  Smartphone,
  Square,
  Monitor,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { SessionIndicator } from "@/components/SessionIndicator";
import SlidePreview from "./SlidePreview";
import {
  CAROUSEL_TEMPLATES,
  createSlidesFromTemplate,
  type SlideData,
  type CarouselTemplate,
  type CarouselLayout,
} from "./CarouselTemplates";

// Layouts that support images
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
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sync to session storage
  useEffect(() => {
    setSessionState({
      topic, slideCount, tone, formatFilter,
      selectedTemplateId: selectedTemplate.id, slides, currentSlide,
    });
  }, [topic, slideCount, tone, formatFilter, selectedTemplate, slides, currentSlide, setSessionState]);

  const { hasProfile, hasRaioX, formData, raioX } = usePersonaContext();

  const setSlideRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      slideRefs.current[index] = el;
    },
    []
  );

  const filteredTemplates = CAROUSEL_TEMPLATES.filter((t) =>
    formatFilter === "all" ? true : t.aspectRatio === formatFilter
  );

  const generateContent = async () => {
    if (!topic.trim()) {
      toast.error("Informe o tema do carrossel");
      return;
    }
    setGenerating(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Build persona data to send to edge function
      const persona: Record<string, string> = {};
      if (hasProfile) {
        if (formData.niche) persona.niche = formData.niche;
        if (formData.product_description) persona.product = formData.product_description;
        if (formData.main_pain) persona.pain = formData.main_pain;
        if (formData.main_differentiator) persona.differentiator = formData.main_differentiator;
        if (raioX?.estrategia_recomendada?.tom_comunicacao) {
          persona.tone = raioX.estrategia_recomendada.tom_comunicacao;
        }
        const triggers = raioX?.estrategia_recomendada?.gatilhos_mentais_prioritarios;
        if (triggers && Array.isArray(triggers)) {
          persona.triggers = triggers.slice(0, 3).join(", ");
        }
      }

      const response = await supabase.functions.invoke("carousel-generator", {
        body: {
          topic,
          slideCount,
          tone,
          persona: Object.keys(persona).length > 0 ? persona : undefined,
        },
      });

      if (response.error) {
        const errorMsg = typeof response.error === "object" && "message" in response.error
          ? (response.error as { message: string }).message
          : "Erro ao gerar conteúdo";
        throw new Error(errorMsg);
      }

      const data = response.data as { slides?: { title: string; body: string }[]; error?: string };

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.slides || !Array.isArray(data.slides)) {
        throw new Error("Resposta inválida da IA");
      }

      const newSlides = createSlidesFromTemplate(selectedTemplate, data.slides);
      setSlides(newSlides);
      setCurrentSlide(0);
      slideRefs.current = new Array(newSlides.length).fill(null);
      toast.success("Carrossel gerado com sucesso!");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Erro ao gerar carrossel";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const updateSlide = (index: number, updates: Partial<SlideData>) => {
    setSlides((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  };

  const applyTemplateToAll = (template: CarouselTemplate) => {
    setSelectedTemplate(template);
    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        bgColor: template.bgColor,
        textColor: template.textColor,
        accentColor: template.accentColor,
        titleSize: template.titleSize,
        bodySize: template.bodySize,
        fontFamily: template.fontFamily,
        align: template.align,
        bgGradient: template.bgGradient,
        layout: template.layout,
        highlightBgColor: template.highlightBgColor,
      }))
    );
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      updateSlide(index, { imageUrl: dataUrl });
    } catch {
      toast.error("Erro ao carregar imagem");
    }
  };

  const handleMultiImageUpload = async (index: number, files: FileList) => {
    try {
      const urls = await Promise.all(Array.from(files).map(fileToDataUrl));
      const current = slides[index]?.imageUrls || [];
      updateSlide(index, { imageUrls: [...current, ...urls].slice(0, 4) });
    } catch {
      toast.error("Erro ao carregar imagens");
    }
  };

  const handleProfileImageUpload = async (index: number, file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      updateSlide(index, { profileImageUrl: dataUrl });
    } catch {
      toast.error("Erro ao carregar foto de perfil");
    }
  };

  const exportSlide = async (index: number) => {
    const el = slideRefs.current[index];
    if (!el) return;
    try {
      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 2,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
      const link = document.createElement("a");
      link.download = `slide-${index + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao exportar slide");
    }
  };

  const exportAll = async () => {
    setExporting(true);
    try {
      for (let i = 0; i < slides.length; i++) {
        await exportSlide(i);
        await new Promise((r) => setTimeout(r, 400));
      }
      toast.success("Todos os slides exportados!");
    } finally {
      setExporting(false);
    }
  };

  const current = slides[currentSlide];
  const currentLayout = current?.layout || "text-only";
  const showImageUpload = IMAGE_LAYOUTS.includes(currentLayout);
  const showMultiImage = MULTI_IMAGE_LAYOUTS.includes(currentLayout);
  const showProfile = PROFILE_LAYOUTS.includes(currentLayout);
  const showHighlight = HIGHLIGHT_LAYOUTS.includes(currentLayout);

  return (
    <div className="space-y-4 mt-4">
      {/* Generation Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" /> Gerador de Carrossel
            Visual
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            IA gera o conteúdo direto nos slides — edite cores, fontes e exporte
            como imagem
          </p>
          {hasProfile && (
            <Badge variant="secondary" className="w-fit text-xs mt-1">
              ✨ Persona conectada — conteúdo otimizado para seu público
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tema do carrossel</Label>
            <Textarea
              placeholder="Ex: 5 dicas para vender mais no WhatsApp"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Slides</Label>
              <Select
                value={String(slideCount)}
                onValueChange={(v) => setSlideCount(Number(v))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 7, 10].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} slides
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tom</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
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
              <Button
                size="sm"
                variant={formatFilter === "all" ? "default" : "outline"}
                onClick={() => setFormatFilter("all")}
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={formatFilter === "1:1" ? "default" : "outline"}
                onClick={() => setFormatFilter("1:1")}
              >
                <Square className="h-3 w-3 mr-1" /> Feed
              </Button>
              <Button
                size="sm"
                variant={formatFilter === "9:16" ? "default" : "outline"}
                onClick={() => setFormatFilter("9:16")}
              >
                <Smartphone className="h-3 w-3 mr-1" /> Stories
              </Button>
              <Button
                size="sm"
                variant={formatFilter === "16:9" ? "default" : "outline"}
                onClick={() => setFormatFilter("16:9")}
              >
                <Monitor className="h-3 w-3 mr-1" /> Wide
              </Button>
            </div>
          </div>

          {/* Template selector */}
          <div>
            <Label>Template visual</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {filteredTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplate(t);
                    if (slides.length > 0) applyTemplateToAll(t);
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedTemplate.id === t.id
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="flex-1 h-8 rounded"
                      style={{
                        background: t.bgGradient || t.bgColor,
                      }}
                    />
                    <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                      {t.aspectRatio}
                    </Badge>
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {t.name}
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    {t.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={generateContent}
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Gerando com IA...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" /> Gerar Carrossel
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Editor + Preview */}
      {slides.length > 0 && current && (
        <>
          {/* Navigation + Export */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                disabled={currentSlide === 0}
                onClick={() => setCurrentSlide((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge variant="secondary">
                Slide {currentSlide + 1} / {slides.length}
              </Badge>
              <Button
                size="icon"
                variant="outline"
                disabled={currentSlide === slides.length - 1}
                onClick={() => setCurrentSlide((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportSlide(currentSlide)}
              >
                <Download className="h-4 w-4 mr-1" /> PNG
              </Button>
              <Button
                size="sm"
                onClick={exportAll}
                disabled={exporting}
              >
                <DownloadCloud className="h-4 w-4 mr-1" />
                {exporting ? "Exportando..." : "Baixar Todos"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Slide Preview */}
            <div className="flex justify-center">
              <SlidePreview
                ref={setSlideRef(currentSlide)}
                slide={current}
                slideIndex={currentSlide}
                totalSlides={slides.length}
                aspectRatio={selectedTemplate.aspectRatio}
              />
            </div>

            {/* Editor Controls */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Paintbrush className="h-4 w-4" /> Editar Slide{" "}
                  {currentSlide + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                {/* Title + Body */}
                <div>
                  <Label className="text-xs">Título</Label>
                  <Input
                    value={current.title}
                    onChange={(e) =>
                      updateSlide(currentSlide, { title: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Corpo</Label>
                  <Textarea
                    value={current.body}
                    onChange={(e) =>
                      updateSlide(currentSlide, { body: e.target.value })
                    }
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* ===== IMAGE UPLOAD (image-bg, editorial) ===== */}
                {showImageUpload && (
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <ImagePlus className="h-3 w-3" /> Imagem de fundo
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors text-xs text-muted-foreground">
                        <ImagePlus className="h-4 w-4" />
                        {current.imageUrl ? "Trocar imagem" : "Enviar imagem"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImageUpload(currentSlide, f);
                          }}
                        />
                      </label>
                      {current.imageUrl && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => updateSlide(currentSlide, { imageUrl: undefined })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== MULTI IMAGE UPLOAD (photo-grid) ===== */}
                {showMultiImage && (
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <ImagePlus className="h-3 w-3" /> Fotos do grid (até 4)
                    </Label>
                    <div className="mt-1 space-y-2">
                      <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors text-xs text-muted-foreground">
                        <ImagePlus className="h-4 w-4" />
                        Adicionar fotos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files)
                              handleMultiImageUpload(currentSlide, e.target.files);
                          }}
                        />
                      </label>
                      {(current.imageUrls?.length || 0) > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {current.imageUrls!.map((url, i) => (
                            <div key={i} className="relative w-12 h-12 rounded overflow-hidden group">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              <button
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                onClick={() => {
                                  const updated = [...(current.imageUrls || [])];
                                  updated.splice(i, 1);
                                  updateSlide(currentSlide, { imageUrls: updated });
                                }}
                              >
                                <X className="h-3 w-3 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== PROFILE FIELDS (profile-post, photo-grid) ===== */}
                {showProfile && (
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1">
                      <User className="h-3 w-3" /> Dados do perfil
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Nome"
                        value={current.profileName || ""}
                        onChange={(e) =>
                          updateSlide(currentSlide, { profileName: e.target.value })
                        }
                        className="text-xs"
                      />
                      <Input
                        placeholder="@handle"
                        value={current.profileHandle || ""}
                        onChange={(e) =>
                          updateSlide(currentSlide, { profileHandle: e.target.value })
                        }
                        className="text-xs"
                      />
                    </div>
                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {current.profileImageUrl ? "Trocar avatar" : "Enviar avatar"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleProfileImageUpload(currentSlide, f);
                        }}
                      />
                    </label>
                  </div>
                )}

                {/* ===== HIGHLIGHT COLOR (sales-highlight) ===== */}
                {showHighlight && (
                  <div>
                    <Label className="text-xs">Cor do bloco de destaque</Label>
                    <input
                      type="color"
                      value={current.highlightBgColor || "#22C55E"}
                      onChange={(e) =>
                        updateSlide(currentSlide, { highlightBgColor: e.target.value })
                      }
                      className="w-full h-9 rounded border border-input cursor-pointer mt-1"
                    />
                  </div>
                )}

                {/* Colors */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Fundo</Label>
                    <input
                      type="color"
                      value={current.bgColor}
                      onChange={(e) =>
                        updateSlide(currentSlide, {
                          bgColor: e.target.value,
                          bgGradient: undefined,
                        })
                      }
                      className="w-full h-9 rounded border border-input cursor-pointer mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Texto</Label>
                    <input
                      type="color"
                      value={current.textColor}
                      onChange={(e) =>
                        updateSlide(currentSlide, {
                          textColor: e.target.value,
                        })
                      }
                      className="w-full h-9 rounded border border-input cursor-pointer mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Destaque</Label>
                    <input
                      type="color"
                      value={current.accentColor}
                      onChange={(e) =>
                        updateSlide(currentSlide, {
                          accentColor: e.target.value,
                        })
                      }
                      className="w-full h-9 rounded border border-input cursor-pointer mt-1"
                    />
                  </div>
                </div>

                {/* Font sizes */}
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Type className="h-3 w-3" /> Tamanho do título:{" "}
                    {current.titleSize}px
                  </Label>
                  <Slider
                    value={[current.titleSize]}
                    onValueChange={([v]) =>
                      updateSlide(currentSlide, { titleSize: v })
                    }
                    min={16}
                    max={48}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-xs">
                    Tamanho do corpo: {current.bodySize}px
                  </Label>
                  <Slider
                    value={[current.bodySize]}
                    onValueChange={([v]) =>
                      updateSlide(currentSlide, { bodySize: v })
                    }
                    min={12}
                    max={32}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {/* Alignment */}
                <div>
                  <Label className="text-xs">Alinhamento</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      size="sm"
                      variant={
                        current.align === "left" ? "default" : "outline"
                      }
                      onClick={() =>
                        updateSlide(currentSlide, { align: "left" })
                      }
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        current.align === "center" ? "default" : "outline"
                      }
                      onClick={() =>
                        updateSlide(currentSlide, { align: "center" })
                      }
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  i === currentSlide
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div
                  className="w-full h-full flex items-center justify-center p-1"
                  style={{
                    background: s.imageUrl
                      ? `linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)), url(${s.imageUrl}) center/cover`
                      : s.bgGradient || s.bgColor,
                  }}
                >
                  <span
                    className="text-[8px] font-bold leading-tight text-center line-clamp-3"
                    style={{ color: s.textColor }}
                  >
                    {s.title}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Hidden slides for export */}
          <div className="absolute -left-[9999px] top-0" aria-hidden>
            {slides.map((s, i) =>
              i !== currentSlide ? (
                <SlidePreview
                  key={i}
                  ref={setSlideRef(i)}
                  slide={s}
                  slideIndex={i}
                  totalSlides={slides.length}
                  aspectRatio={selectedTemplate.aspectRatio}
                />
              ) : null
            )}
          </div>
        </>
      )}
    </div>
  );
}

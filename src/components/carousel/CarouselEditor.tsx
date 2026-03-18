import { useState, useRef, useCallback } from "react";
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
import SlidePreview from "./SlidePreview";
import {
  CAROUSEL_TEMPLATES,
  createSlidesFromTemplate,
  type SlideData,
  type CarouselTemplate,
} from "./CarouselTemplates";

export default function CarouselEditor() {
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState(5);
  const [tone, setTone] = useState("profissional");
  const [selectedTemplate, setSelectedTemplate] = useState<CarouselTemplate>(
    CAROUSEL_TEMPLATES[0]
  );
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const setSlideRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      slideRefs.current[index] = el;
    },
    []
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

      const prompt = `Gere um carrossel de ${slideCount} slides sobre "${topic}" no tom ${tone}.

IMPORTANTE: Responda APENAS com um JSON válido, sem markdown, sem texto extra. Formato:
[{"title":"Título do slide","body":"Corpo do slide com 2-3 linhas"}]

Regras:
- Slide 1: gancho forte que prende atenção
- Slides intermediários: conteúdo de valor, dicas práticas
- Último slide: CTA com chamada para ação
- Títulos curtos e impactantes (max 8 palavras)
- Corpo com 2-3 linhas, linguagem direta
- Use emojis estrategicamente nos títulos`;

      const response = await supabase.functions.invoke("sales-strategist", {
        body: {
          messages: [{ role: "user", content: prompt }],
          mode: "private",
          userId: session?.user?.id,
        },
      });

      if (response.error) throw new Error("Erro ao gerar conteúdo");

      // Handle streaming response
      const reader = response.data instanceof ReadableStream
        ? response.data.getReader()
        : null;

      let fullText = "";

      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.replace("data: ", "").trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullText += content;
            } catch {
              // skip
            }
          }
        }
      } else if (typeof response.data === "string") {
        fullText = response.data;
      }

      // Extract JSON from response
      const jsonMatch = fullText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Resposta inválida da IA");

      const content = JSON.parse(jsonMatch[0]) as {
        title: string;
        body: string;
      }[];
      const newSlides = createSlidesFromTemplate(selectedTemplate, content);
      setSlides(newSlides);
      setCurrentSlide(0);
      slideRefs.current = new Array(newSlides.length).fill(null);
      toast.success("Carrossel gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar carrossel. Tente novamente.");
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
      }))
    );
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
        await new Promise((r) => setTimeout(r, 300));
      }
      toast.success("Todos os slides exportados!");
    } finally {
      setExporting(false);
    }
  };

  const current = slides[currentSlide];

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

          {/* Template selector */}
          <div>
            <Label>Template visual</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {CAROUSEL_TEMPLATES.map((t) => (
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
                  <div
                    className="w-full h-8 rounded mb-2"
                    style={{
                      background: t.bgGradient || t.bgColor,
                    }}
                  />
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
                {exporting ? "Exportando..." : "Todos"}
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
              <CardContent className="space-y-4">
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
                    background: s.bgGradient || s.bgColor,
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

          {/* Hidden slides for export (all rendered for html-to-image) */}
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

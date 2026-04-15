import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import SlidePreview from "./SlidePreview";
import type { CarouselTemplate, SlideData } from "./CarouselTemplates";

interface TemplatePreviewTooltipProps {
  template: CarouselTemplate;
  children: React.ReactNode;
}

const SAMPLE_CONTENT = {
  title: "Título de exemplo do slide",
  body: "Este é um texto de exemplo para visualizar como o template ficará com conteúdo real.",
};

export default function TemplatePreviewTooltip({ template, children }: TemplatePreviewTooltipProps) {
  const sampleSlide: SlideData = {
    title: SAMPLE_CONTENT.title,
    body: SAMPLE_CONTENT.body,
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
    profileName: "Mentora Gi",
    profileHandle: "@mentoragi",
  };

  const aspectRatio = template.aspectRatio;
  const previewWidth = 220;
  const previewHeight = aspectRatio === "9:16" ? 390 : aspectRatio === "16:9" ? 124 : 220;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="center"
        sideOffset={12}
        className="w-auto p-2 bg-popover border border-border shadow-xl rounded-xl"
      >
        <div className="text-xs font-semibold text-foreground mb-1.5 px-1">{template.name}</div>
        <div
          className="rounded-lg overflow-hidden border border-border/50"
          style={{ width: previewWidth, height: previewHeight }}
        >
          <div
            style={{
              transform: `scale(${previewWidth / (aspectRatio === "16:9" ? 1920 : 1080)})`,
              transformOrigin: "top left",
              width: aspectRatio === "16:9" ? 1920 : 1080,
              height: aspectRatio === "16:9" ? 1080 : aspectRatio === "9:16" ? 1920 : 1080,
              pointerEvents: "none",
            }}
          >
            <SlidePreview slide={sampleSlide} aspectRatio={aspectRatio} slideIndex={0} totalSlides={1} />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1 max-w-[220px]">{template.description}</p>
      </HoverCardContent>
    </HoverCard>
  );
}

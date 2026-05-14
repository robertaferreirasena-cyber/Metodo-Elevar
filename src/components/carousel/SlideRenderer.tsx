import React from "react";
import { ImagePlus } from "lucide-react";
import { FORMAT_SPECS, type SlideData, type AspectRatio } from "./CarouselTemplates";
import {
  PAPER_TEXTURES, WashiTape, WaxSeal, GoldStamp, SpiralBinder,
  TornPaperPath, EnvelopeShape, HandDrawnArrow,
} from "./journalDecorations";
import { getJournalScale } from "./journalScaleHelpers";

interface SlideRendererProps {
  slide: SlideData;
  slideIndex: number;
  totalSlides: number;
  aspectRatio: AspectRatio;
  fontScale: number;
  isExport?: boolean;
}

export const SlideRenderer = React.memo(({ 
  slide, 
  slideIndex, 
  totalSlides, 
  aspectRatio, 
  fontScale,
  isExport = false
}: SlideRendererProps) => {
  const spec = FORMAT_SPECS[aspectRatio];
  const layout = slide.layout || "text-only";
  const padSize = Math.round(40 * fontScale);
  const padPx = `${padSize}px`;

  const titleStyle: React.CSSProperties = {
    color: slide.titleColor || slide.textColor,
    fontSize: `${slide.titleSize * fontScale}px`,
    fontWeight: slide.titleBold !== false ? "bold" : "normal",
    fontStyle: slide.titleItalic ? "italic" : "normal",
    textDecoration: slide.titleUnderline ? "underline" : "none",
    textShadow: slide.textShadow || undefined,
    lineHeight: 1.15,
    fontFamily: slide.fontFamily,
    textAlign: slide.titleAlign || slide.align || "center",
  };

  const bodyStyle: React.CSSProperties = {
    color: slide.bodyColor || slide.textColor,
    fontSize: `${slide.bodySize * fontScale}px`,
    opacity: 0.9,
    fontWeight: slide.bodyBold ? "bold" : "normal",
    fontStyle: slide.bodyItalic ? "italic" : "normal",
    textDecoration: slide.bodyUnderline ? "underline" : "none",
    textShadow: slide.textShadow || undefined,
    lineHeight: 1.5,
    fontFamily: slide.fontFamily,
    textAlign: slide.bodyAlign || slide.align || "center",
    marginTop: slide.gap ? `${slide.gap * fontScale}px` : undefined,
  };

  const counterStyle: React.CSSProperties = {
    color: slide.accentColor,
    fontSize: `${14 * fontScale}px`,
    fontFamily: slide.fontFamily,
  };

  const buildImageStyle = (opts: any = {}): React.CSSProperties => {
    const posX = opts.positionX ?? 50;
    const posY = opts.positionY ?? 50;
    const scl = opts.scale ?? 1;
    const blur = opts.blur ?? 0;
    const bright = opts.brightness ?? 100;
    const contrast = opts.contrast ?? 100;
    return {
      objectPosition: `${posX}% ${posY}%`,
      transform: `scale(${scl})`,
      filter: `blur(${blur}px) brightness(${bright}%) contrast(${contrast}%)`,
    };
  };

  const renderBgImage = () => {
    const bgUrl = slide.bgImageUrl || (layout === "image-bg" ? slide.imageUrl : undefined);
    if (!bgUrl) return null;
    const opacity = slide.overlayOpacity ?? 0.55;
    const useBg = !!slide.bgImageUrl;
    const adj = useBg
      ? { positionX: slide.bgImagePositionX, positionY: slide.bgImagePositionY, scale: slide.bgImageScale, blur: slide.bgImageBlur, brightness: slide.bgImageBrightness, contrast: slide.bgImageContrast }
      : { positionX: slide.imagePositionX, positionY: slide.imagePositionY, scale: slide.imageScale, blur: slide.imageBlur, brightness: slide.imageBrightness, contrast: slide.imageContrast };
    
    return (
      <>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img 
            src={bgUrl} 
            alt="" 
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover" 
            style={buildImageStyle(adj)}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `rgba(0,0,0,${opacity})` }} />
      </>
    );
  };

  const renderText = (text: string, style: React.CSSProperties, pos?: any, className?: string) => {
    if (!text) return null;
    const posStyle: React.CSSProperties = pos ? { 
      position: 'absolute', 
      left: `${pos.x * 100}%`, 
      top: `${pos.y * 100}%`, 
      width: pos.width ? `${pos.width * 100}%` : undefined,
      height: pos.height ? `${pos.height * 100}%` : undefined,
      margin: 0
    } : {};
    return (
      <div 
        className={className} 
        style={{ ...style, ...posStyle }}
        dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }}
      />
    );
  };

  const journal = getJournalScale(aspectRatio, (slide.title || "").length, (slide.body || "").length);

  return (
    <div
      className="slide-content-root"
      style={{
        width: spec.width,
        height: spec.height,
        fontFamily: slide.fontFamily,
        position: "relative",
        overflow: "hidden",
        background: slide.bgGradient || slide.bgColor,
        userSelect: "none",
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        {(layout !== "image-bg" && slide.bgImageUrl) && renderBgImage()}
      </div>
      
      {layout === "image-bg" && (
        <>
          <div className="absolute inset-0 pointer-events-none">
            {renderBgImage()}
          </div>
          <div className="absolute inset-0 flex flex-col" style={{ padding: padPx, textAlign: slide.align, justifyContent: slide.verticalAlign === "top" ? "flex-start" : "flex-end" }}>
            <div className="mb-2 font-bold uppercase tracking-widest" style={counterStyle}>
              {slideIndex + 1} / {totalSlides}
            </div>
            {renderText(slide.title, titleStyle, slide.titlePos, "mb-1")}
            {renderText(slide.body, bodyStyle, slide.bodyPos)}
          </div>
          <div className="absolute bottom-0 left-0 right-0" style={{ height: 4 * fontScale, backgroundColor: slide.accentColor }} />
        </>
      )}



      {layout === "text-only" && (
        <>
          <div 
            className="absolute inset-0 flex flex-col" 
            style={{ 
              padding: padPx, 
              textAlign: slide.align, 
              justifyContent: slide.verticalAlign === "top" ? "flex-start" : slide.verticalAlign === "bottom" ? "flex-end" : "center" 
            }}
          >
            <div className="mb-4 font-bold uppercase tracking-widest" style={counterStyle}>
              {slideIndex + 1} / {totalSlides}
            </div>
            
            <div className="flex-1 flex flex-col" style={{ 
              justifyContent: slide.verticalAlign === "top" ? "flex-start" : slide.verticalAlign === "bottom" ? "flex-end" : "center" 
            }}>
              <div style={{ 
                flex: slide.titleVerticalAlign === "top" ? "0 0 auto" : slide.titleVerticalAlign === "bottom" ? "1 1 auto" : "0 0 auto",
                display: "flex",
                flexDirection: "column",
                justifyContent: slide.titleVerticalAlign === "bottom" ? "flex-end" : "flex-start"
              }}>
                {renderText(slide.title, titleStyle, slide.titlePos, "mb-4")}
              </div>
              
              <div style={{ 
                flex: slide.bodyVerticalAlign === "bottom" ? "0 0 auto" : slide.bodyVerticalAlign === "top" ? "1 1 auto" : "0 0 auto",
                display: "flex",
                flexDirection: "column",
                justifyContent: slide.bodyVerticalAlign === "top" ? "flex-start" : "flex-end"
              }}>
                {renderText(slide.body, bodyStyle, slide.bodyPos)}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0" style={{ height: 4 * fontScale, backgroundColor: slide.accentColor }} />
        </>
      )}

      {layout === "profile-post" && (
        <div className="absolute inset-0 flex flex-col p-8" style={{ textAlign: slide.align }}>
          <div className="flex items-center gap-3 mb-6" style={{ justifyContent: slide.align === 'center' ? 'center' : 'flex-start' }}>
            <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
              {slide.profileImageUrl && <img src={slide.profileImageUrl} className="w-full h-full object-cover" crossOrigin="anonymous" />}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div className="font-bold" style={{ color: slide.textColor }}>{slide.profileName || "Seu Nome"}</div>
              <div className="text-xs opacity-60" style={{ color: slide.textColor }}>{slide.profileHandle || "@seuusuario"}</div>
            </div>
          </div>
          {renderText(slide.title, titleStyle, slide.titlePos, "mb-4")}
          {renderText(slide.body, bodyStyle, slide.bodyPos)}
        </div>
      )}

      {layout === "editorial" && (
        <div className="absolute inset-0 flex p-12 gap-8">
          <div className="flex-1 flex flex-col justify-center">
            {renderText(slide.title, titleStyle, slide.titlePos, "mb-6")}
            {renderText(slide.body, bodyStyle, slide.bodyPos)}
          </div>
          <div className="w-1/3 bg-muted rounded-lg overflow-hidden relative">
            {slide.imageUrl ? (
              <img 
                src={slide.imageUrl} 
                className="w-full h-full object-cover" 
                crossOrigin="anonymous"
                style={buildImageStyle({ positionX: slide.imagePositionX, positionY: slide.imagePositionY, scale: slide.imageScale, blur: slide.imageBlur, brightness: slide.imageBrightness, contrast: slide.imageContrast })}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                 <ImagePlus className="w-12 h-12" />
              </div>
            )}
          </div>
        </div>
      )}

      {layout === "journal-photo-card" && (
        <div className="absolute inset-0 flex items-center justify-center p-12">
           {renderBgImage()}
           <div className="relative z-10 p-10 shadow-2xl rounded-sm" style={{ backgroundColor: slide.bgColor, width: '80%', height: '70%', textAlign: slide.align }}>
              {renderText(slide.title, titleStyle, slide.titlePos, "mb-4")}
              {renderText(slide.body, bodyStyle, slide.bodyPos)}
              <div className="absolute top-4 right-4"><WashiTape width={120 * fontScale} color={slide.accentColor} rotate={-15} /></div>
           </div>
        </div>
      )}

      {/* Default footer accent line for non-journaling */}
      {!layout.startsWith('journal-') && (
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: slide.accentColor }} />
      )}
    </div>
  );
});

SlideRenderer.displayName = "SlideRenderer";



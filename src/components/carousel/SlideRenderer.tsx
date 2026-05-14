import React from "react";
import { ImagePlus } from "lucide-react";
import { FORMAT_SPECS, type SlideData, type AspectRatio } from "./CarouselTemplates";
import {
  PAPER_TEXTURES, WashiTape, WaxSeal, GoldStamp, SpiralBinder,
  TornPaperPath, EnvelopeShape, HandDrawnArrow,
} from "./journalDecorations";

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
    textShadow: slide.textShadow || undefined,
    lineHeight: 1.15,
    fontFamily: slide.fontFamily,
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
          />
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `rgba(0,0,0,${opacity})` }} />
      </>
    );
  };

  const renderStaticText = (text: string, style: React.CSSProperties, pos?: any, className?: string) => {
    const posStyle: React.CSSProperties = pos ? { 
      position: 'absolute', 
      left: `${pos.x * 100}%`, 
      top: `${pos.y * 100}%`, 
      width: pos.width ? `${pos.width * 100}%` : undefined,
      height: pos.height ? `${pos.height * 100}%` : undefined,
      margin: 0
    } : {};
    return <div className={className} style={{ ...style, ...posStyle }}>{text}</div>;
  };

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
      {(layout !== "image-bg" && slide.bgImageUrl) && renderBgImage()}
      
      {layout === "image-bg" && (
        <>
          {renderBgImage()}
          <div className="absolute inset-0 flex flex-col" style={{ padding: padPx, textAlign: slide.align, justifyContent: slide.verticalAlign === "top" ? "flex-start" : "flex-end" }}>
            <div className="mb-2 font-bold uppercase tracking-widest" style={counterStyle}>
              {slideIndex + 1} / {totalSlides}
            </div>
            {renderStaticText(slide.title, titleStyle, slide.titlePos, "mb-2")}
            {renderStaticText(slide.body, bodyStyle, slide.bodyPos)}
          </div>
          <div className="absolute bottom-0 left-0 right-0" style={{ height: 4 * fontScale, backgroundColor: slide.accentColor }} />
        </>
      )}

      {layout === "text-only" && (
        <>
          <div className="absolute inset-0 flex flex-col" style={{ padding: padPx, textAlign: slide.align, justifyContent: slide.verticalAlign === "top" ? "flex-start" : "center" }}>
            <div className="mb-4 font-bold uppercase tracking-widest" style={counterStyle}>
              {slideIndex + 1} / {totalSlides}
            </div>
            {renderStaticText(slide.title, titleStyle, slide.titlePos, "mb-4")}
            {renderStaticText(slide.body, bodyStyle, slide.bodyPos)}
          </div>
          <div className="absolute bottom-0 left-0 right-0" style={{ height: 4 * fontScale, backgroundColor: slide.accentColor }} />
        </>
      )}

      {layout === "editorial" && (
        <>
          <div className="absolute inset-0 flex">
            <div className="flex-1 flex flex-col justify-center" style={{ padding: padPx, textAlign: slide.align }}>
              <div className="mb-2 font-bold uppercase tracking-widest" style={counterStyle}>
                {slideIndex + 1} / {totalSlides}
              </div>
              {renderStaticText(slide.title, titleStyle, slide.titlePos, "mb-3")}
              {renderStaticText(slide.body, bodyStyle, slide.bodyPos)}
            </div>
            <div className="w-[45%] relative">
              {slide.imageUrl ? (
                <div className="absolute inset-0 overflow-hidden">
                  <img 
                    src={slide.imageUrl} 
                    alt="" 
                    crossOrigin="anonymous"
                    className="absolute inset-0 w-full h-full object-cover" 
                    style={buildImageStyle({ positionX: slide.imagePositionX, positionY: slide.imagePositionY, scale: slide.imageScale, blur: slide.imageBlur, brightness: slide.imageBrightness, contrast: slide.imageContrast })} 
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <ImagePlus style={{ color: slide.accentColor, opacity: 0.4, width: 60 * fontScale, height: 60 * fontScale }} />
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0" style={{ height: 4 * fontScale, backgroundColor: slide.accentColor }} />
        </>
      )}
    </div>
  );
});

SlideRenderer.displayName = "SlideRenderer";

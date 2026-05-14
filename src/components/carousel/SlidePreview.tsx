import { forwardRef, useRef, useEffect, useState, useImperativeHandle, useCallback } from "react";
import { ImagePlus, X } from "lucide-react";
import { Rnd } from "react-rnd";
import type { SlideData } from "./CarouselTemplates";
import { FORMAT_SPECS, type AspectRatio } from "./CarouselTemplates";
import {
  PAPER_TEXTURES, WashiTape, WaxSeal, GoldStamp, SpiralBinder,
  TornPaperPath, EnvelopeShape, HandDrawnArrow,
} from "./journalDecorations";
import { getJournalScale } from "./journalScaleHelpers";

export interface SlidePreviewRef {
  resetTransform: () => void;
  container: HTMLDivElement | null;
}

interface SlidePreviewProps {
  slide: SlideData;
  slideIndex: number;
  totalSlides: number;
  aspectRatio: AspectRatio;
  nativeSize?: boolean;
  isFreeEditMode?: boolean;
  onUpdate?: (updates: Partial<SlideData>) => void;
  onReady?: () => void;
  selectedLayerId?: string;
  onSelectLayer?: (id: string | undefined) => void;
  zoom?: number;
}

const SlidePreview = forwardRef<SlidePreviewRef, SlidePreviewProps>(
  ({ slide, slideIndex, totalSlides, aspectRatio, nativeSize, isFreeEditMode, onUpdate, onReady, selectedLayerId, onSelectLayer, zoom = 1 }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [showGuides, setShowGuides] = useState<{ x?: number; y?: number }>({});
    const spec = FORMAT_SPECS[aspectRatio];
    const layout = slide.layout || "text-only";

    useImperativeHandle(ref, () => ({
      resetTransform: () => {},
      container: innerRef.current
    }));

    const basePreviewWidth = 480;
    const fontScale = (spec.width / basePreviewWidth);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const checkAssets = async () => {
        const imgs = Array.from(el.querySelectorAll("img"));
        await Promise.all(imgs.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }));
        onReady?.();
      };

      checkAssets();

      if (nativeSize) { 
        setScale(1); 
        return; 
      }
      
      const updateScale = () => {
        if (!el) return;
        const cw = el.offsetWidth;
        const ch = el.offsetHeight;
        if (cw > 0 && ch > 0) {
          const scaleW = cw / spec.width;
          const scaleH = ch / spec.height;
          setScale(Math.min(scaleW, scaleH));
        }
      };

      updateScale();
      const observer = new ResizeObserver(() => updateScale());
      observer.observe(el);
      return () => observer.disconnect();
    }, [spec.width, nativeSize, slide, onReady]);

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

    const padSize = Math.round(40 * fontScale);
    const padPx = `${padSize}px`;

    const updateGuides = useCallback((x: number, y: number, w: number, h: number) => {
      const centerX = x + w / 2;
      const centerY = y + h / 2;
      const threshold = 5;
      const guides: { x?: number; y?: number } = {};
      if (Math.abs(centerX - spec.width / 2) < threshold) guides.x = spec.width / 2;
      if (Math.abs(centerY - spec.height / 2) < threshold) guides.y = spec.height / 2;
      if (Math.abs(x) < threshold) guides.x = 0;
      if (Math.abs(x + w - spec.width) < threshold) guides.x = spec.width;
      if (Math.abs(y) < threshold) guides.y = 0;
      if (Math.abs(y + h - spec.height) < threshold) guides.y = spec.height;
      setShowGuides(guides);
      return guides;
    }, [spec.width, spec.height]);

    const handleDrag = (d: { x: number; y: number }, w: number, h: number) => {
      updateGuides(d.x, d.y, w, h);
    };

    const handleDragStop = () => {
      setShowGuides({});
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

    const renderDraggableTitle = (extraStyles: React.CSSProperties = {}, className: string = "mb-4") => {
      const combinedStyle = { ...titleStyle, ...extraStyles };
      const pos = slide.titlePos || { x: 0.1, y: 0.1, width: 0.8, height: 0.1 };
      
      if (isFreeEditMode) {
        return (
          <Rnd
            className="pointer-events-auto z-20 group"
            position={{ x: pos.x * spec.width, y: pos.y * spec.height }}
            size={pos.width ? { width: pos.width * spec.width, height: pos.height * spec.height } : undefined}
            onDrag={(e, d) => handleDrag(d, (pos.width || 0.8) * spec.width, (pos.height || 0.1) * spec.height)}
            onDragStop={(e, d) => {
              handleDragStop();
              onUpdate?.({ titlePos: { ...pos, x: d.x / spec.width, y: d.y / spec.height } });
            }}
            onResizeStop={(e, dir, ref, delta, pos) => {
              onUpdate?.({ titlePos: { ...pos, x: pos.x / spec.width, y: pos.y / spec.height, width: ref.offsetWidth / spec.width, height: ref.offsetHeight / spec.height } });
            }}
            bounds="parent"
            enableResizing={isFreeEditMode}
            disableDragging={!isFreeEditMode}
          >
            <h2 className="relative" style={{ ...combinedStyle, margin: 0, width: '100%', height: '100%' }}>
              {slide.title}
              {isFreeEditMode && <div className="absolute -inset-1 border-2 border-primary/40 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />}
            </h2>
          </Rnd>
        );
      }
      return <h2 className={className} style={{ ...combinedStyle, position: 'absolute', left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, width: `${pos.width * 100}%` }}>{slide.title}</h2>;
    };

    const renderDraggableBody = (extraStyles: React.CSSProperties = {}, className: string = "whitespace-pre-wrap") => {
      const combinedStyle = { ...bodyStyle, ...extraStyles };
      const pos = slide.bodyPos || { x: 0.1, y: 0.25, width: 0.8, height: 0.3 };

      if (isFreeEditMode) {
        return (
          <Rnd
            className="pointer-events-auto z-20 group"
            position={{ x: pos.x * spec.width, y: pos.y * spec.height }}
            size={pos.width ? { width: pos.width * spec.width, height: pos.height * spec.height } : undefined}
            onDrag={(e, d) => handleDrag(d, (pos.width || 0.8) * spec.width, (pos.height || 0.3) * spec.height)}
            onDragStop={(e, d) => {
              handleDragStop();
              onUpdate?.({ bodyPos: { ...pos, x: d.x / spec.width, y: d.y / spec.height } });
            }}
            onResizeStop={(e, dir, ref, delta, pos) => {
              onUpdate?.({ bodyPos: { ...pos, x: pos.x / spec.width, y: pos.y / spec.height, width: ref.offsetWidth / spec.width, height: ref.offsetHeight / spec.height } });
            }}
            bounds="parent"
            enableResizing={isFreeEditMode}
            disableDragging={!isFreeEditMode}
          >
            <p className="relative" style={{ ...combinedStyle, margin: 0, width: '100%', height: '100%' }}>
              {slide.body}
              {isFreeEditMode && <div className="absolute -inset-1 border-2 border-primary/40 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />}
            </p>
          </Rnd>
        );
      }
      return <p className={className} style={{ ...combinedStyle, position: 'absolute', left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, width: `${pos.width * 100}%` }}>{slide.body}</p>;
    };

    const slideContent = (
      <div
        ref={innerRef}
        className="slide-canvas"
        style={{
          width: spec.width,
          height: spec.height,
          fontFamily: slide.fontFamily,
          position: "relative",
          overflow: "hidden",
          background: slide.bgGradient || slide.bgColor,
        }}
      >
        {showGuides.x !== undefined && (
          <div className="absolute z-50 bg-primary/60 pointer-events-none" style={{ left: showGuides.x, top: 0, bottom: 0, width: 1.5 / zoom }} />
        )}
        {showGuides.y !== undefined && (
          <div className="absolute z-50 bg-primary/60 pointer-events-none" style={{ top: showGuides.y, left: 0, right: 0, height: 1.5 / zoom }} />
        )}

        {(layout !== "image-bg" && slide.bgImageUrl) && renderBgImage()}

        {layout === "image-bg" && (
          <>
            {renderBgImage()}
            <div className="absolute inset-0 flex flex-col" style={{ padding: padPx, textAlign: slide.align, justifyContent: slide.verticalAlign === "top" ? "flex-start" : "flex-end" }}>
               <div className="mb-2 font-bold uppercase tracking-widest" style={counterStyle}>
                {slideIndex + 1} / {totalSlides}
              </div>
              {renderDraggableTitle({ marginBottom: 8 * fontScale }, "mb-2")}
              {renderDraggableBody({ opacity: 0.85 })}
            </div>
          </>
        )}

        {layout === "text-only" && (
          <>
            <div className="absolute inset-0 flex flex-col pointer-events-none" style={{ padding: padPx, textAlign: slide.align, justifyContent: slide.verticalAlign === "top" ? "flex-start" : "center" }}>
              <div className="mb-4 font-bold uppercase tracking-widest" style={counterStyle}>
                {slideIndex + 1} / {totalSlides}
              </div>
              {renderDraggableTitle({ marginBottom: 16 * fontScale })}
              {renderDraggableBody({ opacity: 0.9 })}
            </div>
          </>
        )}

        {slide.layers?.map((layer) => (
          <Rnd
            key={layer.id}
            position={{ x: layer.x * spec.width, y: layer.y * spec.height }}
            size={{ width: layer.width * spec.width, height: layer.height * spec.height }}
            onDrag={(e, d) => handleDrag(d, layer.width * spec.width, layer.height * spec.height)}
            onDragStop={(e, d) => {
              handleDragStop();
              const newLayers = slide.layers?.map(l => l.id === layer.id ? { ...l, x: d.x / spec.width, y: d.y / spec.height } : l);
              onUpdate?.({ layers: newLayers });
            }}
            onResizeStop={(e, dir, ref, delta, pos) => {
              const newLayers = slide.layers?.map(l => l.id === layer.id ? { 
                ...l, x: pos.x / spec.width, y: pos.y / spec.height, 
                width: ref.offsetWidth / spec.width, height: ref.offsetHeight / spec.height 
              } : l);
              onUpdate?.({ layers: newLayers });
            }}
            bounds="parent"
            enableResizing={isFreeEditMode}
            disableDragging={!isFreeEditMode}
            className={isFreeEditMode ? "z-10 group" : "pointer-events-none"}
          >
             <div className="w-full h-full flex items-center justify-center relative">
                {layer.type === "text" && <div style={{ ...bodyStyle, margin: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...layer.style }}>{layer.content}</div>}
                {layer.type === "sticker" && <div style={{ fontSize: layer.height * spec.height * 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{layer.content}</div>}
                {isFreeEditMode && (
                  <button className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100" onClick={() => onUpdate?.({ layers: slide.layers?.filter(l => l.id !== layer.id) })}>
                    <X className="h-3 w-3" />
                  </button>
                )}
             </div>
          </Rnd>
        ))}
      </div>
    );

    if (nativeSize) return slideContent;

    return (
      <div 
        ref={containerRef} 
        className="w-full h-full flex items-center justify-center overflow-visible relative"
      >
        <div
          style={{
            width: spec.width,
            height: spec.height,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            background: "#fff",
            flexShrink: 0,
          }}
        >
          {slideContent}
        </div>
      </div>
    );
  }
);

SlidePreview.displayName = "SlidePreview";
export default SlidePreview;

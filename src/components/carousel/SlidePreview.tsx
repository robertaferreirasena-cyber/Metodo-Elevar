import { forwardRef, useRef, useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Rnd } from "react-rnd";
import type { SlideData } from "./CarouselTemplates";
import { FORMAT_SPECS, type AspectRatio } from "./CarouselTemplates";
import {
  PAPER_TEXTURES, WashiTape, WaxSeal, GoldStamp, SpiralBinder,
  TornPaperPath, EnvelopeShape, NotebookLines, HandDrawnArrow, PaperClip,
} from "./journalDecorations";
import { getJournalScale } from "./journalScaleHelpers";

interface SlidePreviewProps {
  slide: SlideData;
  slideIndex: number;
  totalSlides: number;
  aspectRatio: AspectRatio;
  /** When true, render at native resolution without scaling (for export) */
  nativeSize?: boolean;
  /** Whether we are in "Free Edit" mode (drag & resize) */
  isFreeEditMode?: boolean;
  /** Callback when an element is moved or resized in free edit mode */
  onUpdate?: (updates: Partial<SlideData>) => void;
}

const SlidePreview = forwardRef<HTMLDivElement, SlidePreviewProps>(
  ({ slide, slideIndex, totalSlides, aspectRatio, nativeSize, isFreeEditMode, onUpdate }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const spec = FORMAT_SPECS[aspectRatio];
    const layout = slide.layout || "text-only";

    // Font scale factor: native resolution is much larger than preview container
    // so font sizes in SlideData (designed for ~480px preview) need to be scaled up
    const fontScale = spec.width / 480;

    useEffect(() => {
      if (nativeSize) { setScale(1); return; }
      const el = containerRef.current;
      if (!el) return;
      const observer = new ResizeObserver(([entry]) => {
        const cw = entry.contentRect.width;
        setScale(cw / spec.width);
      });
      observer.observe(el);
      return () => observer.disconnect();
    }, [spec.width, nativeSize]);

    const titleStyle: React.CSSProperties = {
      color: slide.titleColor || slide.textColor,
      fontSize: `${slide.titleSize * fontScale}px`,
      fontWeight: slide.titleBold !== false ? "bold" : "normal",
      fontStyle: slide.titleItalic ? "italic" : "normal",
      textShadow: slide.textShadow || undefined,
      lineHeight: 1.15,
      fontFamily: slide.fontFamily, // Inline font for export fidelity
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
      fontFamily: slide.fontFamily, // Inline font for export fidelity
    };

    const counterStyle: React.CSSProperties = {
      color: slide.accentColor,
      fontSize: `${14 * fontScale}px`,
      fontFamily: slide.fontFamily,
    };

    const padSize = Math.round(40 * fontScale);
    // Use inline padding for exact control
    const padPx = `${padSize}px`;

    const renderTitle = (extraStyles: React.CSSProperties = {}, className: string = "mb-4") => {
      const combinedStyle = { ...titleStyle, ...extraStyles };
      if (isFreeEditMode) {
        return (
          <Rnd
            className="pointer-events-auto z-20"
            position={slide.titlePos ? { x: slide.titlePos.x * spec.width, y: slide.titlePos.y * spec.height } : undefined}
            size={slide.titlePos?.width ? { width: slide.titlePos.width * spec.width, height: slide.titlePos.height * spec.height } : undefined}
            onDragStop={(e, d) => onUpdate?.({ titlePos: { ...slide.titlePos, x: d.x / spec.width, y: d.y / spec.height } })}
            onResizeStop={(e, dir, ref, delta, pos) => onUpdate?.({ titlePos: { ...slide.titlePos, x: pos.x / spec.width, y: pos.y / spec.height, width: ref.offsetWidth / spec.width, height: ref.offsetHeight / spec.height } })}
            bounds="parent"
            enableResizing={isFreeEditMode}
            disableDragging={!isFreeEditMode}
          >
            <h2 style={{ ...combinedStyle, margin: 0, width: '100%', height: '100%' }}>{slide.title}</h2>
          </Rnd>
        );
      }
      const posStyle: React.CSSProperties = slide.titlePos ? { 
        position: 'absolute', 
        left: `${slide.titlePos.x * 100}%`, 
        top: `${slide.titlePos.y * 100}%`, 
        width: slide.titlePos.width ? `${slide.titlePos.width * 100}%` : undefined,
        height: slide.titlePos.height ? `${slide.titlePos.height * 100}%` : undefined,
        margin: 0
      } : {};
      return <h2 className={className} style={{ ...combinedStyle, ...posStyle }}>{slide.title}</h2>;
    };

    const renderBody = (extraStyles: React.CSSProperties = {}, className: string = "whitespace-pre-wrap") => {
      const combinedStyle = { ...bodyStyle, ...extraStyles };
      if (isFreeEditMode) {
        return (
          <Rnd
            className="pointer-events-auto z-20"
            position={slide.bodyPos ? { x: slide.bodyPos.x * spec.width, y: slide.bodyPos.y * spec.height } : undefined}
            size={slide.bodyPos?.width ? { width: slide.bodyPos.width * spec.width, height: slide.bodyPos.height * spec.height } : undefined}
            onDragStop={(e, d) => onUpdate?.({ bodyPos: { ...slide.bodyPos, x: d.x / spec.width, y: d.y / spec.height } })}
            onResizeStop={(e, dir, ref, delta, pos) => onUpdate?.({ bodyPos: { ...slide.bodyPos, x: pos.x / spec.width, y: pos.y / spec.height, width: ref.offsetWidth / spec.width, height: ref.offsetHeight / spec.height } })}
            bounds="parent"
            enableResizing={isFreeEditMode}
            disableDragging={!isFreeEditMode}
          >
            <p style={{ ...combinedStyle, margin: 0, width: '100%', height: '100%' }}>{slide.body}</p>
          </Rnd>
        );
      }
      const posStyle: React.CSSProperties = slide.bodyPos ? { 
        position: 'absolute', 
        left: `${slide.bodyPos.x * 100}%`, 
        top: `${slide.bodyPos.y * 100}%`, 
        width: slide.bodyPos.width ? `${slide.bodyPos.width * 100}%` : undefined,
        height: slide.bodyPos.height ? `${slide.bodyPos.height * 100}%` : undefined,
        margin: 0
      } : {};
      return <p className={className} style={{ ...combinedStyle, ...posStyle }}>{slide.body}</p>;
    };

    // Helper: build CSS style object for an image container or direct img adjustments.
    const buildImageStyle = (
      opts: {
        positionX?: number; positionY?: number; scale?: number;
        blur?: number; brightness?: number; contrast?: number;
      } = {}
    ): React.CSSProperties => {
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
              className="absolute inset-0 w-full h-full object-cover" 
              style={buildImageStyle(adj)}
            />
          </div>
          <div className="absolute inset-0 pointer-events-none" style={{ background: `rgba(0,0,0,${opacity})` }} />
        </>
      );
    };

    // The inner slide at native resolution
    const slideContent = (
      <div
        ref={ref}
        style={{
          width: spec.width,
          height: spec.height,
          fontFamily: slide.fontFamily,
          position: "relative",
          overflow: "hidden",
          background: slide.bgGradient || slide.bgColor,
        }}
      >
        {(layout !== "image-bg" && slide.bgImageUrl) && renderBgImage()}

        {/* =========== IMAGE-BG LAYOUT =========== */}
        {layout === "image-bg" && (
          <>
            {renderBgImage()}
            {!slide.imageUrl && !slide.bgImageUrl && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.25 }}>
                <ImagePlus style={{ color: slide.textColor, width: 80 * fontScale, height: 80 * fontScale }} />
              </div>
            )}
            <div className="absolute inset-0 flex flex-col" style={{ padding: padPx, textAlign: slide.align, justifyContent: slide.verticalAlign === "top" ? "flex-start" : slide.verticalAlign === "bottom" ? "flex-end" : "flex-end" }}>
              <div className="mb-2 font-bold uppercase tracking-widest" style={counterStyle}>
                {slideIndex + 1} / {totalSlides}
              </div>
              {renderTitle({ marginBottom: 8 * fontScale }, "mb-2")}
              {renderBody({ opacity: 0.85 })}
            </div>
            <div className="absolute bottom-0 left-0 right-0" style={{ height: 4 * fontScale, backgroundColor: slide.accentColor }} />
          </>
        )}

        {/* =========== EDITORIAL LAYOUT =========== */}
        {layout === "editorial" && (
          <>
            <div className="absolute inset-0 flex">
              <div className="flex-1 flex flex-col justify-center" style={{ padding: padPx, textAlign: slide.align }}>
                <div className="mb-2 font-bold uppercase tracking-widest" style={counterStyle}>
                  {slideIndex + 1} / {totalSlides}
                </div>
                {renderTitle({ marginBottom: 12 * fontScale }, "mb-3")}
                {renderBody({ opacity: 0.85 })}
              </div>
              <div className="w-[45%] relative">
                {slide.imageUrl ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <img 
                      src={slide.imageUrl} 
                      alt="" 
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

        {/* =========== PROFILE-POST LAYOUT =========== */}
        {layout === "profile-post" && (
          <>
            <div className="absolute inset-0 flex flex-col" style={{ padding: padPx }}>
              <div className="flex items-center gap-3 mb-4" style={{ gap: 12 * fontScale }}>
                {slide.profileImageUrl ? (
                  <img src={slide.profileImageUrl} alt="" className="rounded-full object-cover" style={{ width: 50 * fontScale, height: 50 * fontScale }} />
                ) : (
                  <div className="rounded-full flex items-center justify-center" style={{ width: 50 * fontScale, height: 50 * fontScale, background: slide.accentColor }}>
                    <span className="text-white font-bold" style={{ fontSize: 16 * fontScale }}>{(slide.profileName || "U")[0].toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold" style={{ color: slide.textColor, fontSize: 16 * fontScale }}>{slide.profileName || "Seu Nome"}</span>
                  </div>
                  <span style={{ color: slide.textColor, opacity: 0.6, fontSize: 13 * fontScale }}>{slide.profileHandle || "@seuhandle"}</span>
                </div>
              </div>
              <div className="w-full mb-4" style={{ height: 1, background: slide.textColor, opacity: 0.1 }} />
              <div className="mb-2 font-bold uppercase tracking-widest" style={counterStyle}>
                {slideIndex + 1} / {totalSlides}
              </div>
              {renderTitle({ marginBottom: 12 * fontScale }, "mb-3")}
              {renderBody({ opacity: 0.85 }, "whitespace-pre-wrap flex-1")}
            </div>
            <div className="absolute bottom-0 left-0 right-0" style={{ height: 4 * fontScale, backgroundColor: slide.accentColor }} />
          </>
        )}

        {/* =========== PHOTO-GRID LAYOUT =========== */}
        {layout === "photo-grid" && (() => {
          const images = slide.imageUrls || [];
          return (
            <>
              <div className="absolute inset-0 flex flex-col" style={{ padding: padPx }}>
                <div className="flex items-center mb-3" style={{ gap: 12 * fontScale }}>
                  {slide.profileImageUrl ? (
                    <img src={slide.profileImageUrl} alt="" className="rounded-full object-cover" style={{ width: 45 * fontScale, height: 45 * fontScale }} />
                  ) : (
                    <div className="rounded-full flex items-center justify-center" style={{ width: 45 * fontScale, height: 45 * fontScale, background: slide.accentColor }}>
                      <span className="text-white font-bold" style={{ fontSize: 14 * fontScale }}>{(slide.profileName || "U")[0].toUpperCase()}</span>
                    </div>
                  )}
                  <span className="font-bold" style={{ color: slide.textColor, fontSize: 16 * fontScale }}>{slide.profileName || "Seu Nome"}</span>
                </div>
                {renderTitle({ marginBottom: 8 * fontScale }, "mb-2")}
                {renderBody({ opacity: 0.8, marginBottom: 12 * fontScale }, "whitespace-pre-wrap mb-3")}
                <div className="flex-1 grid grid-cols-2 gap-2 min-h-0" style={{ gap: 8 * fontScale }}>
                  {images.length > 0 ? (
                    images.slice(0, 4).map((url, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.05)" }}>
                        <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    ))
                  ) : (
                    [0, 1].map((i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden flex items-center justify-center" style={{ background: "rgba(0,0,0,0.04)" }}>
                        <ImagePlus style={{ color: slide.accentColor, opacity: 0.3, width: 40 * fontScale, height: 40 * fontScale }} />
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0" style={{ height: 4 * fontScale, backgroundColor: slide.accentColor }} />
            </>
          );
        })()}

        {/* =========== SALES-HIGHLIGHT LAYOUT =========== */}
        {layout === "sales-highlight" && (() => {
          const hlColor = slide.highlightBgColor || "#22C55E";
          return (
            <>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ padding: padPx, textAlign: "center", gap: 20 * fontScale }}>
                <div className="font-bold uppercase tracking-widest" style={{ color: slide.textColor, opacity: 0.6, fontSize: 14 * fontScale }}>
                  {slideIndex + 1} / {totalSlides}
                </div>
                <div className="rounded-lg" style={{ backgroundColor: hlColor, padding: `${16 * fontScale}px ${30 * fontScale}px` }}>
                  <h2 style={{ ...titleStyle, color: "#FFFFFF" }}>{slide.title}</h2>
                </div>
                <div className="rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: `${16 * fontScale}px ${30 * fontScale}px` }}>
                  <p className="whitespace-pre-wrap font-medium" style={{ ...bodyStyle, opacity: 1 }}>{slide.body}</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0" style={{ height: 4 * fontScale, backgroundColor: hlColor }} />
            </>
          );
        })()}

        {/* =========== TWEET-POST LAYOUT =========== */}
        {layout === "tweet-post" && (() => {
          const images = slide.imageUrls || [];
          return (
            <>
              <div className="absolute" style={{ top: 0, left: 0, right: 0, height: '44%', background: '#ffffff' }}>
                <div className="flex items-center" style={{ padding: `${20 * fontScale}px ${24 * fontScale}px`, gap: 12 * fontScale }}>
                  {slide.profileImageUrl ? (
                    <img src={slide.profileImageUrl} alt="" className="rounded-full object-cover" style={{ width: 48 * fontScale, height: 48 * fontScale }} />
                  ) : (
                    <div className="rounded-full flex items-center justify-center" style={{ width: 48 * fontScale, height: 48 * fontScale, background: '#ddd' }}>
                      <span className="font-bold" style={{ fontSize: 16 * fontScale, color: '#666' }}>{(slide.profileName || "U")[0].toUpperCase()}</span>
                    </div>
                  )}
                  <div>
                    <div className="font-bold" style={{ color: '#000', fontSize: 16 * fontScale }}>{slide.profileName || "Seu Nome Aqui"}</div>
                    <div style={{ color: '#666', fontSize: 13 * fontScale }}>{slide.profileHandle || "@seunomeaqui"}</div>
                  </div>
                </div>
                <p className="whitespace-pre-wrap" style={{ padding: `0 ${24 * fontScale}px`, color: '#000', fontSize: 14 * fontScale, fontFamily: slide.fontFamily, lineHeight: 1.35, fontWeight: 500 }}>
                  {slide.body || "Aquele momento em que você percebe que a consistência é o verdadeiro segredo do sucesso. 🚀✨"}
                </p>
              </div>
              <div className="absolute flex" style={{ bottom: 10 * fontScale, left: 10 * fontScale, right: 10 * fontScale, height: '52%', gap: 8 * fontScale }}>
                {images.length >= 3 ? (
                  <>
                    <div className="flex-1 overflow-hidden relative" style={{ borderRadius: 12 * fontScale }}>
                      <img src={images[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col flex-1" style={{ gap: 8 * fontScale }}>
                      <div className="flex-1 overflow-hidden relative" style={{ borderRadius: 12 * fontScale }}>
                        <img src={images[1]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 overflow-hidden relative" style={{ borderRadius: 12 * fontScale }}>
                        <img src={images[2]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    </div>
                  </>
                ) : images.length >= 2 ? (
                  <>
                    <div className="flex-1 overflow-hidden relative" style={{ borderRadius: 12 * fontScale }}>
                      <img src={images[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 overflow-hidden relative" style={{ borderRadius: 12 * fontScale }}>
                      <img src={images[1]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 overflow-hidden flex items-center justify-center" style={{ borderRadius: 12 * fontScale, background: 'rgba(0,0,0,0.04)', border: '2px dashed rgba(0,0,0,0.15)' }}>
                      <ImagePlus style={{ color: '#aaa', width: 40 * fontScale, height: 40 * fontScale }} />
                    </div>
                    <div className="flex-1 overflow-hidden flex items-center justify-center" style={{ borderRadius: 12 * fontScale, background: 'rgba(0,0,0,0.04)', border: '2px dashed rgba(0,0,0,0.15)' }}>
                      <ImagePlus style={{ color: '#aaa', width: 40 * fontScale, height: 40 * fontScale }} />
                    </div>
                  </>
                )}
              </div>
            </>
          );
        })()}

        {/* =========== PROMPT-CARD LAYOUT =========== */}
        {layout === "prompt-card" && (
          <>
            <div className="absolute inset-0 flex flex-col" style={{ padding: padPx }}>
              <div className="flex items-center mb-4" style={{ gap: 12 * fontScale }}>
                {slide.profileImageUrl ? (
                  <img src={slide.profileImageUrl} alt="" className="rounded-full object-cover" style={{ width: 50 * fontScale, height: 50 * fontScale }} />
                ) : (
                  <div className="rounded-full flex items-center justify-center" style={{ width: 50 * fontScale, height: 50 * fontScale, background: '#ddd' }}>
                    <span className="font-bold" style={{ fontSize: 16 * fontScale, color: '#666' }}>{(slide.profileName || "U")[0].toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <div className="font-bold" style={{ color: '#000', fontSize: 20 * fontScale }}>{slide.profileHandle || "@seunomeaqui"}</div>
                  <div style={{ color: '#555', fontSize: 11 * fontScale }}>{slide.profileName || "Seu Nome"} - Especialista no seu Nicho</div>
                </div>
              </div>
              <div className="font-bold mb-3" style={{ color: '#000', fontSize: 18 * fontScale }}>
                <span style={{ color: slide.accentColor }}>📌</span> {slide.title || "PROMPT – Parte 1"}
              </div>
              <div className="flex-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', padding: `${16 * fontScale}px` }}>
                <p className="whitespace-pre-wrap" style={{ ...bodyStyle, fontStyle: 'italic', color: '#000', opacity: 0.85 }}>
                  {slide.body || '"Atue como uma consultora especialista..."'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* =========== STICKER-CARD LAYOUT =========== */}
        {layout === "sticker-card" && (() => {
          const stickerBg = slide.highlightBgColor || "rgba(92,61,46,.94)";
          return (
            <>
              <div className="absolute" style={{ top: 16 * fontScale, left: 20 * fontScale, right: 20 * fontScale }}>
                <div className="font-normal" style={{ color: 'rgba(255,255,255,.8)', fontSize: 11 * fontScale, fontFamily: "'DM Sans', sans-serif" }}>
                  {slide.profileHandle || "@SeuNomeAqui"} | {slide.profileName || "Seu nicho"}
                </div>
              </div>
              <div className="absolute rounded" style={{
                top: '18%', right: '6%', width: '56%', padding: `${18 * fontScale}px ${22 * fontScale}px`,
                background: stickerBg, borderRadius: 4 * fontScale, border: `1.5px dashed rgba(255,255,255,.38)`,
                transform: 'rotate(2.5deg)',
              }}>
                <h2 className="whitespace-pre-wrap" style={{ ...titleStyle, fontSize: slide.titleSize * fontScale * 0.85, lineHeight: 1.25 }}>{slide.title || "Dica importante\npara o seu\npúblico alvo"}</h2>
              </div>
              <div className="absolute rounded" style={{
                bottom: '14%', left: '4%', width: '52%', padding: `${18 * fontScale}px ${22 * fontScale}px`,
                background: stickerBg, borderRadius: 4 * fontScale, border: `1.5px dashed rgba(255,255,255,.38)`,
                transform: 'rotate(-2deg)',
              }}>
                <p className="whitespace-pre-wrap" style={{ ...bodyStyle, opacity: 1, fontSize: slide.bodySize * fontScale * 0.95, lineHeight: 1.25 }}>{slide.body || "Outro ponto\nde atenção\naqui"}</p>
              </div>
            </>
          );
        })()}

        {/* ===== JOURNAL SCALE / SAFE-AREA (Stories 9:16) ===== */}
        {/* Computed once per render and reused inside every journal-* block via the variables below */}
        {/* (no JSX output) */}
        {(() => { return null; })()}

        {/* =========== JOURNAL-NOTE LAYOUT (modelo_6) =========== */}
        {layout === "journal-note" && (() => {
          const j = getJournalScale(aspectRatio, slide.title.length, slide.body.length);
          const safePadY = spec.height * j.safeAreaFrac;
          const titleSizePx = slide.titleSize * fontScale * j.titleMul;
          const bodySizePx = slide.bodySize * fontScale * j.bodyMul;
          const hScale = slide.highlightScale ?? 1;
          const hOffsetY = ((slide.highlightOffsetY ?? 0) / 100) * spec.height;
          const noteW = spec.width * 0.72;
          const noteH = spec.height * 0.50;
          const cardW = spec.width * 0.62 * hScale;
          const cardPadV = 20 * fontScale * j.bodyMul * hScale;
          const cardPadH = 28 * fontScale * j.bodyMul * hScale;
          const titleColor = slide.titleColor ?? slide.accentColor;
          const cardBg = slide.highlightBgColor ?? slide.accentColor;
          const cardTextColor = slide.bodyColor ?? "#fefdf8";
          return (
            <>
              <div className="absolute inset-0" style={{ backgroundImage: PAPER_TEXTURES.linen, backgroundColor: slide.bgColor }} />
              <div className="absolute top-0 left-0 right-0 flex justify-between" style={{ padding: `${24 * fontScale}px ${36 * fontScale}px`, fontSize: 12 * fontScale, color: slide.textColor, opacity: 0.55, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                <span>· · · {slideIndex + 1} / {totalSlides} · · ·</span>
                <span>· · · {slide.profileHandle || "@suamarca"} · · ·</span>
              </div>
              <div className="absolute" style={{
                left: `${(spec.width - noteW) / 2}px`, top: `${Math.max(spec.height * 0.18, safePadY + 30 * fontScale)}px`,
                width: noteW, height: noteH,
                background: "#fefdf8",
                backgroundImage: PAPER_TEXTURES.grid,
                borderLeft: `${10 * fontScale}px solid ${slide.accentColor}`,
                boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
                transform: "rotate(-1.2deg)",
                padding: `${30 * fontScale}px`,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", boxSizing: "border-box",
              }}>
                <h2 style={{ ...titleStyle, fontSize: titleSizePx, fontStyle: "italic", textAlign: "center", color: titleColor }}>{slide.title}</h2>
              </div>
              <div className="absolute" style={{ left: `${spec.width * 0.5 - 35 * fontScale}px`, top: `${Math.max(spec.height * 0.15, safePadY)}px`, transform: "rotate(-8deg)" }}>
                <GoldStamp size={70 * fontScale} />
              </div>
              <div className="absolute" style={{
                left: `${(spec.width - cardW) / 2}px`,
                bottom: `${Math.max(spec.height * 0.06, safePadY) - hOffsetY}px`,
                width: cardW,
                maxWidth: spec.width * 0.88,
                maxHeight: spec.height * 0.32,
                overflow: "hidden",
                boxSizing: "border-box",
                background: cardBg,
                color: cardTextColor,
                padding: `${cardPadV}px ${cardPadH}px`,
                transform: "rotate(1.5deg)",
                boxShadow: "0 6px 14px rgba(0,0,0,0.20)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: bodySizePx,
                lineHeight: 1.45,
                textAlign: "center",
              }}>
                {slide.body}
              </div>
            </>
          );
        })()}

        {/* =========== JOURNAL-TAPE LAYOUT (modelo_7 sup) =========== */}
        {layout === "journal-tape" && (() => {
          const j = getJournalScale(aspectRatio, slide.title.length, slide.body.length);
          const safePadY = spec.height * j.safeAreaFrac;
          const titleSizePx = slide.titleSize * fontScale * j.titleMul;
          const bodySizePx = slide.bodySize * fontScale * j.bodyMul;
          const hScale = slide.highlightScale ?? 1;
          const hOffsetY = ((slide.highlightOffsetY ?? 0) / 100) * spec.height;
          const noteW = spec.width * 0.62;
          const noteH = spec.height * 0.55;
          const noteX = spec.width * 0.08;
          const noteY = spec.height * 0.12;
          const cardW = spec.width * 0.42 * hScale;
          const cardPadV = 18 * fontScale * j.bodyMul * hScale;
          const cardPadH = 22 * fontScale * j.bodyMul * hScale;
          const titleColor = slide.titleColor ?? slide.bgColor;
          const cardBg = slide.highlightBgColor ?? "#fefdf8";
          const cardTextColor = slide.bodyColor ?? slide.bgColor;
          return (
            <>
              <div className="absolute inset-0" style={{ background: slide.bgColor, backgroundImage: PAPER_TEXTURES.kraft }} />
              <div className="absolute top-0 left-0 right-0 flex justify-between" style={{ padding: `${22 * fontScale}px ${32 * fontScale}px`, fontSize: 11 * fontScale, color: slide.accentColor, opacity: 0.7, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.25em", textTransform: "uppercase" }}>
                <span>{slide.profileHandle || "@suamarca"}</span>
                <span>{slideIndex + 1} / {totalSlides}</span>
              </div>
              <div className="absolute" style={{
                left: noteX, top: noteY, width: noteW, height: noteH,
                background: "#fefdf8",
                backgroundImage: PAPER_TEXTURES.grid,
                transform: "rotate(-3deg)",
                boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
                padding: `${36 * fontScale}px ${30 * fontScale}px`,
                display: "flex", alignItems: "center",
                overflow: "hidden", boxSizing: "border-box",
              }}>
                <h2 style={{ ...titleStyle, fontSize: titleSizePx, fontStyle: "italic", color: titleColor, textAlign: "left" }}>{slide.title}</h2>
              </div>
              <WashiTape width={120 * fontScale} height={28 * fontScale} color="#e8d9b8" rotate={-15} style={{ left: noteX - 20 * fontScale, top: noteY - 8 * fontScale }} />
              <WashiTape width={100 * fontScale} height={26 * fontScale} color="#e8d9b8" rotate={20} style={{ left: noteX + noteW - 60 * fontScale, top: noteY - 6 * fontScale }} />
              <div className="absolute" style={{
                right: spec.width * 0.06,
                bottom: Math.max(spec.height * 0.06, safePadY) - hOffsetY,
                width: cardW,
                maxWidth: spec.width * 0.6,
                maxHeight: spec.height * 0.3,
                overflow: "hidden",
                boxSizing: "border-box",
                background: cardBg,
                backgroundImage: PAPER_TEXTURES.grid,
                color: cardTextColor,
                padding: `${cardPadV}px ${cardPadH}px`,
                transform: "rotate(2.5deg)",
                boxShadow: "0 6px 14px rgba(0,0,0,0.20)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: bodySizePx * 0.85,
                lineHeight: 1.4,
              }}>
                {slide.body}
              </div>
              <HandDrawnArrow width={90 * fontScale} color={slide.accentColor} rotate={25} style={{ right: spec.width * 0.32, top: spec.height * 0.50 }} />
            </>
          );
        })()}

        {/* =========== JOURNAL-PHOTO-CARD LAYOUT (modelo_7 mid + modelo1) =========== */}
        {layout === "journal-photo-card" && (() => {
          const j = getJournalScale(aspectRatio, slide.title.length, slide.body.length);
          const safePadY = spec.height * j.safeAreaFrac;
          const titleSizePx = slide.titleSize * fontScale * j.titleMul;
          const bodySizePx = slide.bodySize * fontScale * j.bodyMul;
          const hScale = slide.highlightScale ?? 1;
          const hOffsetY = ((slide.highlightOffsetY ?? 0) / 100) * spec.height;
          const cardW = spec.width * 0.58 * hScale;
          const miniW = spec.width * 0.42 * hScale;
          const miniPadV = 18 * fontScale * j.bodyMul * hScale;
          const miniPadH = 22 * fontScale * j.bodyMul * hScale;
          const titleCardPadV = 28 * fontScale * j.bodyMul * hScale;
          const titleCardPadH = 32 * fontScale * j.bodyMul * hScale;
          const photoUrl = slide.imageUrl || slide.bgImageUrl;
          const titleColor = slide.titleColor ?? "#fefdf8";
          const titleCardBg = slide.highlightBgColor ?? slide.accentColor;
          const miniTextColor = slide.bodyColor ?? "#3a1a12";
          return (
            <>
              {photoUrl ? (
                <div className="absolute inset-0 overflow-hidden">
                  <img 
                    src={photoUrl} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover" 
                    style={buildImageStyle({ positionX: slide.imagePositionX, positionY: slide.imagePositionY, scale: slide.imageScale, blur: slide.imageBlur, brightness: slide.imageBrightness, contrast: slide.imageContrast })} 
                  />
                </div>
              ) : (
                <>
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${slide.bgColor} 0%, rgba(0,0,0,0.55) 100%)` }} />
                  <div className="absolute inset-0" style={{ backgroundImage: PAPER_TEXTURES.linen, opacity: 0.35 }} />
                  <div className="absolute" style={{ left: 28 * fontScale, bottom: 28 * fontScale, opacity: 0.35 }}>
                    <ImagePlus style={{ color: "#fefdf8", width: 44 * fontScale, height: 44 * fontScale }} />
                  </div>
                  <div className="absolute" style={{ right: 24 * fontScale, top: 80 * fontScale, transform: "rotate(-10deg)", opacity: 0.85 }}>
                    <GoldStamp size={70 * fontScale} />
                  </div>
                </>
              )}
              <div className="absolute inset-0" style={{ background: photoUrl ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.05)" }} />
              <div className="absolute top-0 left-0 right-0 flex justify-between" style={{ padding: `${22 * fontScale}px ${32 * fontScale}px`, fontSize: 11 * fontScale, color: "#fefdf8", opacity: 0.85, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.25em", textTransform: "uppercase", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                <span>{slide.profileHandle || "@suamarca"}</span>
                <span>{slideIndex + 1} / {totalSlides}</span>
              </div>
              <div className="absolute" style={{
                left: `${(spec.width - cardW) / 2}px`, top: `${spec.height * 0.30}px`,
                width: cardW,
                maxWidth: spec.width * 0.85,
                maxHeight: spec.height * 0.35,
                overflow: "hidden",
                boxSizing: "border-box",
                background: titleCardBg,
                padding: `${titleCardPadV}px ${titleCardPadH}px`,
                boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
              }}>
                <h2 style={{ ...titleStyle, fontSize: titleSizePx, fontStyle: "italic", color: titleColor, textAlign: "center" }}>{slide.title}</h2>
              </div>
              <div className="absolute" style={{
                right: spec.width * 0.06,
                bottom: Math.max(spec.height * 0.05, safePadY) - hOffsetY,
                width: miniW,
                maxWidth: spec.width * 0.6,
                maxHeight: spec.height * 0.3,
                overflow: "hidden",
                boxSizing: "border-box",
                background: "#fefdf8",
                backgroundImage: PAPER_TEXTURES.grid,
                color: miniTextColor,
                padding: `${miniPadV}px ${miniPadH}px`,
                transform: "rotate(-2deg)",
                boxShadow: "0 6px 14px rgba(0,0,0,0.30)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: bodySizePx * 0.85,
                lineHeight: 1.4,
              }}>
                {slide.body}
              </div>
            </>
          );
        })()}

        {/* =========== JOURNAL-BINDER LAYOUT (modelo_2 + modelo_5) =========== */}
        {layout === "journal-binder" && (() => {
          const j = getJournalScale(aspectRatio, slide.title.length, slide.body.length);
          const safePadY = spec.height * j.safeAreaFrac;
          const titleSizePx = slide.titleSize * fontScale * j.titleMul;
          const bodySizePx = slide.bodySize * fontScale * j.bodyMul;
          const hScale = slide.highlightScale ?? 1;
          const noteW = spec.width * 0.78;
          const noteH = spec.height * 0.72;
          const noteX = (spec.width - noteW) / 2;
          const noteY = spec.height * 0.16;
          const cardW = noteW * 0.78 * hScale;
          const cardPadV = 18 * fontScale * j.bodyMul * hScale;
          const cardPadH = 24 * fontScale * j.bodyMul * hScale;
          const titleColor = slide.titleColor ?? slide.accentColor;
          const cardBg = slide.highlightBgColor ?? slide.accentColor;
          const cardTextColor = slide.bodyColor ?? "#fefdf8";
          return (
            <>
              <div className="absolute inset-0" style={{ background: slide.bgColor, backgroundImage: PAPER_TEXTURES.kraft }} />
              <div className="absolute top-0 left-0 right-0 flex justify-between" style={{ padding: `${20 * fontScale}px ${32 * fontScale}px`, fontSize: 11 * fontScale, color: "#fefdf8", opacity: 0.7, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.25em", textTransform: "uppercase" }}>
                <span>{slide.profileHandle || "@suamarca"}</span>
                <span>{slideIndex + 1} / {totalSlides}</span>
              </div>
              <div className="absolute" style={{
                left: noteX, top: noteY, width: noteW, height: noteH,
                background: "#fefdf8",
                backgroundImage: PAPER_TEXTURES.notebook,
                boxShadow: "0 12px 28px rgba(0,0,0,0.30)",
                padding: `${60 * fontScale}px ${40 * fontScale}px ${30 * fontScale}px`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between",
                overflow: "hidden", boxSizing: "border-box",
              }}>
                <h2 style={{ ...titleStyle, fontSize: titleSizePx, fontStyle: "italic", color: titleColor, textAlign: "center", marginTop: 20 * fontScale }}>{slide.title}</h2>
                <div style={{
                  width: cardW,
                  maxWidth: noteW * 0.92,
                  maxHeight: noteH * 0.45,
                  overflow: "hidden",
                  boxSizing: "border-box",
                  background: cardBg,
                  color: cardTextColor,
                  padding: `${cardPadV}px ${cardPadH}px`,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: bodySizePx,
                  lineHeight: 1.45,
                  textAlign: "center",
                }}>
                  {slide.body}
                </div>
              </div>
              <div className="absolute" style={{ left: noteX, top: noteY - 22 * fontScale, width: noteW }}>
                <SpiralBinder width={noteW} rings={Math.max(7, Math.floor(noteW / (90 * fontScale)))} />
              </div>
            </>
          );
        })()}

        {/* =========== JOURNAL-TORN-PAPER LAYOUT (modelo_3) =========== */}
        {layout === "journal-torn-paper" && (() => {
          const j = getJournalScale(aspectRatio, slide.title.length, slide.body.length);
          const safePadY = spec.height * j.safeAreaFrac;
          const titleSizePx = slide.titleSize * fontScale * j.titleMul;
          const bodySizePx = slide.bodySize * fontScale * j.bodyMul;
          const paperW = spec.width * 0.78;
          const paperH = spec.height * 0.62;
          const photoUrl = slide.bgImageUrl || slide.imageUrl;
          const titleColor = slide.titleColor ?? slide.textColor;
          const bodyTextColor = slide.bodyColor ?? slide.textColor;
          return (
            <>
              {photoUrl ? (
                <div className="absolute inset-0 overflow-hidden">
                  <img 
                    src={photoUrl} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover" 
                    style={buildImageStyle({ positionX: slide.bgImagePositionX ?? slide.imagePositionX, positionY: slide.bgImagePositionY ?? slide.imagePositionY, scale: slide.bgImageScale ?? slide.imageScale, blur: slide.bgImageBlur ?? slide.imageBlur, brightness: slide.bgImageBrightness ?? slide.imageBrightness, contrast: slide.bgImageContrast ?? slide.imageContrast })} 
                  />
                </div>
              ) : (
                <>
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${slide.bgColor} 0%, rgba(0,0,0,0.65) 100%)` }} />
                  <div className="absolute inset-0" style={{ backgroundImage: PAPER_TEXTURES.kraft, opacity: 0.5 }} />
                  <div className="absolute" style={{ right: 30 * fontScale, bottom: 30 * fontScale, opacity: 0.3 }}>
                    <ImagePlus style={{ color: "#fefdf8", width: 56 * fontScale, height: 56 * fontScale }} />
                  </div>
                </>
              )}
              <div className="absolute inset-0" style={{ background: photoUrl ? "rgba(0,0,0,0.20)" : "rgba(0,0,0,0.10)" }} />
              <div className="absolute top-0 left-0 right-0 flex justify-between" style={{ padding: `${22 * fontScale}px ${32 * fontScale}px`, fontSize: 11 * fontScale, color: "#fefdf8", opacity: 0.85, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.25em", textTransform: "uppercase", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                <span>{slide.profileHandle || "@suamarca"}</span>
                <span>{slideIndex + 1} / {totalSlides}</span>
              </div>
              <div className="absolute" style={{ left: (spec.width - paperW) / 2, top: (spec.height - paperH) / 2 + 20 * fontScale }}>
                <TornPaperPath width={paperW} height={paperH} fill="#fefdf8" rotate={-1.5}>
                  <h2 style={{ ...titleStyle, fontSize: titleSizePx, fontStyle: "italic", color: titleColor, textAlign: "center", marginBottom: 16 * fontScale }}>{slide.title}</h2>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: bodySizePx * 0.95,
                    color: bodyTextColor,
                    opacity: 0.8,
                    textAlign: "center",
                    lineHeight: 1.5,
                  }}>{slide.body}</p>
                </TornPaperPath>
              </div>
            </>
          );
        })()}

        {/* =========== JOURNAL-ENVELOPE LAYOUT (modelo_5) =========== */}
        {layout === "journal-envelope" && (() => {
          const j = getJournalScale(aspectRatio, slide.title.length, slide.body.length);
          const safePadY = spec.height * j.safeAreaFrac;
          const titleSizePx = slide.titleSize * fontScale * j.titleMul;
          const bodySizePx = slide.bodySize * fontScale * j.bodyMul;
          const hScale = slide.highlightScale ?? 1;
          const hOffsetY = ((slide.highlightOffsetY ?? 0) / 100) * spec.height;
          const envW = spec.width * 0.66;
          const envH = envW * 0.7;
          const envX = (spec.width - envW) / 2;
          const envY = spec.height * 0.18;
          const cardPadV = 16 * fontScale * j.bodyMul * hScale;
          const cardPadH = 36 * fontScale * j.bodyMul * hScale;
          const titleColor = slide.titleColor ?? "#fefdf8";
          const cardBg = slide.highlightBgColor ?? slide.accentColor;
          const cardTextColor = slide.bodyColor ?? "#fefdf8";
          return (
            <>
              <div className="absolute inset-0" style={{ background: slide.bgColor, backgroundImage: PAPER_TEXTURES.kraft }} />
              <div className="absolute top-0 left-0 right-0 flex justify-between" style={{ padding: `${22 * fontScale}px ${32 * fontScale}px`, fontSize: 11 * fontScale, color: "#fefdf8", opacity: 0.7, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.25em", textTransform: "uppercase" }}>
                <span>{slide.profileHandle || "@suamarca"}</span>
                <span>{slideIndex + 1} / {totalSlides}</span>
              </div>
              <div className="absolute" style={{ left: envX, top: envY, width: envW, height: envH }}>
                <EnvelopeShape width={envW} height={envH} color="#f0e0c8" flapColor="#d8c3a0" />
              </div>
              <div className="absolute" style={{ left: envX + envW / 2 - 45 * fontScale, top: envY + envH * 0.42 }}>
                <WaxSeal size={90 * fontScale} color={slide.accentColor} />
              </div>
              <div className="absolute" style={{ left: spec.width * 0.10, top: envY + envH + 20 * fontScale, right: spec.width * 0.10, textAlign: "center" }}>
                <h2 style={{ ...titleStyle, fontSize: titleSizePx, fontStyle: "italic", color: titleColor }}>{slide.title}</h2>
              </div>
              <div className="absolute" style={{
                bottom: Math.max(spec.height * 0.05, safePadY) - hOffsetY,
                left: spec.width * 0.08, right: spec.width * 0.08,
                maxHeight: spec.height * 0.28,
                overflow: "hidden",
                boxSizing: "border-box",
                background: cardBg,
                color: cardTextColor,
                padding: `${cardPadV}px ${cardPadH}px`,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: bodySizePx * 0.9,
                lineHeight: 1.4,
                textAlign: "center",
                boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
              }}>
                {slide.body}
              </div>
            </>
          );
        })()}

        {/* =========== TEXT-ONLY (DEFAULT) LAYOUT =========== */}
        {layout === "text-only" && (
          <>
            {slide.accentColor === "#F59E0B" && (
              <div className="absolute select-none pointer-events-none" style={{ top: 30 * fontScale, left: 40 * fontScale, color: slide.accentColor, opacity: 0.3, fontSize: 120 * fontScale, fontFamily: "serif", lineHeight: 1 }}>
                &ldquo;
              </div>
            )}
            {slide.accentColor === "#FBBF24" && slide.bgColor === "#1E3A5F" && (
              <div className="absolute select-none pointer-events-none" style={{ top: 30 * fontScale, right: 40 * fontScale, color: slide.accentColor, opacity: 0.18 }}>
                <svg width={72 * fontScale} height={72 * fontScale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            )}
            {slide.accentColor === "#34D399" && (
              <div className="absolute select-none pointer-events-none" style={{ top: 30 * fontScale, right: 40 * fontScale, color: slide.accentColor, opacity: 0.2 }}>
                <svg width={72 * fontScale} height={72 * fontScale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </div>
            )}

            <div className="absolute inset-0 flex flex-col pointer-events-none" style={{ padding: padPx, textAlign: slide.align, justifyContent: slide.verticalAlign === "top" ? "flex-start" : slide.verticalAlign === "bottom" ? "flex-end" : "center" }}>
              <div className="mb-4 font-bold uppercase tracking-widest" style={counterStyle}>
                {slideIndex + 1} / {totalSlides}
              </div>
              
              {isFreeEditMode ? (
                <Rnd
                  className="pointer-events-auto"
                  position={slide.titlePos ? { x: slide.titlePos.x * spec.width, y: slide.titlePos.y * spec.height } : undefined}
                  size={slide.titlePos?.width ? { width: slide.titlePos.width * spec.width, height: slide.titlePos.height * spec.height } : undefined}
                  onDragStop={(e, d) => onUpdate?.({ titlePos: { ...slide.titlePos, x: d.x / spec.width, y: d.y / spec.height } })}
                  onResizeStop={(e, dir, ref, delta, pos) => onUpdate?.({ titlePos: { ...slide.titlePos, x: pos.x / spec.width, y: pos.y / spec.height, width: ref.offsetWidth / spec.width, height: ref.offsetHeight / spec.height } })}
                  bounds="parent"
                  enableResizing={isFreeEditMode}
                  disableDragging={!isFreeEditMode}
                >
                  <h2 style={{ ...titleStyle, margin: 0 }}>{slide.title}</h2>
                </Rnd>
              ) : (
                <h2 className="mb-4" style={{ ...titleStyle, ...(slide.titlePos ? { position: 'absolute', left: `${slide.titlePos.x * 100}%`, top: `${slide.titlePos.y * 100}%`, width: slide.titlePos.width ? `${slide.titlePos.width * 100}%` : undefined } : {}) }}>{slide.title}</h2>
              )}

              {isFreeEditMode ? (
                <Rnd
                  className="pointer-events-auto"
                  position={slide.bodyPos ? { x: slide.bodyPos.x * spec.width, y: slide.bodyPos.y * spec.height } : undefined}
                  size={slide.bodyPos?.width ? { width: slide.bodyPos.width * spec.width, height: slide.bodyPos.height * spec.height } : undefined}
                  onDragStop={(e, d) => onUpdate?.({ bodyPos: { ...slide.bodyPos, x: d.x / spec.width, y: d.y / spec.height } })}
                  onResizeStop={(e, dir, ref, delta, pos) => onUpdate?.({ bodyPos: { ...slide.bodyPos, x: pos.x / spec.width, y: pos.y / spec.height, width: ref.offsetWidth / spec.width, height: ref.offsetHeight / spec.height } })}
                  bounds="parent"
                  enableResizing={isFreeEditMode}
                  disableDragging={!isFreeEditMode}
                >
                  <p className="whitespace-pre-wrap" style={{ ...bodyStyle, margin: 0 }}>{slide.body}</p>
                </Rnd>
              ) : (
                <p className="whitespace-pre-wrap" style={{ ...bodyStyle, opacity: 0.9, ...(slide.bodyPos ? { position: 'absolute', left: `${slide.bodyPos.x * 100}%`, top: `${slide.bodyPos.y * 100}%`, width: slide.bodyPos.width ? `${slide.bodyPos.width * 100}%` : undefined } : {}) }}>{slide.body}</p>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0" style={{ height: 4 * fontScale, backgroundColor: slide.accentColor }} />
          </>
        )}
        {/* =========== CUSTOM LAYERS =========== */}
        {slide.layers?.map((layer) => (
          <Rnd
            key={layer.id}
            position={{ x: layer.x * spec.width, y: layer.y * spec.height }}
            size={{ width: layer.width * spec.width, height: layer.height * spec.height }}
            onDragStop={(e, d) => {
              if (!isFreeEditMode) return;
              const newLayers = slide.layers?.map(l => l.id === layer.id ? { ...l, x: d.x / spec.width, y: d.y / spec.height } : l);
              onUpdate?.({ layers: newLayers });
            }}
            onResizeStop={(e, dir, ref, delta, pos) => {
              if (!isFreeEditMode) return;
              const newLayers = slide.layers?.map(l => l.id === layer.id ? { 
                ...l, 
                x: pos.x / spec.width, 
                y: pos.y / spec.height, 
                width: ref.offsetWidth / spec.width, 
                height: ref.offsetHeight / spec.height 
              } : l);
              onUpdate?.({ layers: newLayers });
            }}
            bounds="parent"
            enableResizing={isFreeEditMode}
            disableDragging={!isFreeEditMode}
            className={isFreeEditMode ? "z-10" : "pointer-events-none"}
          >
            <div className="w-full h-full flex items-center justify-center relative group">
              {layer.type === "text" && (
                <div style={{ ...bodyStyle, margin: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...layer.style }}>
                  {layer.content}
                </div>
              )}
              {layer.type === "shape" && (
                <div style={{ width: '100%', height: '100%', backgroundColor: slide.accentColor, ...layer.style }} />
              )}
              {layer.type === "sticker" && (
                <div style={{ fontSize: layer.height * spec.height * 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {layer.content}
                </div>
              )}
              {isFreeEditMode && (
                <button 
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    const newLayers = slide.layers?.filter(l => l.id !== layer.id);
                    onUpdate?.({ layers: newLayers });
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </Rnd>
        ))}
      </div>
    );

    // For export: render at native resolution
    if (nativeSize) return slideContent;

    // For preview: scale down to fit container
    return (
      <div
        ref={containerRef}
        className="w-full relative"
        style={{
          maxWidth: aspectRatio === "9:16" ? 360 : aspectRatio === "16:9" ? 640 : 480,
          aspectRatio: `${spec.width} / ${spec.height}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: spec.width,
            height: spec.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
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

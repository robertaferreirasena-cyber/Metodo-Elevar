import { forwardRef, useRef, useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import type { SlideData } from "./CarouselTemplates";
import { FORMAT_SPECS, type AspectRatio } from "./CarouselTemplates";

interface SlidePreviewProps {
  slide: SlideData;
  slideIndex: number;
  totalSlides: number;
  aspectRatio: AspectRatio;
  /** When true, render at native resolution without scaling (for export) */
  nativeSize?: boolean;
}

const SlidePreview = forwardRef<HTMLDivElement, SlidePreviewProps>(
  ({ slide, slideIndex, totalSlides, aspectRatio, nativeSize }, ref) => {
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
    };

    const counterStyle: React.CSSProperties = {
      color: slide.accentColor,
      fontSize: `${14 * fontScale}px`,
    };

    const padSize = Math.round(40 * fontScale);
    const padClass = `p-[${padSize}px]`;
    // Use inline padding for exact control
    const padPx = `${padSize}px`;

    const renderBgImage = () => {
      const bgUrl = slide.bgImageUrl || (layout === "image-bg" ? slide.imageUrl : undefined);
      if (!bgUrl) return null;
      const opacity = slide.overlayOpacity ?? 0.55;
      return (
        <>
          <div className="absolute inset-0" style={{ background: `url(${bgUrl}) center/cover no-repeat` }} />
          <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${opacity})` }} />
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
            <div className="absolute inset-0 flex flex-col justify-end" style={{ padding: padPx, textAlign: slide.align }}>
              <div className="mb-2 font-bold uppercase tracking-widest" style={counterStyle}>
                {slideIndex + 1} / {totalSlides}
              </div>
              <h2 className="mb-3" style={titleStyle}>{slide.title}</h2>
              <p className="whitespace-pre-wrap" style={bodyStyle}>{slide.body}</p>
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
                <h2 className="mb-3" style={titleStyle}>{slide.title}</h2>
                <p className="whitespace-pre-wrap" style={{ ...bodyStyle, opacity: 0.85 }}>{slide.body}</p>
              </div>
              <div className="w-[45%] relative">
                {slide.imageUrl ? (
                  <div className="absolute inset-0" style={{ background: `url(${slide.imageUrl}) center/cover no-repeat` }} />
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
              <h2 className="mb-3" style={titleStyle}>{slide.title}</h2>
              <p className="whitespace-pre-wrap flex-1" style={{ ...bodyStyle, opacity: 0.85 }}>{slide.body}</p>
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
                <h2 className="mb-2" style={titleStyle}>{slide.title}</h2>
                <p className="whitespace-pre-wrap mb-3" style={{ ...bodyStyle, opacity: 0.8 }}>{slide.body}</p>
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

            <div className="absolute inset-0 flex flex-col justify-center" style={{ padding: padPx, textAlign: slide.align }}>
              <div className="mb-4 font-bold uppercase tracking-widest" style={counterStyle}>
                {slideIndex + 1} / {totalSlides}
              </div>
              <h2 className="mb-4" style={titleStyle}>{slide.title}</h2>
              <p className="whitespace-pre-wrap" style={bodyStyle}>{slide.body}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0" style={{ height: 4 * fontScale, backgroundColor: slide.accentColor }} />
          </>
        )}
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

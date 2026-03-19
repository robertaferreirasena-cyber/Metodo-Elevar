import { forwardRef } from "react";
import { ImagePlus } from "lucide-react";
import type { SlideData } from "./CarouselTemplates";

interface SlidePreviewProps {
  slide: SlideData;
  slideIndex: number;
  totalSlides: number;
  aspectRatio: "1:1" | "16:9";
}

const SlidePreview = forwardRef<HTMLDivElement, SlidePreviewProps>(
  ({ slide, slideIndex, totalSlides, aspectRatio }, ref) => {
    const isSquare = aspectRatio === "1:1";
    const layout = slide.layout || "text-only";

    const containerStyle: React.CSSProperties = {
      aspectRatio: isSquare ? "1 / 1" : "16 / 9",
      fontFamily: slide.fontFamily,
      width: "100%",
      maxWidth: isSquare ? 480 : 640,
    };

    // =========== IMAGE-BG LAYOUT ===========
    if (layout === "image-bg") {
      return (
        <div ref={ref} className="relative overflow-hidden" style={containerStyle}>
          {/* Background image or placeholder */}
          <div
            className="absolute inset-0"
            style={{
              background: slide.imageUrl
                ? `url(${slide.imageUrl}) center/cover no-repeat`
                : slide.bgGradient || slide.bgColor,
            }}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} />

          {/* Placeholder hint when no image */}
          {!slide.imageUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.25 }}>
              <ImagePlus className="h-16 w-16" style={{ color: slide.textColor }} />
            </div>
          )}

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10" style={{ textAlign: slide.align }}>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: slide.accentColor }}>
              {slideIndex + 1} / {totalSlides}
            </div>
            <h2 className="font-black leading-tight mb-3" style={{ color: slide.textColor, fontSize: `${slide.titleSize}px` }}>
              {slide.title}
            </h2>
            <p className="leading-relaxed whitespace-pre-wrap" style={{ color: slide.textColor, fontSize: `${slide.bodySize}px`, opacity: 0.9 }}>
              {slide.body}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: slide.accentColor }} />
        </div>
      );
    }

    // =========== EDITORIAL LAYOUT ===========
    if (layout === "editorial") {
      return (
        <div ref={ref} className="relative overflow-hidden" style={{ ...containerStyle, background: slide.bgColor }}>
          <div className="absolute inset-0 flex">
            {/* Text side */}
            <div className="flex-1 flex flex-col justify-center p-6 md:p-8" style={{ textAlign: slide.align }}>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: slide.accentColor }}>
                {slideIndex + 1} / {totalSlides}
              </div>
              <h2 className="font-black leading-tight mb-3" style={{ color: slide.textColor, fontSize: `${slide.titleSize}px` }}>
                {slide.title}
              </h2>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: slide.textColor, fontSize: `${slide.bodySize}px`, opacity: 0.85 }}>
                {slide.body}
              </p>
            </div>
            {/* Image side */}
            <div className="w-[45%] relative">
              {slide.imageUrl ? (
                <div className="absolute inset-0" style={{ background: `url(${slide.imageUrl}) center/cover no-repeat` }} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <ImagePlus className="h-12 w-12" style={{ color: slide.accentColor, opacity: 0.4 }} />
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: slide.accentColor }} />
        </div>
      );
    }

    // =========== PROFILE-POST LAYOUT ===========
    if (layout === "profile-post") {
      return (
        <div ref={ref} className="relative overflow-hidden" style={{ ...containerStyle, background: slide.bgColor }}>
          <div className="absolute inset-0 flex flex-col p-6 md:p-8">
            {/* Profile header */}
            <div className="flex items-center gap-3 mb-4">
              {slide.profileImageUrl ? (
                <img src={slide.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: slide.accentColor }}>
                  <span className="text-white text-sm font-bold">
                    {(slide.profileName || "U")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm" style={{ color: slide.textColor }}>
                    {slide.profileName || "Seu Nome"}
                  </span>
                  {/* Verified badge */}
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill={slide.accentColor}>
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-xs" style={{ color: slide.textColor, opacity: 0.6 }}>
                  {slide.profileHandle || "@seuhandle"}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px mb-4" style={{ background: slide.textColor, opacity: 0.1 }} />

            {/* Slide number */}
            <div className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: slide.accentColor }}>
              {slideIndex + 1} / {totalSlides}
            </div>

            {/* Title */}
            <h2 className="font-bold leading-tight mb-3" style={{ color: slide.textColor, fontSize: `${slide.titleSize}px` }}>
              {slide.title}
            </h2>

            {/* Body */}
            <p className="leading-relaxed whitespace-pre-wrap flex-1" style={{ color: slide.textColor, fontSize: `${slide.bodySize}px`, opacity: 0.85 }}>
              {slide.body}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: slide.accentColor }} />
        </div>
      );
    }

    // =========== PHOTO-GRID LAYOUT ===========
    if (layout === "photo-grid") {
      const images = slide.imageUrls || [];
      return (
        <div ref={ref} className="relative overflow-hidden" style={{ ...containerStyle, background: slide.bgColor }}>
          <div className="absolute inset-0 flex flex-col p-6 md:p-8">
            {/* Profile header */}
            <div className="flex items-center gap-3 mb-3">
              {slide.profileImageUrl ? (
                <img src={slide.profileImageUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: slide.accentColor }}>
                  <span className="text-white text-xs font-bold">
                    {(slide.profileName || "U")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <span className="font-bold text-sm" style={{ color: slide.textColor }}>
                  {slide.profileName || "Seu Nome"}
                </span>
              </div>
            </div>

            {/* Title + body */}
            <h2 className="font-bold leading-tight mb-2" style={{ color: slide.textColor, fontSize: `${slide.titleSize}px` }}>
              {slide.title}
            </h2>
            <p className="leading-relaxed whitespace-pre-wrap mb-3 text-sm" style={{ color: slide.textColor, fontSize: `${slide.bodySize}px`, opacity: 0.8 }}>
              {slide.body}
            </p>

            {/* Photo grid */}
            <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
              {images.length > 0 ? (
                images.slice(0, 4).map((url, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.05)" }}>
                    <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <>
                  {[0, 1].map((i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden flex items-center justify-center" style={{ background: "rgba(0,0,0,0.04)" }}>
                      <ImagePlus className="h-8 w-8" style={{ color: slide.accentColor, opacity: 0.3 }} />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: slide.accentColor }} />
        </div>
      );
    }

    // =========== SALES-HIGHLIGHT LAYOUT ===========
    if (layout === "sales-highlight") {
      const hlColor = slide.highlightBgColor || "#22C55E";
      return (
        <div ref={ref} className="relative overflow-hidden" style={{ ...containerStyle, background: slide.bgGradient || slide.bgColor }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-10 gap-4" style={{ textAlign: "center" }}>
            {/* Slide number */}
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: slide.textColor, opacity: 0.6 }}>
              {slideIndex + 1} / {totalSlides}
            </div>

            {/* Title in colored box */}
            <div className="px-6 py-3 rounded-lg" style={{ backgroundColor: hlColor }}>
              <h2 className="font-black leading-tight" style={{ color: "#FFFFFF", fontSize: `${slide.titleSize}px` }}>
                {slide.title}
              </h2>
            </div>

            {/* Body in semi-transparent white box */}
            <div className="px-6 py-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <p className="leading-relaxed whitespace-pre-wrap font-medium" style={{ color: slide.textColor, fontSize: `${slide.bodySize}px` }}>
                {slide.body}
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: hlColor }} />
        </div>
      );
    }

    // =========== TEXT-ONLY (DEFAULT) LAYOUT ===========
    return (
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          ...containerStyle,
          background: slide.bgGradient || slide.bgColor,
        }}
      >
        {/* Decorative quote marks for testimonial style */}
        {slide.accentColor === "#F59E0B" && (
          <div className="absolute top-6 left-8 text-6xl leading-none font-serif select-none pointer-events-none" style={{ color: slide.accentColor, opacity: 0.3 }}>
            &ldquo;
          </div>
        )}

        {/* Decorative checkmark for benefits style */}
        {slide.accentColor === "#FBBF24" && slide.bgColor === "#1E3A5F" && (
          <div className="absolute top-6 right-8 select-none pointer-events-none" style={{ color: slide.accentColor, opacity: 0.18 }}>
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        )}

        {/* Decorative transformation arrow for before/after style */}
        {slide.accentColor === "#34D399" && (
          <div className="absolute top-6 right-8 select-none pointer-events-none" style={{ color: slide.accentColor, opacity: 0.2 }}>
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </div>
        )}

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12" style={{ textAlign: slide.align }}>
          <div className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: slide.accentColor }}>
            {slideIndex + 1} / {totalSlides}
          </div>
          <h2 className="font-bold leading-tight mb-4" style={{ color: slide.textColor, fontSize: `${slide.titleSize}px` }}>
            {slide.title}
          </h2>
          <p className="leading-relaxed whitespace-pre-wrap" style={{ color: slide.textColor, fontSize: `${slide.bodySize}px`, opacity: 0.9 }}>
            {slide.body}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: slide.accentColor }} />
      </div>
    );
  }
);

SlidePreview.displayName = "SlidePreview";
export default SlidePreview;

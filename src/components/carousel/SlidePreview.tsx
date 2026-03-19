import { forwardRef } from "react";
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

    return (
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          aspectRatio: isSquare ? "1 / 1" : "16 / 9",
          background: slide.bgGradient || slide.bgColor,
          fontFamily: slide.fontFamily,
          width: "100%",
          maxWidth: isSquare ? 480 : 640,
        }}
      >
        {/* Decorative quote marks for testimonial style */}
        {slide.accentColor === "#F59E0B" && (
          <div
            className="absolute top-6 left-8 text-6xl leading-none font-serif select-none pointer-events-none"
            style={{ color: slide.accentColor, opacity: 0.3 }}
          >
            &ldquo;
          </div>
        )}

        {/* Decorative checkmark for benefits style */}
        {slide.accentColor === "#FBBF24" && slide.bgColor === "#1E3A5F" && (
          <div
            className="absolute top-6 right-8 select-none pointer-events-none"
            style={{ color: slide.accentColor, opacity: 0.18 }}
          >
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        )}

        {/* Decorative transformation arrow for before/after style */}
        {slide.accentColor === "#34D399" && (
          <div
            className="absolute top-6 right-8 select-none pointer-events-none"
            style={{ color: slide.accentColor, opacity: 0.2 }}
          >
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </div>
        )}

        {/* Content */}
        <div
          className="absolute inset-0 flex flex-col justify-center p-8 md:p-12"
          style={{ textAlign: slide.align }}
        >
          {/* Slide number accent */}
          <div
            className="mb-4 text-xs font-bold uppercase tracking-widest"
            style={{ color: slide.accentColor }}
          >
            {slideIndex + 1} / {totalSlides}
          </div>

          <h2
            className="font-bold leading-tight mb-4"
            style={{
              color: slide.textColor,
              fontSize: `${slide.titleSize}px`,
            }}
          >
            {slide.title}
          </h2>

          <p
            className="leading-relaxed whitespace-pre-wrap"
            style={{
              color: slide.textColor,
              fontSize: `${slide.bodySize}px`,
              opacity: 0.9,
            }}
          >
            {slide.body}
          </p>
        </div>

        {/* Decorative accent bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: slide.accentColor }}
        />
      </div>
    );
  }
);

SlidePreview.displayName = "SlidePreview";
export default SlidePreview;

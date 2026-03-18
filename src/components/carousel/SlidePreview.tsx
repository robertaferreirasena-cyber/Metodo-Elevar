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

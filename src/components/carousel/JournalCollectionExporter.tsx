import { forwardRef, useImperativeHandle, useRef } from "react";
import SlidePreview from "./SlidePreview";
import { buildJournalSampleSlides, JOURNAL_LAYOUT_SEQUENCE, type JournalPalette } from "./CarouselTemplates";

export interface JournalExporterHandle {
  /** Returns the array of native-size DOM nodes (one per layout) for capture. */
  getNodes: () => (HTMLDivElement | null)[];
}

interface Props {
  palette: JournalPalette;
  profileHandle?: string;
}

/**
 * Off-screen host that renders the 6 Journaling layouts at native 1080x1080
 * using the real <SlidePreview> component, so html-to-image captures them
 * pixel-faithful to the editor preview.
 */
const JournalCollectionExporter = forwardRef<JournalExporterHandle, Props>(
  ({ palette, profileHandle }, ref) => {
    const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
    const slides = buildJournalSampleSlides(palette, profileHandle);

    useImperativeHandle(ref, () => ({
      getNodes: () => nodeRefs.current,
    }));

    return (
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: -99999,
          top: 0,
          width: 1080,
          pointerEvents: "none",
        }}
      >
        {slides.map((s, i) => (
          <div key={`${palette.id}-${JOURNAL_LAYOUT_SEQUENCE[i]}`} style={{ marginBottom: 4 }}>
            <SlidePreview
              ref={(el) => { nodeRefs.current[i] = el; }}
              slide={s}
              slideIndex={i}
              totalSlides={slides.length}
              aspectRatio="1:1"
              nativeSize
            />
          </div>
        ))}
      </div>
    );
  }
);

JournalCollectionExporter.displayName = "JournalCollectionExporter";
export default JournalCollectionExporter;

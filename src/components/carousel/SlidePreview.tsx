import { forwardRef, useRef, useEffect, useState, useImperativeHandle, useCallback } from "react";
import { Rnd } from "react-rnd";
import type { SlideData } from "./CarouselTemplates";
import { FORMAT_SPECS, type AspectRatio } from "./CarouselTemplates";
import { SlideRenderer } from "./SlideRenderer";

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

    useImperativeHandle(ref, () => ({
      resetTransform: () => {},
      container: innerRef.current
    }));

    const basePreviewWidth = 480;
    const fontScale = (spec.width / basePreviewWidth);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      
      const updateScale = () => {
        const cw = el.clientWidth;
        const ch = el.clientHeight;
        if (cw > 0 && ch > 0) {
          // Calculate scale to fit while maintaining aspect ratio
          const s = Math.min(cw / spec.width, ch / spec.height);
          setScale(s);
        }
      };

      updateScale();
      const obs = new ResizeObserver(updateScale);
      obs.observe(el);
      return () => obs.disconnect();
    }, [spec.width, spec.height, nativeSize, slide]);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const checkAssets = async () => {
        const imgs = Array.from(el.querySelectorAll("img"));
        await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; })));
        onReady?.();
      };
      checkAssets();
    }, [slide, onReady]);

    const updateGuides = useCallback((x: number, y: number, w: number, h: number) => {
      const centerX = x + w / 2;
      const centerY = y + h / 2;
      const threshold = 5;
      const guides: { x?: number; y?: number } = {};
      
      // Center H+V
      if (Math.abs(centerX - spec.width / 2) < threshold) guides.x = spec.width / 2;
      if (Math.abs(centerY - spec.height / 2) < threshold) guides.y = spec.height / 2;
      
      // Edges
      if (Math.abs(x) < threshold) guides.x = 0;
      if (Math.abs(x + w - spec.width) < threshold) guides.x = spec.width;
      if (Math.abs(y) < threshold) guides.y = 0;
      if (Math.abs(y + h - spec.height) < threshold) guides.y = spec.height;
      
      setShowGuides(guides);
    }, [spec.width, spec.height]);

    const renderDraggableLayer = (posKey: 'titlePos' | 'bodyPos', label: string) => {
      const pos = slide[posKey] || (posKey === 'titlePos' ? { x: 0.1, y: 0.1, width: 0.8, height: 0.1 } : { x: 0.1, y: 0.25, width: 0.8, height: 0.3 });
      
      return (
        <Rnd
          className="pointer-events-auto z-20 group"
          position={{ x: pos.x * spec.width, y: pos.y * spec.height }}
          size={{ width: (pos.width || 0.8) * spec.width, height: (pos.height || 0.1) * spec.height }}
          onDrag={(e, d) => {
            updateGuides(d.x, d.y, (pos.width || 0.8) * spec.width, (pos.height || 0.1) * spec.height);
          }}
          onDragStop={(e, d) => {
            setShowGuides({});
            onUpdate?.({ [posKey]: { ...pos, x: d.x / spec.width, y: d.y / spec.height } });
          }}
          onResizeStop={(e, dir, ref, delta, pos) => {
            onUpdate?.({ 
              [posKey]: { 
                ...pos, 
                x: pos.x / spec.width, 
                y: pos.y / spec.height, 
                width: ref.offsetWidth / spec.width, 
                height: ref.offsetHeight / spec.height 
              } 
            });
          }}
          bounds="parent"
          enableResizing={isFreeEditMode}
          disableDragging={!isFreeEditMode}
        >
          {isFreeEditMode ? (
            <div className="w-full h-full border-2 border-primary/50 group-hover:border-primary border-dashed rounded flex items-center justify-center bg-primary/5">
              <span className="text-[10px] font-bold text-primary opacity-50 uppercase tracking-widest">{label}</span>
            </div>
          ) : (
            <div className="w-full h-full" /> // Invisible layer for interaction if needed later
          )}
        </Rnd>
      );
    };

    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden relative bg-[#f0f2f5] dark:bg-black p-2 md:p-6">
        <div 
          ref={innerRef}
          style={{ 
            width: spec.width, 
            height: spec.height, 
            transform: `scale(${scale})`, 
            transformOrigin: "center center", 
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            position: 'absolute',
            flexShrink: 0
          }}
        >
          {/* Static Renderer Background */}
          <SlideRenderer 
            slide={slide}
            slideIndex={slideIndex}
            totalSlides={totalSlides}
            aspectRatio={aspectRatio}
            fontScale={fontScale}
          />

          {/* Smart Guides Overlay */}
          {showGuides.x !== undefined && (
            <div className="absolute z-50 bg-primary/60" style={{ left: showGuides.x, top: 0, bottom: 0, width: 2 / zoom }} />
          )}
          {showGuides.y !== undefined && (
            <div className="absolute z-50 bg-primary/60" style={{ top: showGuides.y, left: 0, right: 0, height: 2 / zoom }} />
          )}
          
          {/* Interactive Layers */}
          {renderDraggableLayer('titlePos', 'Título')}
          {renderDraggableLayer('bodyPos', 'Texto')}

          {/* Additional Layers from slide.layers (if any) */}
          {slide.layers?.map((layer) => (
            <Rnd
              key={layer.id}
              className={`pointer-events-auto z-30 ${selectedLayerId === layer.id ? 'ring-2 ring-primary' : ''}`}
              position={{ x: layer.x * spec.width, y: layer.y * spec.height }}
              size={{ width: layer.width * spec.width, height: layer.height * spec.height }}
              onDragStop={(e, d) => {
                onUpdate?.({
                  layers: slide.layers?.map(l => l.id === layer.id ? { ...l, x: d.x / spec.width, y: d.y / spec.height } : l)
                });
              }}
              onResizeStop={(e, dir, ref, delta, pos) => {
                onUpdate?.({
                  layers: slide.layers?.map(l => l.id === layer.id ? { 
                    ...l, 
                    x: pos.x / spec.width, 
                    y: pos.y / spec.height,
                    width: ref.offsetWidth / spec.width,
                    height: ref.offsetHeight / spec.height
                  } : l)
                });
              }}
              onMouseDown={() => onSelectLayer?.(layer.id)}
              bounds="parent"
              enableResizing={isFreeEditMode}
              disableDragging={!isFreeEditMode}
            >
               {layer.type === 'text' && (
                 <div className="w-full h-full flex items-center justify-center p-2" style={layer.style}>
                   {layer.content}
                 </div>
               )}
               {layer.type === 'image' && layer.content && (
                 <img src={layer.content} className="w-full h-full object-contain" crossOrigin="anonymous" />
               )}
               {layer.type === 'shape' && (
                 <div className="w-full h-full" style={layer.style} />
               )}
            </Rnd>
          ))}

        </div>
      </div>
    );
  }
);

SlidePreview.displayName = "SlidePreview";
export default SlidePreview;


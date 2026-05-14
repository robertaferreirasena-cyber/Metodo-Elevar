import { useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw, Move } from "lucide-react";

export interface ImageAdjustValues {
  positionX?: number;
  positionY?: number;
  scale?: number;
  blur?: number;
  brightness?: number;
   contrast?: number;
   opacity?: number;
}

interface Props {
  imageUrl: string;
  values: ImageAdjustValues;
  onChange: (next: ImageAdjustValues) => void;
  /** Aspect ratio for the mini-preview, defaults to 1 */
  aspectRatio?: number;
}

const DEFAULTS: Required<ImageAdjustValues> = {
  positionX: 50, positionY: 50, scale: 1, blur: 0, brightness: 100, contrast: 100, opacity: 100,
};

const PRESETS: { label: string; values: Partial<ImageAdjustValues> }[] = [
  { label: "Nitidez", values: { contrast: 125, brightness: 105 } },
  { label: "Brilho +", values: { brightness: 130 } },
  { label: "Forte", values: { contrast: 140, brightness: 90 } },
  { label: "Fundo", values: { blur: 8, brightness: 80 } },
  { label: "PB", values: { contrast: 120, brightness: 110, blur: 0 } }, // Desaturate would need grayscale filter, but staying within defined props
];

export default function ImageAdjustPanel({ imageUrl, values, onChange, aspectRatio = 1 }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  // Safe merge: ignore undefined values from `values` so DEFAULTS always win
  // when a key is missing or explicitly undefined (prevents v.scale.toFixed crash).
  const v: Required<ImageAdjustValues> = {
    positionX: values.positionX ?? DEFAULTS.positionX,
    positionY: values.positionY ?? DEFAULTS.positionY,
    scale: values.scale ?? DEFAULTS.scale,
    blur: values.blur ?? DEFAULTS.blur,
    brightness: values.brightness ?? DEFAULTS.brightness,
    contrast: values.contrast ?? DEFAULTS.contrast,
    opacity: values.opacity ?? DEFAULTS.opacity,
  };

  const update = (patch: Partial<ImageAdjustValues>) => onChange({ ...values, ...patch });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const el = previewRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: v.positionX,
      baseY: v.positionY,
    };
  }, [v.positionX, v.positionY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    const el = previewRef.current;
    if (!drag || !el) return;
    const rect = el.getBoundingClientRect();
    // Movement is inverted: dragging right moves the focal point left (image moves with finger).
    // Sensitivity: 1 px of drag ≈ (100 / rect.width) % of position change, divided by zoom.
    const scl = Math.max(1, v.scale);
    const dx = ((e.clientX - drag.startX) / rect.width) * 100 / scl;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100 / scl;
    const nextX = Math.max(0, Math.min(100, drag.baseX - dx));
    const nextY = Math.max(0, Math.min(100, drag.baseY - dy));
    onChange({ ...values, positionX: nextX, positionY: nextY });
  }, [onChange, values, v.scale]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const el = previewRef.current;
    if (el && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  }, []);

  const reset = () => onChange({});

  return (
    <div className="space-y-3 rounded-md border border-border p-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <Label className="text-xs flex items-center gap-1">
          <Move className="h-3 w-3" /> Ajustar imagem (arraste para mover)
        </Label>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={reset}>
          <RotateCcw className="h-3 w-3 mr-1" /> Resetar
        </Button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            size="sm"
            variant="outline"
            className="h-7 text-[10px] px-2 py-0 bg-background/50"
            onClick={() => onChange({ ...values, ...p.values })}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Drag preview */}
      <div
        ref={previewRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full overflow-hidden rounded-md border border-border bg-black/40 cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ aspectRatio: String(aspectRatio) }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: `${v.scale * 100}%`,
            backgroundPosition: `${v.positionX}% ${v.positionY}%`,
            backgroundRepeat: "no-repeat",
            filter: `blur(${v.blur}px) brightness(${v.brightness}%) contrast(${v.contrast}%)`,
            opacity: v.opacity / 100,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full border-2 border-white/60 shadow-md" />
        </div>
      </div>

      <div>
        <Label className="text-xs">Zoom: {v.scale.toFixed(2)}×</Label>
        <Slider value={[v.scale]} onValueChange={([n]) => update({ scale: n })} min={1} max={3} step={0.05} className="mt-1" />
      </div>
      <div>
        <Label className="text-xs">Brilho: {v.brightness}%</Label>
        <Slider value={[v.brightness]} onValueChange={([n]) => update({ brightness: n })} min={50} max={150} step={1} className="mt-1" />
      </div>
      <div>
        <Label className="text-xs">Contraste: {v.contrast}%</Label>
        <Slider value={[v.contrast]} onValueChange={([n]) => update({ contrast: n })} min={50} max={150} step={1} className="mt-1" />
      </div>
      <div>
        <Label className="text-xs">Desfoque: {v.blur}px</Label>
        <Slider value={[v.blur]} onValueChange={([n]) => update({ blur: n })} min={0} max={20} step={0.5} className="mt-1" />
      </div>
    </div>
  );
}

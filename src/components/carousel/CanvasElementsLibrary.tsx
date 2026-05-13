import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Square, Circle, Type, Image as ImageIcon, Star, 
  ArrowRight, Heart, StickyNote, Triangle
} from "lucide-react";

interface CanvasElementsLibraryProps {
  onAddElement: (type: "text" | "image" | "shape" | "sticker", content?: string, style?: any) => void;
}

export default function CanvasElementsLibrary({ onAddElement }: CanvasElementsLibraryProps) {
  const shapes = [
    { type: "shape" as const, icon: Square, label: "Quadrado", style: { borderRadius: 0 } },
    { type: "shape" as const, icon: Circle, label: "Círculo", style: { borderRadius: "50%" } },
    { type: "shape" as const, icon: Triangle, label: "Triângulo", style: { clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" } },
  ];

  const stickers = [
    { type: "sticker" as const, icon: Star, label: "Estrela", content: "⭐" },
    { type: "sticker" as const, icon: Heart, label: "Coração", content: "❤️" },
    { type: "sticker" as const, icon: ArrowRight, label: "Seta", content: "➡️" },
    { type: "sticker" as const, icon: StickyNote, label: "Nota", content: "📝" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold mb-2">Básicos</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-20 flex-col gap-2" onClick={() => onAddElement("text", "Novo Texto")}>
            <Type className="h-5 w-5" />
            <span className="text-[10px]">Texto</span>
          </Button>
          <Button variant="outline" size="sm" className="h-20 flex-col gap-2" onClick={() => onAddElement("image")}>
            <ImageIcon className="h-5 w-5" />
            <span className="text-[10px]">Imagem</span>
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold mb-2">Formas</h3>
        <div className="grid grid-cols-3 gap-2">
          {shapes.map((s) => (
            <Button key={s.label} variant="outline" size="icon" className="h-12 w-full" onClick={() => onAddElement(s.type, undefined, s.style)}>
              <s.icon className="h-5 w-5" />
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold mb-2">Elementos</h3>
        <div className="grid grid-cols-4 gap-2">
          {stickers.map((s) => (
            <Button key={s.label} variant="outline" size="icon" className="h-12 w-full" onClick={() => onAddElement(s.type, s.content)}>
              <span className="text-lg">{s.content}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

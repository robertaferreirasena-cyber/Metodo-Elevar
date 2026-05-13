import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Square, Circle, Type, Image as ImageIcon, Star, 
  ArrowRight, Heart, StickyNote, Triangle, MousePointer2,
  Bookmark, CheckCircle2, Flag, Gift, MessageCircle,
  Play, Quote, Send, Share2, Sparkles, ThumbsUp
} from "lucide-react";

interface CanvasElementsLibraryProps {
  onAddElement: (type: "text" | "image" | "shape" | "sticker", content?: string, style?: any) => void;
}

export default function CanvasElementsLibrary({ onAddElement }: CanvasElementsLibraryProps) {
  const shapes = [
    { type: "shape" as const, icon: Square, label: "Quadrado", style: { borderRadius: 0 } },
    { type: "shape" as const, icon: Circle, label: "Círculo", style: { borderRadius: "50%" } },
    { type: "shape" as const, icon: Triangle, label: "Triângulo", style: { clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" } },
    { type: "shape" as const, icon: MousePointer2, label: "Pílula", style: { borderRadius: "999px" } },
  ];

  const stickers = [
    { label: "Estrela", content: "⭐" },
    { label: "Coração", content: "❤️" },
    { label: "Seta", content: "➡️" },
    { label: "Fogo", content: "🔥" },
    { label: "Foguete", content: "🚀" },
    { label: "Verificado", content: "✅" },
    { label: "Alerta", content: "⚠️" },
    { label: "Info", content: "ℹ️" },
    { label: "Mão", content: "👋" },
    { label: "OK", content: "👌" },
    { label: "Câmera", content: "📸" },
    { label: "Telefone", content: "📱" },
  ];

  const graphics = [
    { icon: Quote, label: "Citação" },
    { icon: Bookmark, label: "Salvar" },
    { icon: Share2, label: "Compartilhar" },
    { icon: MessageCircle, label: "Comentar" },
    { icon: Heart, label: "Curtir" },
    { icon: Send, label: "Enviar" },
    { icon: CheckCircle2, label: "Check" },
    { icon: Play, label: "Play" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Formas Básicas</h3>
        <div className="grid grid-cols-4 gap-2">
          {shapes.map((s) => (
            <Button 
              key={s.label} 
              variant="outline" 
              size="icon" 
              className="h-12 w-full hover:border-primary/50 transition-colors" 
              onClick={() => onAddElement(s.type, undefined, s.style)}
              title={s.label}
            >
              <s.icon className="h-5 w-5" />
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Ícones e Gráficos</h3>
        <div className="grid grid-cols-4 gap-2">
          {graphics.map((g) => (
            <Button 
              key={g.label} 
              variant="outline" 
              size="icon" 
              className="h-12 w-full hover:border-primary/50 transition-colors" 
              onClick={() => onAddElement("sticker", g.label)}
              title={g.label}
            >
              <g.icon className="h-5 w-5" />
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Emoji Stickers</h3>
        <div className="grid grid-cols-4 gap-2">
          {stickers.map((s) => (
            <Button 
              key={s.label} 
              variant="outline" 
              size="icon" 
              className="h-12 w-full hover:border-primary/50 transition-colors" 
              onClick={() => onAddElement("sticker", s.content)}
              title={s.label}
            >
              <span className="text-xl">{s.content}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
        <p className="text-[10px] text-center text-primary font-medium">
          Dica: Você pode mover, redimensionar e girar qualquer elemento diretamente no slide.
        </p>
      </div>
    </div>
  );
}

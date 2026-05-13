import { type LayerData, type SlideData } from "./CarouselTemplates";
import { 
  Type, Image as ImageIcon, Square, Sparkles, Trash2, 
  ChevronUp, ChevronDown, MousePointer2, Layers 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface LayerListProps {
  slide: SlideData;
  onUpdate: (updates: Partial<SlideData>) => void;
  selectedLayerId?: string;
  onSelectLayer: (id: string | undefined) => void;
}

export default function LayerList({ slide, onUpdate, selectedLayerId, onSelectLayer }: LayerListProps) {
  const layers = slide.layers || [];

  const moveLayer = (index: number, direction: 'up' | 'down') => {
    const newLayers = [...layers];
    const newIndex = direction === 'up' ? index + 1 : index - 1;
    if (newIndex < 0 || newIndex >= newLayers.length) return;
    
    [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
    onUpdate({ layers: newLayers });
  };

  const removeLayer = (id: string) => {
    onUpdate({ layers: layers.filter(l => l.id !== id) });
    if (selectedLayerId === id) onSelectLayer(undefined);
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Camadas</h3>
        </div>
        <Badge variant="outline" className="text-[10px]">{layers.length}</Badge>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {layers.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Nenhuma camada adicional.
            </div>
          ) : (
            [...layers].reverse().map((layer, revIdx) => {
              const idx = layers.length - 1 - revIdx;
              const isSelected = selectedLayerId === layer.id;
              
              return (
                <div 
                  key={layer.id}
                  className={`flex items-center gap-2 p-2 rounded-md border transition-all cursor-pointer ${
                    isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-transparent hover:bg-muted/50'
                  }`}
                  onClick={() => onSelectLayer(layer.id)}
                >
                  <div className="p-1.5 rounded bg-background border shadow-sm">
                    {layer.type === 'text' && <Type className="h-3.5 w-3.5" />}
                    {layer.type === 'image' && <ImageIcon className="h-3.5 w-3.5" />}
                    {layer.type === 'shape' && <Square className="h-3.5 w-3.5" />}
                    {layer.type === 'sticker' && <Sparkles className="h-3.5 w-3.5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">
                      {layer.type === 'text' ? (layer.content || 'Texto') : 
                       layer.type === 'sticker' ? layer.content : 
                       layer.type.charAt(0).toUpperCase() + layer.type.slice(1)}
                    </p>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={(e) => { e.stopPropagation(); moveLayer(idx, 'up'); }}
                      disabled={idx === layers.length - 1}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={(e) => { e.stopPropagation(); moveLayer(idx, 'down'); }}
                      disabled={idx === 0}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10" 
                      onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

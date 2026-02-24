import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Brain, BarChart3, Zap, FileText, Lightbulb, BookOpen, Layout, Target, Palette, Bot } from "lucide-react";

export type AiToolAction = 'strategist' | 'analyzer' | 'sequence' | 'group-content' | 'ideas' | 'scripts' | 'templates' | 'raio-x' | 'copy' | 'agent';

interface AiToolbarProps {
  onAction: (action: AiToolAction) => void;
  disabled?: boolean;
}

const tools: { key: AiToolAction; label: string; icon: React.ReactNode }[] = [
  { key: 'agent', label: 'Agente', icon: <Bot className="h-3 w-3" /> },
  { key: 'strategist', label: 'Estrategista', icon: <Brain className="h-3 w-3" /> },
  { key: 'analyzer', label: 'Analisar', icon: <BarChart3 className="h-3 w-3" /> },
  { key: 'sequence', label: 'Sequência', icon: <Zap className="h-3 w-3" /> },
  { key: 'group-content', label: 'Conteúdo', icon: <FileText className="h-3 w-3" /> },
  { key: 'ideas', label: 'Ideias', icon: <Lightbulb className="h-3 w-3" /> },
  { key: 'scripts', label: 'Scripts', icon: <BookOpen className="h-3 w-3" /> },
  { key: 'templates', label: 'Templates', icon: <Layout className="h-3 w-3" /> },
  { key: 'raio-x', label: 'Raio-X', icon: <Target className="h-3 w-3" /> },
  { key: 'copy', label: 'Copy', icon: <Palette className="h-3 w-3" /> },
];

export function AiToolbar({ onAction, disabled }: AiToolbarProps) {
  return (
    <div className="px-2 py-1.5 border-t border-border bg-muted/20">
      <ScrollArea className="w-full">
        <div className="flex gap-1.5 pb-1">
          {tools.map(t => (
            <Button
              key={t.key}
              variant="outline"
              size="sm"
              className="h-7 text-[11px] gap-1 shrink-0 whitespace-nowrap"
              onClick={() => onAction(t.key)}
              disabled={disabled}
            >
              {t.icon} {t.label}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

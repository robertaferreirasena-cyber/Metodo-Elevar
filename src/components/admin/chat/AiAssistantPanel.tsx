import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Copy, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface AiAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  loading: boolean;
  onUseAsReply?: (text: string) => void;
}

export function AiAssistantPanel({ open, onClose, title, content, loading, onUseAsReply }: AiAssistantPanelProps) {
  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado!");
  };

  // Extract text inside code blocks for "use as reply"
  const extractReply = () => {
    const match = content.match(/```[\s\S]*?\n([\s\S]*?)```/);
    return match?.[1]?.trim() || content.slice(0, 500);
  };

  return (
    <div className="w-80 border-l border-border bg-card/50 flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-xs font-semibold">{title}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-xs text-muted-foreground">Analisando...</span>
          </div>
        ) : content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhum resultado</p>
        )}
      </ScrollArea>
      {content && !loading && (
        <div className="flex gap-2 p-2 border-t border-border">
          <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={handleCopy}>
            <Copy className="h-3 w-3 mr-1" /> Copiar
          </Button>
          {onUseAsReply && (
            <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => onUseAsReply(extractReply())}>
              <Send className="h-3 w-3 mr-1" /> Usar como resposta
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

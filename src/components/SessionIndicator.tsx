import { History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SessionIndicatorProps {
  show: boolean;
  onClear: () => void;
  className?: string;
  message?: string;
}

export function SessionIndicator({ 
  show, 
  onClear, 
  className,
  message = "Sessão anterior restaurada — limpe para usar a versão mais nova",

  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2 duration-300",
        className
      )}
    >
      <History className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{message}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onClear}
        title="Limpar e começar do zero"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

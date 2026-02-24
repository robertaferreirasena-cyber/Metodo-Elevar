import { MessageCircle, Users } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type ChatMode = "private" | "group";

interface ModeSelectorProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  className?: string;
}

export function ModeSelector({ mode, onModeChange, className }: ModeSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(value) => value && onModeChange(value as ChatMode)}
      className={cn("bg-secondary/50 rounded-lg p-1", className)}
    >
      <ToggleGroupItem
        value="private"
        aria-label="Modo Privado"
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
          mode === "private"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span>Privado</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="group"
        aria-label="Modo Grupo"
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
          mode === "group"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Users className="h-3.5 w-3.5" />
        <span>Grupo</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

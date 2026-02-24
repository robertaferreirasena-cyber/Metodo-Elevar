import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical, CheckCheck, Archive, BellOff, Pin, Trash2 } from "lucide-react";

interface ChatActionsProps {
  chatId: string;
  onMarkAsRead?: (chatId: string) => void;
  onArchive?: (chatId: string) => void;
  onMute?: (chatId: string) => void;
  onPin?: (chatId: string) => void;
  onDelete?: (chatId: string) => void;
}

export function ChatActions({ chatId, onMarkAsRead, onArchive, onMute, onPin, onDelete }: ChatActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        {onMarkAsRead && (
          <DropdownMenuItem onClick={() => onMarkAsRead(chatId)}>
            <CheckCheck className="h-3 w-3 mr-2" /> Marcar como lido
          </DropdownMenuItem>
        )}
        {onPin && (
          <DropdownMenuItem onClick={() => onPin(chatId)}>
            <Pin className="h-3 w-3 mr-2" /> Fixar conversa
          </DropdownMenuItem>
        )}
        {onMute && (
          <DropdownMenuItem onClick={() => onMute(chatId)}>
            <BellOff className="h-3 w-3 mr-2" /> Silenciar
          </DropdownMenuItem>
        )}
        {onArchive && (
          <DropdownMenuItem onClick={() => onArchive(chatId)}>
            <Archive className="h-3 w-3 mr-2" /> Arquivar
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {onDelete && (
          <DropdownMenuItem onClick={() => onDelete(chatId)} className="text-destructive">
            <Trash2 className="h-3 w-3 mr-2" /> Deletar conversa
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

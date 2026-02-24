import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Reply, SmilePlus, Pencil, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

interface MessageActionsProps {
  messageId: string;
  body: string;
  isFromMe: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string, body: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}

const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function MessageActions({ messageId, body, isFromMe, onReact, onReply, onEdit, onDelete }: MessageActionsProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(body);
    toast.success("Copiado!");
  };

  return (
    <div className="flex items-center gap-0.5">
      {onReact && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <SmilePlus className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" className="flex gap-1 p-1 min-w-0">
            {quickEmojis.map(e => (
              <button key={e} className="text-sm hover:scale-125 transition-transform p-1" onClick={() => onReact(messageId, e)}>{e}</button>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align={isFromMe ? "end" : "start"}>
          {onReply && (
            <DropdownMenuItem onClick={() => onReply(messageId, body)}>
              <Reply className="h-3 w-3 mr-2" /> Responder
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="h-3 w-3 mr-2" /> Copiar
          </DropdownMenuItem>
          {isFromMe && onEdit && (
            <DropdownMenuItem onClick={() => onEdit(messageId)}>
              <Pencil className="h-3 w-3 mr-2" /> Editar
            </DropdownMenuItem>
          )}
          {isFromMe && onDelete && (
            <DropdownMenuItem onClick={() => onDelete(messageId)} className="text-destructive">
              <Trash2 className="h-3 w-3 mr-2" /> Apagar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Paperclip, MapPin, Contact2, Sticker, Link2, BarChart3, List } from "lucide-react";

interface AttachmentMenuProps {
  onFileClick: () => void;
  onLocation?: () => void;
  onContact?: () => void;
  onSticker?: () => void;
  onLink?: () => void;
  onPoll?: () => void;
  onList?: () => void;
  disabled?: boolean;
}

export function AttachmentMenu({ onFileClick, onLocation, onContact, onSticker, onLink, onPoll, onList, disabled }: AttachmentMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" disabled={disabled}>
          <Paperclip className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-48">
        <DropdownMenuItem onClick={onFileClick}>
          <Paperclip className="h-3.5 w-3.5 mr-2" /> Arquivo / Mídia
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {onLocation && (
          <DropdownMenuItem onClick={onLocation}>
            <MapPin className="h-3.5 w-3.5 mr-2" /> Localização
          </DropdownMenuItem>
        )}
        {onContact && (
          <DropdownMenuItem onClick={onContact}>
            <Contact2 className="h-3.5 w-3.5 mr-2" /> Contato (vCard)
          </DropdownMenuItem>
        )}
        {onSticker && (
          <DropdownMenuItem onClick={onSticker}>
            <Sticker className="h-3.5 w-3.5 mr-2" /> Figurinha
          </DropdownMenuItem>
        )}
        {onLink && (
          <DropdownMenuItem onClick={onLink}>
            <Link2 className="h-3.5 w-3.5 mr-2" /> Link com preview
          </DropdownMenuItem>
        )}
        {onPoll && (
          <DropdownMenuItem onClick={onPoll}>
            <BarChart3 className="h-3.5 w-3.5 mr-2" /> Enquete
          </DropdownMenuItem>
        )}
        {onList && (
          <DropdownMenuItem onClick={onList}>
            <List className="h-3.5 w-3.5 mr-2" /> Lista interativa
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

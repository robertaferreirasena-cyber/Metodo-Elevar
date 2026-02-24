import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Download, FileText } from "lucide-react";

interface ReactionItem {
  emoji: string;
  count: number;
}

interface ChatBubbleProps {
  body: string;
  isFromMe: boolean;
  timestamp: string;
  messageType?: string;
  mediaUrl?: string;
  reactions?: ReactionItem[];
}

export function ChatBubble({ body, isFromMe, timestamp, messageType, mediaUrl, reactions }: ChatBubbleProps) {
  const time = (() => {
    try { return format(new Date(timestamp), 'HH:mm'); } catch { return ''; }
  })();

  const renderMedia = () => {
    if (!messageType || messageType === 'text' || messageType === 'chat') return null;

    if (messageType === 'image' || messageType === 'sticker') {
      const src = mediaUrl || '';
      if (!src) return <span className="text-xs text-muted-foreground italic">📷 Imagem</span>;
      return <img src={src} alt="imagem" className="rounded max-w-full max-h-60 mb-1" loading="lazy" />;
    }

    if (messageType === 'video') {
      if (!mediaUrl) return <span className="text-xs text-muted-foreground italic">🎥 Vídeo</span>;
      return <video src={mediaUrl} controls className="rounded max-w-full max-h-60 mb-1" />;
    }

    if (messageType === 'audio' || messageType === 'ptt') {
      if (!mediaUrl) return <span className="text-xs text-muted-foreground italic">🎵 Áudio</span>;
      return <audio src={mediaUrl} controls className="w-full mb-1" />;
    }

    if (messageType === 'document') {
      return (
        <a href={mediaUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline mb-1">
          <FileText className="h-4 w-4" />
          <span>{body || 'Documento'}</span>
          <Download className="h-3 w-3" />
        </a>
      );
    }

    return <span className="text-xs text-muted-foreground italic block mb-1">📎 {messageType}</span>;
  };

  const hasReactions = reactions && reactions.length > 0;

  return (
    <div className={cn("flex flex-col mb-1", isFromMe ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-3 py-1.5 text-sm shadow-sm",
          isFromMe
            ? "bg-primary/20 text-foreground rounded-br-sm"
            : "bg-card text-foreground rounded-bl-sm border border-border"
        )}
      >
        {renderMedia()}
        {(messageType === 'text' || messageType === 'chat' || !messageType || (messageType !== 'document' && body)) && (
          <p className="whitespace-pre-wrap break-words">{body || '[mídia]'}</p>
        )}
        <span className="text-[10px] text-muted-foreground float-right ml-2 mt-0.5">{time}</span>
      </div>
      {hasReactions && (
        <div className={cn("flex gap-0.5 -mt-1.5 px-1", isFromMe ? "justify-end" : "justify-start")}>
          {reactions.map((r, i) => (
            <span
              key={`${r.emoji}-${i}`}
              className="inline-flex items-center gap-0.5 bg-muted/80 border border-border rounded-full px-1.5 py-0.5 text-xs shadow-sm"
            >
              <span>{r.emoji}</span>
              {r.count > 1 && <span className="text-muted-foreground text-[10px]">{r.count}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
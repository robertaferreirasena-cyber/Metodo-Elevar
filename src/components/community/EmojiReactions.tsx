import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface EmojiReactionsProps {
  reactions: Reaction[];
  onReact: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
}

export function EmojiReactions({ reactions, onReact, onRemoveReaction }: EmojiReactionsProps) {
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    const existingReaction = reactions.find(r => r.emoji === emoji);
    if (existingReaction?.hasReacted) {
      onRemoveReaction(emoji);
    } else {
      onReact(emoji);
    }
    setOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant="outline"
          size="sm"
          className={cn(
            "h-6 px-2 text-xs gap-1",
            reaction.hasReacted && "bg-primary/10 border-primary"
          )}
          onClick={() => handleEmojiClick(reaction.emoji)}
        >
          <span>{reaction.emoji}</span>
          <span className="text-muted-foreground">{reaction.count}</span>
        </Button>
      ))}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Smile className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                className="text-lg hover:bg-muted p-1 rounded transition-colors"
                onClick={() => handleEmojiClick(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReplyPreviewProps {
  replyTo: {
    id: string;
    content: string;
    authorName: string;
  };
  onCancel: () => void;
}

export function ReplyPreview({ replyTo, onCancel }: ReplyPreviewProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-l-2 border-primary rounded-r">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary">
          Respondendo a {replyTo.authorName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {replyTo.content}
        </p>
      </div>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onCancel}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

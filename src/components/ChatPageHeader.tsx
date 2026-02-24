import { ArrowLeft, BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyFormatsGlossary } from "@/components/CopyFormatsGlossary";
import { useNavigate } from "react-router-dom";

interface ChatPageHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgClass?: string;
  backPath?: string;
  showGlossary?: boolean;
  showNewConversation?: boolean;
  hasMessages?: boolean;
  onNewConversation?: () => void;
  newConversationLabel?: string;
}

export function ChatPageHeader({
  title,
  subtitle,
  icon,
  iconBgClass = "bg-primary/20",
  backPath = "/",
  showGlossary = true,
  showNewConversation = true,
  hasMessages = false,
  onNewConversation,
  newConversationLabel = "Nova conversa",
}: ChatPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-4 sm:mb-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(backPath)}
          className="text-muted-foreground hover:text-foreground shrink-0 touch-target"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0 ${iconBgClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-foreground text-sm sm:text-base truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {showGlossary && (
          <CopyFormatsGlossary
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground shrink-0 touch-target"
              >
                <BookOpen className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Glossário</span>
              </Button>
            }
          />
        )}
        
        {showNewConversation && hasMessages && onNewConversation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewConversation}
            className="text-muted-foreground hover:text-foreground shrink-0 touch-target"
          >
            <RotateCcw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{newConversationLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

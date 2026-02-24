import { Send, Paperclip, X, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { KeyboardEvent, useState, useRef } from "react";
import { ModeSelector, ChatMode } from "./ModeSelector";
import { useFileUpload } from "@/hooks/useFileUpload";

interface Attachment {
  file: File;
  preview?: string;
}

interface ChatInputProps {
  onSend: (message: string, attachments?: string[]) => void;
  isLoading: boolean;
  placeholder?: string;
  showModeSelector?: boolean;
  mode?: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
  isAdmin?: boolean;
}

export function ChatInput({ 
  onSend, 
  isLoading, 
  placeholder = "Digite seu produto ou serviço...",
  showModeSelector = false,
  mode = "private",
  onModeChange,
  isAdmin = false
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMultiple, isUploading, validateFile } = useFileUpload();

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || isUploading) return;

    let uploadedUrls: string[] = [];
    
    if (attachments.length > 0) {
      const files = attachments.map(a => a.file);
      uploadedUrls = await uploadMultiple(files);
    }

    onSend(input.trim(), uploadedUrls.length > 0 ? uploadedUrls : undefined);
    setInput("");
    setAttachments([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles: Attachment[] = [];
    for (const file of files) {
      const error = validateFile(file);
      if (!error) {
        const preview = file.type.startsWith('image/') 
          ? URL.createObjectURL(file) 
          : undefined;
        validFiles.push({ file, preview });
      }
    }
    
    setAttachments(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const updated = [...prev];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview!);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-3 safe-area-bottom">
      {showModeSelector && onModeChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Modo:</span>
          <ModeSelector mode={mode} onModeChange={onModeChange} />
        </div>
      )}
      
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-secondary/30">
          {attachments.map((attachment, index) => (
            <div 
              key={index} 
              className="relative group flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border"
            >
              {attachment.preview ? (
                <img 
                  src={attachment.preview} 
                  alt={attachment.file.name}
                  className="h-10 w-10 object-cover rounded-lg"
                />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center bg-muted rounded-lg">
                  {getFileIcon(attachment.file)}
                </div>
              )}
              <span className="text-sm text-muted-foreground max-w-[120px] truncate">
                {attachment.file.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-90 transition-all touch-manipulation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-end gap-2 sm:gap-3 rounded-xl border border-border bg-secondary/50 p-2 sm:p-3">
        {/* File Upload Button - Only for admins */}
        {isAdmin && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="h-12 w-12 sm:h-10 sm:w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all touch-manipulation rounded-xl"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </>
        )}
        
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[48px] max-h-32 resize-none border-0 bg-transparent p-2 text-base sm:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
          disabled={isLoading || isUploading}
        />
        <Button
          onClick={handleSend}
          disabled={(!input.trim() && attachments.length === 0) || isLoading || isUploading}
          size="icon"
          className="h-12 w-12 sm:h-10 sm:w-10 shrink-0 rounded-xl gradient-primary glow-pink touch-manipulation active:scale-95 transition-all disabled:opacity-40 disabled:glow-none"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

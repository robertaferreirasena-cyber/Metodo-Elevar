import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Heart, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  messageId?: string;
  isFavorited?: boolean;
  onToggleFavorite?: (content: string, messageId?: string) => void;
  showFavoriteButton?: boolean;
}

// Mapa de descrições dos formatos de copy para tooltips
const COPY_FORMAT_DESCRIPTIONS: Record<string, { emoji: string; description: string; levels: string }> = {
  "pas": { emoji: "🔥", description: "Desperta a dor antes de apresentar a solução", levels: "Níveis 1-2" },
  "problema, agitação, solução": { emoji: "🔥", description: "Desperta a dor antes de apresentar a solução", levels: "Níveis 1-2" },
  "bab": { emoji: "🌉", description: "Mostra o antes, depois e a ponte (sua solução)", levels: "Níveis 2-3" },
  "before, after, bridge": { emoji: "🌉", description: "Mostra o antes, depois e a ponte (sua solução)", levels: "Níveis 2-3" },
  "aida": { emoji: "🎯", description: "Jornada: Atenção → Interesse → Desejo → Ação", levels: "Níveis 1-4" },
  "fab": { emoji: "💎", description: "Transforma características em benefícios tangíveis", levels: "Níveis 3-4" },
  "features, advantages, benefits": { emoji: "💎", description: "Transforma características em benefícios tangíveis", levels: "Níveis 3-4" },
  "prova social": { emoji: "⭐", description: "Usa resultados de outros para gerar confiança", levels: "Nível 4" },
  "escassez": { emoji: "⏰", description: "Cria urgência para ação imediata", levels: "Nível 5" },
  "urgência": { emoji: "⏰", description: "Cria pressão temporal para decisão rápida", levels: "Nível 5" },
  "storytelling": { emoji: "📖", description: "Conecta através de histórias e narrativas", levels: "Todos" },
  "história": { emoji: "📖", description: "Conecta através de histórias e narrativas", levels: "Todos" },
  "quebra de objeção": { emoji: "🛡️", description: "Antecipa e neutraliza resistências comuns", levels: "Níveis 3-5" },
  "instagram copy": { emoji: "💬", description: "Conduz o lead com perguntas estratégicas", levels: "Todos" },
  "conversa guiada": { emoji: "💬", description: "Conduz o lead com perguntas estratégicas", levels: "Todos" },
  "curiosidade": { emoji: "🔮", description: "Cria mistério que obriga a continuar lendo", levels: "Níveis 1-3" },
  "gancho": { emoji: "🔮", description: "Cria mistério que obriga a continuar lendo", levels: "Níveis 1-3" },
  "diagnóstico": { emoji: "🔍", description: "Faz perguntas para entender a situação do lead", levels: "Níveis 2-3" },
};

// Busca a descrição do formato de copy
function getCopyFormatInfo(format: string): { emoji: string; description: string; levels: string } | null {
  const normalizedFormat = format.toLowerCase().trim();
  
  // Busca exata
  if (COPY_FORMAT_DESCRIPTIONS[normalizedFormat]) {
    return COPY_FORMAT_DESCRIPTIONS[normalizedFormat];
  }
  
  // Busca parcial
  for (const [key, value] of Object.entries(COPY_FORMAT_DESCRIPTIONS)) {
    if (normalizedFormat.includes(key) || key.includes(normalizedFormat)) {
      return value;
    }
  }
  
  return null;
}

// Extrai o formato de copy mencionado na resposta da IA
function extractCopyFormat(content: string): string | null {
  const patterns = [
    /\*\*FORMATO DE COPY (?:RECOMENDADO|ESCOLHIDO)\*\*\s*\n\*\*([^*]+)\*\*/i,
    /🎓\s*\*\*FORMATO DE COPY (?:RECOMENDADO|ESCOLHIDO)\*\*\s*\n\*\*([^*\-]+)/i,
    /Formato:\s*\*\*([^*]+)\*\*/i,
    /Formato:\s*([^\n]+)/i,
    /copyFormat["']?\s*:\s*["']([^"']+)["']/i,
    /usando\s+\[([^\]]+)\]/i,
    /\(usando\s+([^)]+)\)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/\*\*/g, '').substring(0, 50);
    }
  }

  return null;
}

export function ChatMessage({ 
  role, 
  content, 
  messageId,
  isFavorited = false,
  onToggleFavorite,
  showFavoriteButton = true
}: ChatMessageProps) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";
  const [copied, setCopied] = useState(false);

  // Extrai o formato de copy da mensagem da IA
  const copyFormat = useMemo(() => {
    if (!isAssistant) return null;
    return extractCopyFormat(content);
  }, [isAssistant, content]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(content, messageId);
    }
  };

  const handleCopyClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    const textToCopy = selectedText || content;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success(selectedText ? "Texto selecionado copiado!" : "Mensagem copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar texto");
    }
  }, [content]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex w-full group", isUser ? "justify-end" : "justify-start")}>
        <div className={cn(
          "flex flex-col min-w-0",
          isUser ? "items-end max-w-[90vw] sm:max-w-[700px] lg:max-w-[800px]" : "w-full"
        )}>
          {/* Message content */}
          <div
            className={cn(
              "text-sm min-w-0 select-text",
              isUser
                ? "rounded-2xl px-4 py-3 bg-primary text-primary-foreground"
                : "text-foreground w-full"
            )}
          >
            {isUser ? (
              <p className="break-words whitespace-pre-wrap" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{content}</p>
            ) : (
              <div 
                className="prose prose-sm prose-invert prose-chat max-w-none overflow-x-auto [&>*]:max-w-full [&_p]:whitespace-pre-wrap [&_li]:whitespace-pre-wrap [&_*]:select-text"
                style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
              >
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>
          
          {/* Action buttons for assistant messages - below content */}
          {isAssistant && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Copy Format Badge with Tooltip */}
              {copyFormat && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="secondary" 
                      className="bg-primary/10 text-primary border-primary/20 font-medium text-xs animate-fade-in cursor-help"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {copyFormat}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    {(() => {
                      const info = getCopyFormatInfo(copyFormat);
                      if (info) {
                        return (
                          <div className="space-y-1">
                            <p className="font-medium">{info.emoji} {copyFormat}</p>
                            <p className="text-xs text-muted-foreground">{info.description}</p>
                            <p className="text-[10px] text-primary/80">Ideal para: {info.levels}</p>
                          </div>
                        );
                      }
                      return <p className="text-xs">Formato de copy utilizado nesta resposta</p>;
                    })()}
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Action buttons */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {/* Copy button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyClick}
                    className={cn(
                      "h-8 px-2 rounded-lg transition-all touch-manipulation active:scale-95",
                      copied 
                        ? "text-green-500 bg-green-500/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs">{copied ? "Copiado" : "Copiar"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>Copiar {copied ? "✓" : "(selecione texto ou copie tudo)"}</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Favorite button */}
              {showFavoriteButton && onToggleFavorite && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFavoriteClick}
                      className={cn(
                        "h-8 px-2 rounded-lg transition-all touch-manipulation active:scale-95",
                        isFavorited 
                          ? "text-red-500 hover:text-red-600 bg-red-500/10" 
                          : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      )}
                    >
                      <Heart className={cn("h-4 w-4 mr-1", isFavorited && "fill-current")} />
                      <span className="text-xs">{isFavorited ? "Salvo" : "Salvar"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p>{isFavorited ? "Remover dos favoritos" : "Salvar nos favoritos"}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

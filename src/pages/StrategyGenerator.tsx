import { SparklesIcon } from "@/components/icons";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { useChat, ChatMode } from "@/hooks/useChat";
import { useFavorites } from "@/hooks/useFavorites";
import { useAdmin } from "@/hooks/useAdmin";
import { PersonaSummary } from "@/components/PersonaSummary";
import { SessionIndicator } from "@/components/SessionIndicator";
import { PromptSuggestions, PRIVATE_STRATEGY_SUGGESTIONS, CAMPAIGN_SUGGESTIONS, ACTIONS_EVENT_SUGGESTIONS, REMARKETING_SUGGESTIONS } from "@/components/PromptSuggestions";
import { ChatPageHeader } from "@/components/ChatPageHeader";
import { useRef, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function StrategyGenerator() {
  const [mode, setMode] = useState<ChatMode>("private");
  const { messages, isLoading, sendMessage, clearMessages, loadConversation, setMode: setChatMode, hasRestoredSession } = useChat(mode);
  const { addFavorite, removeFavorite, isFavorited, getFavoriteByMessageId } = useFavorites();
  const { isAdmin } = useAdmin();
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("conversa");

  const adaptarPrompt = searchParams.get("adaptar");

  // Load existing conversation if ID is provided
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, loadConversation]);

  // Auto-send adaptation prompt if provided via URL
  useEffect(() => {
    if (adaptarPrompt && messages.length === 0 && !isLoading) {
      const decodedPrompt = decodeURIComponent(adaptarPrompt);
      sendMessage(decodedPrompt);
      navigate("/privado/estrategias", { replace: true });
    }
  }, [adaptarPrompt, messages.length, isLoading, sendMessage, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    setChatMode(newMode);
  };

  const handleNewConversation = () => {
    clearMessages();
    navigate("/privado/estrategias", { replace: true });
  };

  const handleToggleFavorite = async (content: string, messageId?: string) => {
    if (messageId && isFavorited(messageId)) {
      const favorite = getFavoriteByMessageId(messageId);
      if (favorite) {
        await removeFavorite(favorite.id);
      }
    } else {
      const title = content.substring(0, 50) + (content.length > 50 ? "..." : "");
      await addFavorite(content, "strategy", title, messageId);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col min-h-0">
      {/* Header */}
      <ChatPageHeader
        title="Gerador de Estratégias"
        subtitle="Descreva seu produto ou serviço para receber estratégias personalizadas"
        icon={<SparklesIcon />}
        iconBgClass="gradient-primary glow-pink"
        backPath="/privado"
        hasMessages={messages.length > 0}
        onNewConversation={handleNewConversation}
      />

      {/* Session Restored Indicator */}
      <SessionIndicator
        show={hasRestoredSession && messages.length > 0 && !conversationId}
        onClear={clearMessages}
        message="Conversa anterior restaurada"
        className="mb-4 shrink-0"
      />

      {/* Persona Context Summary */}
      <PersonaSummary className="mb-4 shrink-0" />

      {/* Chat Area */}
      <div className="card-main rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-6 overflow-y-auto">
            <div className="space-y-3 mb-6">
              <div className="mx-auto w-12 h-12 rounded-full gradient-primary flex items-center justify-center glow-pink">
                <SparklesIcon />
              </div>
              <h2 className="font-semibold text-foreground">Pronto para criar sua estratégia?</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Descreva seu produto, serviço ou situação de vendas e receba estratégias personalizadas para vender mais via Instagram.
              </p>
            </div>
            <div className="w-full max-w-lg">
              <p className="text-xs text-muted-foreground mb-3 font-medium">💡 Estratégias rápidas:</p>
              <PromptSuggestions 
                suggestions={PRIVATE_STRATEGY_SUGGESTIONS} 
                onSelect={sendMessage} 
              />
              <p className="text-xs text-muted-foreground mb-3 mt-4 font-medium">📅 Ações e Eventos:</p>
              <PromptSuggestions 
                suggestions={ACTIONS_EVENT_SUGGESTIONS} 
                onSelect={sendMessage} 
              />
              <p className="text-xs text-muted-foreground mb-3 mt-4 font-medium">🔄 Remarketing:</p>
              <PromptSuggestions 
                suggestions={REMARKETING_SUGGESTIONS} 
                onSelect={sendMessage} 
              />
              <p className="text-xs text-muted-foreground mb-3 mt-4 font-medium">📢 Criar campanhas:</p>
              <PromptSuggestions 
                suggestions={CAMPAIGN_SUGGESTIONS} 
                onSelect={sendMessage} 
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 space-y-4 min-h-0" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <ChatMessage 
                key={idx} 
                role={msg.role} 
                content={msg.content}
                messageId={msg.id}
                isFavorited={msg.id ? isFavorited(msg.id) : false}
                onToggleFavorite={handleToggleFavorite}
                showFavoriteButton={msg.role === "assistant"}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-secondary px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="p-4 sm:p-6 pt-4 border-t border-border shrink-0">
          <ChatInput 
            onSend={sendMessage} 
            isLoading={isLoading}
            showModeSelector={true}
            mode={mode}
            onModeChange={handleModeChange}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}

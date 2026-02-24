import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { SessionIndicator } from "@/components/SessionIndicator";
import { PromptSuggestions, GROUP_CONTENT_SUGGESTIONS, CAMPAIGN_SUGGESTIONS, ACTIONS_EVENT_SUGGESTIONS, COMMUNITY_ENGAGEMENT_SUGGESTIONS, REMARKETING_SUGGESTIONS } from "@/components/PromptSuggestions";
import { useChat, ChatMode } from "@/hooks/useChat";
import { useFavorites } from "@/hooks/useFavorites";
import { ChatPageHeader } from "@/components/ChatPageHeader";

export default function GroupContent() {
  const [mode, setMode] = useState<ChatMode>("group");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("conversa");
  const { messages, isLoading, sendMessage, clearMessages, loadConversation, setMode: setChatMode, hasRestoredSession } = useChat("group");
  const { favorites, addFavorite, removeFavorite, isFavorited } = useFavorites();

  const adaptarPrompt = searchParams.get("adaptar");

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
      navigate("/grupo/conteudo", { replace: true });
    }
  }, [adaptarPrompt, messages.length, isLoading, sendMessage, navigate]);

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    setChatMode(newMode);
  };

  const handleToggleFavorite = async (content: string, messageId?: string) => {
    if (isFavorited(messageId)) {
      const favorite = favorites.find(f => f.message_id === messageId);
      if (favorite) {
        await removeFavorite(favorite.id);
      }
    } else {
      await addFavorite(content, "strategy", undefined, messageId);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto min-h-0">
      {/* Header */}
      <ChatPageHeader
        title="Conteúdo para Grupos"
        subtitle="Posts curtos e envolventes"
        icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconBgClass="bg-accent/10"
        backPath="/grupo"
        hasMessages={messages.length > 0}
        onNewConversation={clearMessages}
      />

      {/* Session Restored Indicator */}
      <SessionIndicator
        show={hasRestoredSession && messages.length > 0 && !conversationId}
        onClear={clearMessages}
        message="Conversa anterior restaurada"
        className="mb-4 shrink-0"
      />

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto mb-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4 p-4 pr-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent-foreground">
              <Users className="h-8 w-8" />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-lg font-medium text-foreground">Engaje seu grupo!</h2>
              <p className="text-sm">
                Descreva seu produto/serviço e o objetivo do post. Vou criar conteúdo 
                curto e envolvente que gera interação e prepara vendas.
              </p>
            </div>
            <div className="w-full max-w-lg">
              <p className="text-xs text-muted-foreground mb-3 font-medium">💡 Posts rápidos:</p>
              <PromptSuggestions 
                suggestions={GROUP_CONTENT_SUGGESTIONS} 
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
              <p className="text-xs text-muted-foreground mb-3 mt-4 font-medium">🎪 Engajamento e Comunidade:</p>
              <PromptSuggestions 
                suggestions={COMMUNITY_ENGAGEMENT_SUGGESTIONS} 
                onSelect={sendMessage} 
              />
            </div>
          </div>
        )}
        <div className="space-y-4 pr-4 sm:pr-6">
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              isFavorited={msg.role === "assistant" ? isFavorited(msg.id) : undefined}
              onToggleFavorite={
                msg.role === "assistant"
                  ? () => handleToggleFavorite(msg.content, msg.id)
                  : undefined
              }
            />
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              </div>
              <span className="text-sm">Criando conteúdo...</span>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0">
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          placeholder="Descreva o post que você quer criar para o grupo..."
          showModeSelector={true}
          mode={mode}
          onModeChange={handleModeChange}
        />
      </div>
    </div>
  );
}

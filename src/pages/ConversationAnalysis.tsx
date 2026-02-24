import { SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { PersonaSummary } from "@/components/PersonaSummary";
import { SessionIndicator } from "@/components/SessionIndicator";
import { PromptSuggestions, CONVERSATION_ANALYSIS_SUGGESTIONS } from "@/components/PromptSuggestions";
import { ChatPageHeader } from "@/components/ChatPageHeader";
import { useConversationAnalysis } from "@/hooks/useConversationAnalysis";
import { useFavorites } from "@/hooks/useFavorites";
import { useEffect } from "react";

export default function ConversationAnalysis() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { messages, isLoading, sendMessage, clearMessages, loadConversation, hasRestoredSession } = useConversationAnalysis();
  const { addFavorite, removeFavorite, isFavorited, getFavoriteByMessageId } = useFavorites();
  const conversationId = searchParams.get("conversa");

  // Load existing conversation if ID is provided
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, loadConversation]);

  const hasMessages = messages.length > 0;

  const handleNewAnalysis = () => {
    clearMessages();
    navigate("/analise", { replace: true });
  };

  const handleToggleFavorite = async (content: string, messageId?: string) => {
    if (messageId && isFavorited(messageId)) {
      const favorite = getFavoriteByMessageId(messageId);
      if (favorite) {
        await removeFavorite(favorite.id);
      }
    } else {
      const title = "Análise: " + content.substring(0, 40) + (content.length > 40 ? "..." : "");
      await addFavorite(content, "analysis", title, messageId);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full min-h-0">
      {/* Header */}
      <ChatPageHeader
        title="Análise de Conversas"
        subtitle="Receba feedback profissional das suas conversas"
        icon={<SearchIcon />}
        iconBgClass="bg-primary/20"
        backPath="/"
        hasMessages={hasMessages}
        onNewConversation={handleNewAnalysis}
        newConversationLabel="Nova análise"
      />

      {/* Session Restored Indicator */}
      <SessionIndicator
        show={hasRestoredSession && messages.length > 0 && !conversationId}
        onClear={clearMessages}
        message="Análise anterior restaurada"
        className="mb-4 shrink-0"
      />

      {/* Persona Context Summary */}
      <PersonaSummary className="mb-4 shrink-0" />

      {/* Content */}
      <div className="flex-1 flex flex-col card-main rounded-2xl overflow-hidden min-h-0">
        {!hasMessages ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-4 overflow-y-auto">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <SearchIcon />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Analise suas conversas</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Cole sua conversa de vendas abaixo e receba uma análise detalhada com pontos fortes, 
              melhorias sugeridas e um score de desempenho.
            </p>
            <div className="w-full max-w-md space-y-3">
              <p className="text-xs text-muted-foreground font-medium text-left">💡 Clique para ver um exemplo:</p>
              <PromptSuggestions 
                suggestions={CONVERSATION_ANALYSIS_SUGGESTIONS} 
                onSelect={sendMessage} 
              />
              <div className="text-left mt-4">
                <p className="text-xs text-muted-foreground font-medium mb-2">Formato esperado:</p>
                <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground font-mono break-words">
                  <p>Vendedor: Olá! Tudo bem?</p>
                  <p>Cliente: Oi, tudo sim</p>
                  <p>Vendedor: Vi que você demonstrou interesse...</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((msg, i) => (
              <ChatMessage 
                key={i} 
                role={msg.role} 
                content={msg.content}
                messageId={msg.id}
                isFavorited={msg.id ? isFavorited(msg.id) : false}
                onToggleFavorite={handleToggleFavorite}
                showFavoriteButton={msg.role === "assistant"}
              />
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border shrink-0">
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            placeholder="Cole sua conversa de vendas aqui..."
          />
        </div>
      </div>
    </div>
  );
}

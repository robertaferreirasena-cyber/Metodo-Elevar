import { LightbulbIcon } from "@/components/icons";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { SessionIndicator } from "@/components/SessionIndicator";
import { PromptSuggestions, IDEAS_GENERATOR_SUGGESTIONS } from "@/components/PromptSuggestions";
import { useChat } from "@/hooks/useChat";
import { ChatPageHeader } from "@/components/ChatPageHeader";
import { useRef, useEffect } from "react";

export default function IdeasGenerator() {
  const { messages, isLoading, sendMessage, clearMessages, hasRestoredSession } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full">
      {/* Header */}
      <ChatPageHeader
        title="Gerador de Ideias"
        subtitle="Descubra ideias criativas para impulsionar suas vendas"
        icon={<LightbulbIcon />}
        iconBgClass="bg-yellow-500/20"
        backPath="/"
        hasMessages={messages.length > 0}
        onNewConversation={clearMessages}
      />

      {/* Session Restored Indicator */}
      <SessionIndicator
        show={hasRestoredSession && messages.length > 0}
        onClear={clearMessages}
        message="Conversa anterior restaurada"
        className="mb-4 shrink-0"
      />

      {/* Chat Area */}
      <div className="card-main rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-6 overflow-y-auto">
            <div className="space-y-3 mb-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <LightbulbIcon />
              </div>
              <h2 className="font-semibold text-foreground">Precisa de ideias criativas?</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Conte sobre seu negócio ou desafio e receba ideias inovadoras para suas campanhas e estratégias de marketing.
              </p>
            </div>
            <div className="w-full max-w-md">
              <p className="text-xs text-muted-foreground mb-3 font-medium">💡 Clique para começar:</p>
              <PromptSuggestions 
                suggestions={IDEAS_GENERATOR_SUGGESTIONS} 
                onSelect={sendMessage} 
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 space-y-4 min-h-0" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} role={msg.role} content={msg.content} />
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
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

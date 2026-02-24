import { RotateCcw } from "lucide-react";
import { SparklesIcon, TargetIcon, LightbulbIcon, TrendIcon, LightningIcon } from "@/components/icons";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { useRef, useEffect, ReactNode } from "react";

interface Feature {
  icon: ReactNode;
  text: string;
}

const features: Feature[] = [
  { icon: <TargetIcon />, text: "Estratégias completas de vendas personalizadas" },
  { icon: <LightbulbIcon />, text: "Gerador de ideias criativas instantâneas" },
  { icon: <TrendIcon />, text: "Scripts de vendas e personas detalhadas" },
  { icon: <LightningIcon />, text: "Planos de ação práticos e imediatos" },
];

const Index = () => {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const hasMessages = messages.length > 0;

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Gradient overlay effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-foreground/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-md mx-4 card-main rounded-2xl">
        <div className="p-8 flex flex-col gap-6">
          {/* Hero Section - Hidden when chat is active */}
          {!hasMessages && (
            <>
              {/* Header */}
              <div className="text-center space-y-4">
                {/* Icon */}
                <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center glow-pink">
                  <SparklesIcon />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gradient-primary">
                  IA Estrategista de Vendas
                </h1>

                {/* Description */}
                <p className="text-muted-foreground text-base">
                  Crie estratégias personalizadas para vender mais via WhatsApp
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg feature-card"
                  >
                    <div className="flex-shrink-0">{feature.icon}</div>
                    <p className="text-sm text-foreground/85">{feature.text}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Chat Section */}
          {hasMessages && (
            <div className="flex flex-col min-h-[300px] sm:min-h-[400px]">
              <div className="mb-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary glow-pink shrink-0">
                    <SparklesIcon />
                  </div>
                  <span className="font-semibold text-foreground">Estrategista IA</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMessages}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <RotateCcw className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nova conversa</span>
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[60vh] sm:max-h-[350px] min-h-0 space-y-4 pb-4" ref={scrollRef}>
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
            </div>
          )}

          {/* Input Section */}
          <div className="space-y-3">
            <ChatInput onSend={sendMessage} isLoading={isLoading} />
            {!hasMessages && (
              <p className="text-center text-xs text-muted-foreground">
                Descreva seu produto ou serviço para receber estratégias personalizadas
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Index;

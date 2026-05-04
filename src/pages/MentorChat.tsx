import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Bot, Send, Plus, Trash2, MessageCircle, Sparkles, ChevronLeft, Palette } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAIMentor } from "@/hooks/useAIMentor";
import ReactMarkdown from "react-markdown";

const PERSONAS = [
  { id: "mentora-gi", name: "Mentora Gi", icon: "👩‍🏫", desc: "Marketing digital e empreendedorismo" },
  { id: "estrategista", name: "Estrategista", icon: "📊", desc: "Vendas e conversão" },
  { id: "copywriter", name: "Copywriter", icon: "✍️", desc: "Textos que vendem" },
  { id: "instagram", name: "Instagram Expert", icon: "📸", desc: "Crescimento e engajamento" },
  { id: "diretor-criativo", name: "Diretor Criativo", icon: "🎬", desc: "Storytelling e narrativa cinematográfica" },
  { id: "gestor-trafego", name: "Gestor de Tráfego", icon: "📈", desc: "Estratégia de tráfego pago e métricas" },
  { id: "especialista-manychat", name: "Especialista ManyChat", icon: "🤖", desc: "Automação e fluxos de alta conversão" },
];

const SUGGESTIONS = [
  "Como criar um funil de vendas pelo Instagram?",
  "Me ajude a escrever uma bio para o Instagram",
  "Quais são os melhores gatilhos mentais para vendas?",
  "Como precificar meus produtos digitais?",
  "Crie uma sequência de stories que vende",
  "Como lidar com objeções de preço?",
];

export default function MentorChat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    conversations, currentConversationId, messages, isStreaming,
    persona, setPersona, loadingHistory,
    loadMessages, startNewConversation, sendMessage, deleteConversation,
  } = useAIMentor();

  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptProcessedRef = useRef(false);

  const handleGenerateCarousel = (topic: string) => {
    navigate(`/aprendizado?tab=carousel&topic=${encodeURIComponent(topic)}`);
  };

  // Handle pre-filled prompt from URL
  useEffect(() => {
    const promptParam = searchParams.get("prompt");
    if (promptParam && !promptProcessedRef.current) {
      promptProcessedRef.current = true;
      setInput(promptParam);
      // Clean URL
      setSearchParams({}, { replace: true });
      // Auto-focus the textarea
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentPersona = PERSONAS.find(p => p.id === persona) || PERSONAS[0];

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-6xl mx-auto">
      {/* Sidebar - Conversations */}
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col w-72 border-r border-border bg-muted/30 shrink-0`}>
        <div className="p-3 border-b border-border">
          <Button onClick={() => { startNewConversation(); setShowSidebar(false); }} className="w-full gap-2" size="sm">
            <Plus className="h-4 w-4" /> Nova Conversa
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${
                  conv.id === currentConversationId ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
                onClick={() => { loadMessages(conv.id); setShowSidebar(false); }}
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate flex-1">{conv.title || 'Sem título'}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma conversa ainda</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 border-b border-border">
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setShowSidebar(!showSidebar)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xl">{currentPersona.icon}</span>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{currentPersona.name}</h2>
              <p className="text-[10px] text-muted-foreground">{currentPersona.desc}</p>
            </div>
          </div>
          <Select value={persona} onValueChange={setPersona}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERSONAS.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex items-center gap-2">
                    <span>{p.icon}</span> {p.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="text-center space-y-2">
                <div className="text-5xl">{currentPersona.icon}</div>
                <h3 className="text-lg font-semibold text-foreground">Olá! Sou a {currentPersona.name} 👋</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Estou aqui para te ajudar com {currentPersona.desc.toLowerCase()}. Como posso te ajudar hoje?
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg w-full">
                {SUGGESTIONS.slice(0, 4).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                    className="text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-xs text-muted-foreground"
                  >
                    <Sparkles className="h-3 w-3 text-primary inline mr-1" />
                    {s}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 mt-2"
                onClick={() => navigate("/aprendizado?tab=carousel")}
              >
                <Palette className="h-4 w-4 text-primary" />
                Criar Carrossel Viral
              </Button>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                      {currentPersona.icon}
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                        {isStreaming && i === messages.length - 1 && (
                          <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5" />
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.content.length > 10 && (
                          <button
                            onClick={() => handleGenerateCarousel(msg.content)}
                            className="flex items-center gap-1 mt-2 text-[10px] text-primary hover:underline"
                          >
                            <Palette className="h-3 w-3" /> Gerar Carrossel com esse tema
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Pergunte algo para ${currentPersona.name}...`}
              className="min-h-[44px] max-h-32 resize-none text-sm"
              rows={1}
              disabled={isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="shrink-0 h-11 w-11"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            A Mentora Gi pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>
    </div>
  );
}

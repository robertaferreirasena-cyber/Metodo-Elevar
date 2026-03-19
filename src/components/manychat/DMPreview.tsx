import { useState } from "react";
import { ChevronLeft, ChevronRight, Phone, Video, Info, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlowNode, ParsedFlow } from "./flowParser";

interface DMPreviewProps {
  flow: ParsedFlow;
}

export default function DMPreview({ flow }: DMPreviewProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Filter only message and trigger nodes for DM preview
  const messageNodes = flow.nodes.filter(n => n.type === 'message' || n.type === 'trigger');

  if (messageNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Nenhuma mensagem para exibir
      </div>
    );
  }

  // Build conversation up to currentStep
  const visibleMessages = messageNodes.slice(0, currentStep + 1);

  return (
    <div className="flex flex-col items-center">
      {/* iPhone frame */}
      <div className="w-full max-w-[360px] bg-black rounded-[2.5rem] p-3 shadow-2xl">
        <div className="bg-background rounded-[2rem] overflow-hidden h-[600px] flex flex-col">
          {/* Status bar */}
          <div className="bg-background px-4 pt-3 pb-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 border border-muted-foreground rounded-sm relative">
                <div className="absolute inset-0.5 bg-emerald-500 rounded-[1px]" style={{ width: '70%' }} />
              </div>
            </div>
          </div>

          {/* Instagram DM Header */}
          <div className="px-3 py-2 flex items-center gap-3 border-b border-border">
            <ChevronLeft className="h-5 w-5 text-foreground" />
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 p-0.5">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <span className="text-[10px] font-bold">🤖</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {flow.name || 'Automação ManyChat'}
                </p>
                <p className="text-[10px] text-emerald-500">Ativo agora</p>
              </div>
            </div>
            <Phone className="h-4 w-4 text-foreground/70" />
            <Video className="h-4 w-4 text-foreground/70" />
            <Info className="h-4 w-4 text-foreground/70" />
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
            {/* Date divider */}
            <div className="flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground bg-muted px-3 py-0.5 rounded-full">Hoje</span>
            </div>

            {visibleMessages.map((node, i) => (
              <div key={node.id}>
                {/* Trigger shows as user action */}
                {node.type === 'trigger' ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-muted/50 rounded-lg px-3 py-1.5 max-w-[85%]">
                      <p className="text-[10px] text-muted-foreground text-center">
                        ⚡ {node.content || 'Usuário iniciou o fluxo'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Bot message - left aligned */}
                    <div className="flex items-end gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center">
                        <span className="text-[8px] text-white">🤖</span>
                      </div>
                      <div className="max-w-[75%]">
                        <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                          <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-line">
                            {node.content
                              ? (node.content.length > 200 ? node.content.slice(0, 200) + '...' : node.content)
                              : node.title}
                          </p>
                        </div>
                        {/* Delay indicator */}
                        {node.delay && (
                          <p className="text-[9px] text-muted-foreground mt-0.5 ml-1">
                            ⏱️ {node.delay}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Reply buttons */}
                    {node.buttons && node.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                        {node.buttons.map((btn, bi) => (
                          <button
                            key={bi}
                            className="px-3 py-1.5 rounded-full border border-blue-500 text-blue-500 text-[10px] font-medium hover:bg-blue-500/10 transition-colors"
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Simulate user response for next step (if there are buttons) */}
                    {node.buttons && node.buttons.length > 0 && i < visibleMessages.length - 1 && (
                      <div className="flex justify-end mt-2">
                        <div className="bg-blue-500 rounded-2xl rounded-br-md px-3 py-2 max-w-[70%]">
                          <p className="text-[11px] text-white">{node.buttons[0]}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Typing indicator if not at the end */}
            {currentStep < messageNodes.length - 1 && (
              <div className="flex items-end gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0" />
                <div className="bg-muted rounded-2xl px-4 py-2.5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '200ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="px-3 py-2 border-t border-border flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full px-3 py-2 text-[11px] text-muted-foreground">
              Mensagem...
            </div>
            <Send className="h-4 w-4 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Step navigation */}
      <div className="flex items-center gap-3 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="h-8 text-xs"
        >
          <ChevronLeft className="h-3 w-3 mr-1" /> Anterior
        </Button>
        <span className="text-xs text-muted-foreground">
          {currentStep + 1} / {messageNodes.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStep(Math.min(messageNodes.length - 1, currentStep + 1))}
          disabled={currentStep === messageNodes.length - 1}
          className="h-8 text-xs"
        >
          Próximo <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}

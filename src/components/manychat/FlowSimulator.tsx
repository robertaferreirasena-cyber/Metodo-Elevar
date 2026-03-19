import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitBranch, Smartphone, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import FlowNodeView from "./FlowNodeView";
import DMPreview from "./DMPreview";
import { parseFlowMarkdown, type ParsedFlow } from "./flowParser";

interface FlowSimulatorProps {
  markdownResult: string;
}

export default function FlowSimulator({ markdownResult }: FlowSimulatorProps) {
  const [activeView, setActiveView] = useState("nodes");
  const [copied, setCopied] = useState(false);

  const flow: ParsedFlow = useMemo(() => parseFlowMarkdown(markdownResult), [markdownResult]);

  const handleCopyAll = () => {
    navigator.clipboard.writeText(markdownResult);
    setCopied(true);
    toast.success("Fluxo completo copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!markdownResult) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
        <GitBranch className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm">Gere um fluxo primeiro para ver o simulador</p>
        <p className="text-xs mt-1">Use a aba "Criar Fluxo" para gerar seu fluxo ManyChat</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simulator header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Simulador ManyChat 2026
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Visualize seu fluxo como nodes conectados ou como conversa no Instagram DM
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopyAll} className="h-7 gap-1.5 text-xs">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copiado" : "Copiar Tudo"}
        </Button>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="w-full max-w-sm">
          <TabsTrigger value="nodes" className="flex-1 gap-1.5 text-xs">
            <GitBranch className="h-3.5 w-3.5" />
            Flow Builder
          </TabsTrigger>
          <TabsTrigger value="dm" className="flex-1 gap-1.5 text-xs">
            <Smartphone className="h-3.5 w-3.5" />
            Preview DM
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nodes">
          <ScrollArea className="h-[650px]">
            <div className="p-4">
              <FlowNodeView flow={flow} />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="dm">
          <ScrollArea className="h-[700px]">
            <div className="py-4">
              <DMPreview flow={flow} />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

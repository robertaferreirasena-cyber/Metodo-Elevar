import { MessageSquare, Zap, Clock, Tag, ArrowDown, Play, GitBranch, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import type { FlowNode, ParsedFlow } from "./flowParser";

const nodeStyles: Record<string, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
  trigger: { bg: "bg-purple-500/10", border: "border-purple-500/40", icon: <Play className="h-4 w-4 text-purple-500" />, label: "Trigger" },
  message: { bg: "bg-blue-500/10", border: "border-blue-500/40", icon: <MessageSquare className="h-4 w-4 text-blue-500" />, label: "Mensagem" },
  condition: { bg: "bg-amber-500/10", border: "border-amber-500/40", icon: <GitBranch className="h-4 w-4 text-amber-500" />, label: "Condição" },
  action: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", icon: <Tag className="h-4 w-4 text-emerald-500" />, label: "Ação" },
  delay: { bg: "bg-orange-500/10", border: "border-orange-500/40", icon: <Clock className="h-4 w-4 text-orange-500" />, label: "Delay" },
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted">
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
    </button>
  );
}

function NodeCard({ node, isLast }: { node: FlowNode; isLast: boolean }) {
  const style = nodeStyles[node.type] || nodeStyles.message;

  return (
    <div className="flex flex-col items-center">
      <div className={`group w-full max-w-md rounded-xl border-2 ${style.border} ${style.bg} p-4 relative shadow-sm hover:shadow-md transition-shadow`}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${style.bg}`}>
            {style.icon}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{style.label}</span>
            <p className="text-xs font-bold text-foreground truncate">{node.title}</p>
          </div>
          {node.content && <CopyButton text={node.content} label={node.title} />}
        </div>

        {/* Content */}
        {node.content && (
          <div className="bg-background/60 rounded-lg p-3 text-xs text-foreground/90 leading-relaxed whitespace-pre-line border border-border/50">
            {node.content.length > 300 ? node.content.slice(0, 300) + '...' : node.content}
          </div>
        )}

        {/* Buttons / Quick Replies */}
        {node.buttons && node.buttons.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Quick Replies</span>
            <div className="flex flex-wrap gap-1.5">
              {node.buttons.map((btn, i) => (
                <button key={i} className="px-3 py-1.5 rounded-full border border-blue-400/50 bg-blue-500/10 text-[11px] font-medium text-blue-600 hover:bg-blue-500/20 transition-colors">
                  {btn}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {node.tags && node.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {node.tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-300">
                <Tag className="h-2.5 w-2.5 mr-1" />{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Delay indicator */}
        {node.delay && node.type === 'message' && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-orange-600">
            <Clock className="h-3 w-3" />
            Delay: {node.delay}
          </div>
        )}

        {/* Action */}
        {node.action && node.type === 'message' && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600">
            <Zap className="h-3 w-3" />
            {node.action}
          </div>
        )}
      </div>

      {/* Connector arrow */}
      {!isLast && (
        <div className="flex flex-col items-center py-1">
          <div className="w-0.5 h-5 bg-gradient-to-b from-muted-foreground/40 to-muted-foreground/20" />
          <ArrowDown className="h-4 w-4 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

interface FlowNodeViewProps {
  flow: ParsedFlow;
}

export default function FlowNodeView({ flow }: FlowNodeViewProps) {
  if (!flow.nodes.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
        <GitBranch className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm">Nenhum node encontrado no fluxo</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Flow header info */}
      {flow.name && (
        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Play className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-bold text-foreground">{flow.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
            {flow.objective && <div>🎯 {flow.objective}</div>}
            {flow.steps > 0 && <div>📊 {flow.steps} etapas</div>}
            {flow.estimatedTime && <div>⏱️ {flow.estimatedTime}</div>}
            {flow.trigger && <div>⚡ {flow.trigger}</div>}
          </div>
        </div>
      )}

      {/* Flow nodes */}
      <div className="flex flex-col items-center space-y-0">
        {flow.nodes.map((node, i) => (
          <NodeCard key={node.id} node={node} isLast={i === flow.nodes.length - 1} />
        ))}
      </div>

      {/* A/B Test */}
      {(flow.abTestA || flow.abTestB) && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h4 className="text-xs font-bold text-amber-600 flex items-center gap-1.5 mb-2">
            <GitBranch className="h-3.5 w-3.5" /> Teste A/B
          </h4>
          {flow.abTestA && <p className="text-[11px] text-foreground/80 mb-1">🅰️ {flow.abTestA}</p>}
          {flow.abTestB && <p className="text-[11px] text-foreground/80">🅱️ {flow.abTestB}</p>}
        </div>
      )}

      {/* KPIs */}
      {flow.kpis && flow.kpis.length > 0 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <h4 className="text-xs font-bold text-emerald-600 mb-2">📊 KPIs Sugeridos</h4>
          <div className="space-y-1">
            {flow.kpis.map((kpi, i) => (
              <p key={i} className="text-[11px] text-foreground/80">• {kpi}</p>
            ))}
          </div>
        </div>
      )}

      {/* Technical Config */}
      {flow.technicalConfig && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <h4 className="text-xs font-bold text-foreground mb-3">⚙️ Configurações Técnicas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {flow.technicalConfig.tags.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Tags</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {flow.technicalConfig.tags.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-[9px]">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
            {flow.technicalConfig.customFields.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Custom Fields</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {flow.technicalConfig.customFields.map((cf, i) => (
                    <Badge key={i} variant="secondary" className="text-[9px]">{cf}</Badge>
                  ))}
                </div>
              </div>
            )}
            {flow.technicalConfig.conditions.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Condições</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {flow.technicalConfig.conditions.map((c, i) => (
                    <Badge key={i} variant="outline" className="text-[9px] bg-amber-500/10">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

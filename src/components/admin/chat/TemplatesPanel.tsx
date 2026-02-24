import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Wand2 } from "lucide-react";

interface TemplatesPanelProps {
  open: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  onAdapt: (text: string) => void;
}

const templates = [
  { category: "Lançamento", items: [
    { title: "Antecipação", text: "🔥 Algo grande está chegando...\n\nNos próximos dias eu vou revelar [O QUE]. Se você quer [BENEFÍCIO], fica ligado(a) aqui.\n\nResponde com 🚀 pra eu te avisar em primeira mão!" },
    { title: "Abertura de vagas", text: "📢 As vagas para [PRODUTO] acabam de abrir!\n\nSão apenas [X] vagas com condição especial.\n\n✅ [BENEFÍCIO 1]\n✅ [BENEFÍCIO 2]\n✅ [BENEFÍCIO 3]\n\n👉 Garanta a sua: [LINK]" },
  ]},
  { category: "Engajamento", items: [
    { title: "Enquete", text: "Me conta: qual desses é seu maior desafio hoje?\n\n1️⃣ [OPÇÃO 1]\n2️⃣ [OPÇÃO 2]\n3️⃣ [OPÇÃO 3]\n\nResponde com o número! 👇" },
    { title: "Conteúdo de valor", text: "💡 Dica rápida sobre [TEMA]:\n\n[DICA]\n\nIsso funciona porque [EXPLICAÇÃO].\n\nSalva essa mensagem pra não esquecer! ⭐" },
  ]},
  { category: "Oferta", items: [
    { title: "Flash sale", text: "⚡ OFERTA RELÂMPAGO ⚡\n\nSó hoje: [PRODUTO] com [X]% de desconto!\n\nDe R$[VALOR_CHEIO] por apenas R$[VALOR_DESC]\n\n⏰ Válido até meia-noite!\n\n👉 [LINK]" },
    { title: "Bônus exclusivo", text: "🎁 Surpresa pra quem está aqui!\n\nQuem fechar [PRODUTO] hoje ganha:\n\n🎯 Bônus 1: [DESC]\n🎯 Bônus 2: [DESC]\n🎯 Bônus 3: [DESC]\n\nIsso vale mais de R$[VALOR]. Aproveite!" },
  ]},
  { category: "Recuperação", items: [
    { title: "Carrinho abandonado", text: "Ei [NOME]! 👋\n\nVi que você ficou interessado(a) em [PRODUTO] mas não finalizou.\n\nTem alguma dúvida? Posso te ajudar!" },
    { title: "Reengajamento", text: "Oi [NOME]! Faz um tempo que não te vejo por aqui. 😊\n\nTenho uma novidade exclusiva pra você: [OFERTA]\n\nPosso te contar mais?" },
  ]},
];

export function TemplatesPanel({ open, onClose, onSend, onAdapt }: TemplatesPanelProps) {
  if (!open) return null;

  return (
    <div className="w-80 border-l border-border bg-card/50 flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-xs font-semibold">📋 Templates</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-3 w-3" /></Button>
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        {templates.map(cat => (
          <div key={cat.category} className="mb-4">
            <p className="text-[10px] font-bold text-primary uppercase mb-1.5">{cat.category}</p>
            {cat.items.map(item => (
              <div key={item.title} className="border border-border rounded-md p-2 mb-1.5 bg-background">
                <p className="text-[11px] font-medium mb-1">{item.title}</p>
                <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed whitespace-pre-wrap">{item.text.slice(0, 100)}...</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1" onClick={() => onSend(item.text)}>
                    <Send className="h-2.5 w-2.5 mr-1" /> Enviar
                  </Button>
                  <Button variant="secondary" size="sm" className="h-6 text-[10px] flex-1" onClick={() => onAdapt(item.text)}>
                    <Wand2 className="h-2.5 w-2.5 mr-1" /> Adaptar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}

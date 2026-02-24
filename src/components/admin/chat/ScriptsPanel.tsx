import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Wand2 } from "lucide-react";

interface ScriptsPanelProps {
  open: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  onAdapt: (text: string) => void;
}

const scripts = [
  { category: "Prospecção", items: [
    { title: "Primeiro contato", text: "Oi [NOME]! Vi que você se interessa por [TEMA]. Tenho algo que pode te ajudar muito. Posso te contar mais?" },
    { title: "Reativação", text: "Oi [NOME], tudo bem? Faz um tempo que conversamos. Tenho novidades que podem te interessar! Posso compartilhar?" },
    { title: "Indicação", text: "Oi [NOME]! O(a) [INDICADOR] me falou de você. Disse que você poderia se beneficiar com [SOLUÇÃO]. Posso explicar?" },
  ]},
  { category: "Qualificação", items: [
    { title: "Descoberta de dor", text: "Me conta, qual o maior desafio que você enfrenta hoje com [ÁREA]? Quero entender melhor pra ver como posso ajudar." },
    { title: "Orçamento", text: "Pra eu te indicar a melhor opção, quanto você costuma investir em [ÁREA] por mês?" },
    { title: "Urgência", text: "Numa escala de 1 a 10, quão urgente é resolver [PROBLEMA] pra você agora?" },
  ]},
  { category: "Fechamento", items: [
    { title: "Escassez", text: "Só pra você saber, restam apenas [X] vagas com essa condição especial. Quer garantir a sua?" },
    { title: "Garantia", text: "Você tem [X] dias de garantia incondicional. Se não gostar, devolvo seu investimento. Sem burocracia." },
    { title: "Ancoragem", text: "O valor normal é R$[VALOR_CHEIO], mas pra você que está decidindo agora, consigo por R$[VALOR_DESCONTO]." },
  ]},
  { category: "Pós-venda", items: [
    { title: "Boas-vindas", text: "Seja muito bem-vindo(a)! 🎉 Fico feliz que tenha decidido [AÇÃO]. Qualquer dúvida, estou aqui!" },
    { title: "Follow-up", text: "Oi [NOME]! Como está sendo sua experiência com [PRODUTO]? Tem algo que posso ajudar?" },
    { title: "Depoimento", text: "Oi [NOME]! Vi que você está tendo ótimos resultados. Seria possível me enviar um depoimento rápido?" },
  ]},
];

export function ScriptsPanel({ open, onClose, onSend, onAdapt }: ScriptsPanelProps) {
  if (!open) return null;

  return (
    <div className="w-80 border-l border-border bg-card/50 flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-xs font-semibold">📝 Scripts Prontos</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-3 w-3" /></Button>
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        {scripts.map(cat => (
          <div key={cat.category} className="mb-4">
            <p className="text-[10px] font-bold text-primary uppercase mb-1.5">{cat.category}</p>
            {cat.items.map(item => (
              <div key={item.title} className="border border-border rounded-md p-2 mb-1.5 bg-background">
                <p className="text-[11px] font-medium mb-1">{item.title}</p>
                <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed">{item.text}</p>
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

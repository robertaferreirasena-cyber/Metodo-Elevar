import React from "react";
import { 
  FileText, Wand2, Move, LayoutGrid, Palette, Image as ImageIcon, 
  MousePointer2, Download, Layers, Sparkles 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CarouselDocumentation() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary transition-colors">
          <FileText className="h-4 w-4" />
          <span className="hidden md:inline">Documentação V2.0</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-primary fill-primary/20" />
            PostStudio V2.0 - Guia de Engenharia
          </DialogTitle>
          <DialogDescription>
            Tudo o que você precisa saber para criar carrosséis de alta conversão.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList className="w-full justify-start h-12 bg-transparent gap-6 p-0">
              <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Visão Geral</TabsTrigger>
              <TabsTrigger value="ai" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">IA & Copywriting</TabsTrigger>
              <TabsTrigger value="editor" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Editor Livre</TabsTrigger>
              <TabsTrigger value="export" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Exportação</TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-1 p-6">
            <TabsContent value="overview" className="mt-0 space-y-6">
              <section>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-primary" /> O que há de novo na V2.0?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  A versão 2.0 foi reconstruída para oferecer o equilíbrio perfeito entre automação inteligente e controle criativo total. Removemos templates redundantes para focar em estruturas que realmente convertem e implementamos uma nova engine de renderização que evita sobreposição de textos.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex gap-2 text-sm">
                    <span className="text-primary font-bold">•</span>
                    <span><b>Lógica de Fluxo Fluido:</b> Posicionamento inteligente que se adapta ao tamanho do seu texto.</span>
                  </li>
                  <li className="flex gap-2 text-sm">
                    <span className="text-primary font-bold">•</span>
                    <span><b>Modo de Edição Livre:</b> Arraste e redimensione qualquer elemento com precisão milimétrica.</span>
                  </li>
                  <li className="flex gap-2 text-sm">
                    <span className="text-primary font-bold">•</span>
                    <span><b>Engenharia Reversa de Copy:</b> Integração dos frameworks PAS e Marie Forleo.</span>
                  </li>
                </ul>
              </section>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <h4 className="font-bold mb-1 flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-primary" /> Inteligência
                  </h4>
                  <p className="text-xs text-muted-foreground italic">Geração de conteúdo humanizado focado em nichos específicos.</p>
                </div>
                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                  <h4 className="font-bold mb-1 flex items-center gap-2">
                    <Move className="h-4 w-4 text-orange-500" /> Liberdade
                  </h4>
                  <p className="text-xs text-muted-foreground italic">Controle total sobre o layout, assim como no Canva, mas mais rápido.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="mt-0 space-y-6">
              <section>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Estrutura de Copy Humanizada
                </h3>
                <p className="text-muted-foreground mb-4">
                  Nossa IA não apenas gera texto; ela constrói narrativas baseadas em frameworks psicológicos de venda:
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-bold text-primary mb-1">PAS Framework (Problem, Agitation, Solution)</h4>
                    <p className="text-sm text-muted-foreground">Utilizado nos slides para capturar a atenção através da dor do cliente e guiar até a solução transformadora.</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-bold text-orange-500 mb-1">Framework Marie Forleo (Legendas)</h4>
                    <p className="text-sm text-muted-foreground">As legendas são escritas com tom empático ("tom de amiga"), garantindo que o seguidor sinta uma conexão real antes da chamada para ação.</p>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="editor" className="mt-0 space-y-6">
              <section>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <MousePointer2 className="h-5 w-5 text-primary" /> Dominando o Editor Livre
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">1</div>
                    <div>
                      <h4 className="font-bold">Ativar Modo Livre</h4>
                      <p className="text-sm text-muted-foreground">Clique no botão "Ativar Edição Livre" no topo. Isso desbloqueará as caixas de texto para movimentação.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">2</div>
                    <div>
                      <h4 className="font-bold">Arrastar e Dimensionar</h4>
                      <p className="text-sm text-muted-foreground">Clique nas caixas pontilhadas para mover. Use as alças nos cantos para alterar o tamanho da área de texto.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">3</div>
                    <div>
                      <h4 className="font-bold">Guia Magnético</h4>
                      <p className="text-sm text-muted-foreground">Linhas roxas aparecerão para ajudar você a centralizar os elementos perfeitamente no canvas.</p>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="export" className="mt-0 space-y-6">
              <section>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" /> Exportação de Alta Fidelidade
                </h3>
                <p className="text-muted-foreground">
                  Nossa engine de exportação agora processa os slides em background para garantir que as fontes premium e imagens em HD sejam capturadas sem erros.
                </p>
                <div className="mt-4 p-4 bg-muted rounded-lg border border-dashed">
                  <h4 className="font-bold mb-2 flex items-center gap-2 text-sm">
                    <Layers className="h-4 w-4" /> Dica de Especialista
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Para carrosséis com muitas imagens, aguarde o indicador de progresso completar 100%. O sistema gera um arquivo .ZIP compacto pronto para o Instagram.
                  </p>
                </div>
              </section>
            </TabsContent>
          </ScrollArea>
          
          <div className="p-6 border-t bg-muted/30 flex justify-between items-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">PostStudio V2.0 • 2024</p>
            <Button size="sm" onClick={() => (document.querySelector('[data-state="closed"]') as any)?.click()}>Entendi!</Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

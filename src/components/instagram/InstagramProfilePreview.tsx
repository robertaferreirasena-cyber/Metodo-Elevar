import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Grid3X3, TrendingUp, Image, Film, Layers, Palette, FileText, FileDown } from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export interface InstaProfile {
  username_sugestoes: string[];
  nome_perfil: string;
  categoria: string;
  bio_lines: string[];
  link_sugerido: string;
  destaques: { nome: string; emoji: string }[];
  destaques_detalhados?: {
    nome: string;
    emoji: string;
    conteudo_sugerido: string;
    estrutura: string;
    motivo: string;
  }[];
  posts_sugeridos: { tipo: string; fase?: string; titulo: string; descricao: string; legenda: string }[];
  estrategia: {
    pilares: string[];
    frequencia: string;
    horarios: string[];
    dicas_crescimento: string[];
  };
}

interface Props {
  profile: InstaProfile;
  onRegenerate: () => void;
  onCreateContent?: (post: InstaProfile["posts_sugeridos"][0]) => void;
}

const FASE_COLORS: Record<string, string> = {
  "atração": "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  "retenção": "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  "conversão": "bg-amber-500/20 text-amber-700 dark:text-amber-300",
};

const POST_ICONS: Record<string, typeof Layers> = {
  carrossel: Layers,
  reels: Film,
  stories: Image,
};

export default function InstagramProfilePreview({ profile, onRegenerate, onCreateContent }: Props) {
  const [selectedPost, setSelectedPost] = useState<typeof profile.posts_sugeridos[0] | null>(null);
  const [selectedUsername, setSelectedUsername] = useState(0);
  const [exportingPdf, setExportingPdf] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const username = profile.username_sugestoes[selectedUsername] || "@username";
  const bio = profile.bio_lines.join("\n");

  const copyBio = () => {
    navigator.clipboard.writeText(bio);
    toast.success("Bio copiada!");
  };

  const exportImage = async () => {
    if (!previewRef.current) return;
    try {
      // Force full dimensions capture
      const el = previewRef.current;
      const originalOverflow = el.style.overflow;
      const originalHeight = el.style.height;
      el.style.overflow = "visible";
      el.style.height = "auto";
      
      const url = await toPng(el, { 
        backgroundColor: "#ffffff",
        pixelRatio: 3,
        width: el.scrollWidth,
        height: el.scrollHeight,
        style: {
          overflow: "visible",
          height: "auto",
        }
      });
      
      el.style.overflow = originalOverflow;
      el.style.height = originalHeight;
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `perfil-instagram-${username.replace("@", "")}.png`;
      a.click();
      toast.success("Imagem exportada!");
    } catch {
      toast.error("Erro ao exportar imagem");
    }
  };

  // Remove emojis that jsPDF can't render
  const sanitize = (text: string): string => {
    return text.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]|[\u{D800}-\u{DFFF}]/gu, "").replace(/\s+/g, " ").trim();
  };

  const exportPdf = async () => {
    setExportingPdf(true);
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const W = 297, H = 210;
      const margin = 15;
      const contentW = W - margin * 2;

      // Brand colors
      const PRIMARY = [139, 92, 246]; // purple
      const DARK = [30, 30, 46];
      const GRAY = [107, 114, 128];
      const LIGHT_BG = [248, 247, 255];

      // Helper functions
      const drawHeader = (text: string, y: number) => {
        pdf.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
        pdf.roundedRect(margin - 2, y - 6, contentW + 4, 12, 3, 3, "F");
        pdf.setFontSize(16);
        pdf.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
        pdf.setFont("helvetica", "bold");
        pdf.text(text, margin, y);
        pdf.setFont("helvetica", "normal");
        return y + 14;
      };

      const drawSubtitle = (text: string, y: number) => {
        pdf.setFontSize(11);
        pdf.setTextColor(DARK[0], DARK[1], DARK[2]);
        pdf.setFont("helvetica", "bold");
        pdf.text(sanitize(text), margin, y);
        pdf.setFont("helvetica", "normal");
        return y + 6;
      };

      const drawBody = (text: string, y: number, maxW = contentW) => {
        pdf.setFontSize(9);
        pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        const lines = pdf.splitTextToSize(sanitize(text), maxW);
        pdf.text(lines, margin, y);
        return y + lines.length * 4.5;
      };

      const checkPage = (y: number, needed = 30) => {
        if (y > H - needed) { pdf.addPage(); return margin + 5; }
        return y;
      };

      // === PAGE 1: Profile Overview ===
      // Top bar
      pdf.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      pdf.rect(0, 0, W, 8, "F");

      let y = 20;
      pdf.setFontSize(20);
      pdf.setTextColor(DARK[0], DARK[1], DARK[2]);
      pdf.setFont("helvetica", "bold");
      pdf.text(sanitize(`Perfil Instagram - ${profile.nome_perfil}`), margin, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      pdf.setFont("helvetica", "normal");
      pdf.text(`@${sanitize(username)}  |  ${sanitize(profile.categoria)}`, margin, y);
      y += 12;

      // Divider
      pdf.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, W - margin, y);
      y += 8;

      y = drawSubtitle("Bio", y);
      y = drawBody(bio, y);
      y += 5;

      y = drawSubtitle("Link sugerido", y);
      y = drawBody(profile.link_sugerido, y);
      y += 5;

      y = drawSubtitle("Usernames sugeridos", y);
      y = drawBody(profile.username_sugestoes.join("  |  "), y);
      y += 5;

      y = drawSubtitle("Destaques", y);
      const destaquesText = profile.destaques.map(d => sanitize(`${d.emoji} ${d.nome}`)).join("  |  ");
      y = drawBody(destaquesText, y);

      // === PAGE 2: Destaques Detalhados ===
      if (profile.destaques_detalhados?.length) {
        pdf.addPage();
        pdf.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
        pdf.rect(0, 0, W, 8, "F");
        y = 20;
        y = drawHeader("Documento de Destaques - Estrategia Detalhada", y);

        for (const dest of profile.destaques_detalhados) {
          y = checkPage(y, 40);
          y = drawSubtitle(sanitize(`${dest.emoji} ${dest.nome}`), y);
          y = drawBody(`Conteudo: ${dest.conteudo_sugerido}`, y);
          y = drawBody(`Estrutura: ${dest.estrutura}`, y);
          
          // Highlight strategic reason
          pdf.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
          const motivo = sanitize(`Motivo estrategico: ${dest.motivo}`);
          const mLines = pdf.splitTextToSize(motivo, contentW - 6);
          pdf.roundedRect(margin - 1, y - 3, contentW + 2, mLines.length * 4.5 + 4, 2, 2, "F");
          pdf.setFontSize(9);
          pdf.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
          pdf.text(mLines, margin + 2, y);
          y += mLines.length * 4.5 + 8;
        }
      }

      // === PAGE 3: Strategy ===
      pdf.addPage();
      pdf.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      pdf.rect(0, 0, W, 8, "F");
      y = 20;
      y = drawHeader("Estrategia de Conteudo", y);

      y = drawSubtitle("Pilares de Conteudo", y);
      for (const p of profile.estrategia.pilares) {
        y = drawBody(`  - ${p}`, y);
      }
      y += 5;

      y = drawSubtitle("Frequencia", y);
      y = drawBody(profile.estrategia.frequencia, y);
      y += 5;

      y = drawSubtitle("Melhores Horarios", y);
      y = drawBody(profile.estrategia.horarios.join("  |  "), y);
      y += 5;

      y = drawSubtitle("Dicas de Crescimento", y);
      for (const d of profile.estrategia.dicas_crescimento) {
        y = checkPage(y);
        y = drawBody(`  - ${d}`, y);
      }

      // === PAGE 4+: Posts ===
      const fases = ["atração", "retenção", "conversão"];
      const faseLabels: Record<string, string> = { "atração": "Atracao", "retenção": "Retencao", "conversão": "Conversao" };
      const faseColors: Record<string, number[]> = {
        "atração": [16, 185, 129],
        "retenção": [59, 130, 246],
        "conversão": [245, 158, 11],
      };

      for (const fase of fases) {
        const postsInFase = profile.posts_sugeridos.filter(p => p.fase === fase);
        if (!postsInFase.length) continue;

        pdf.addPage();
        const fc = faseColors[fase] || PRIMARY;
        pdf.setFillColor(fc[0], fc[1], fc[2]);
        pdf.rect(0, 0, W, 8, "F");
        y = 20;
        y = drawHeader(`Posts de ${faseLabels[fase] || fase}`, y);

        for (const post of postsInFase) {
          y = checkPage(y, 50);
          y = drawSubtitle(`[${post.tipo.toUpperCase()}] ${sanitize(post.titulo)}`, y);
          y = drawBody(post.descricao, y);
          y += 2;
          pdf.setFontSize(8);
          pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
          pdf.setFont("helvetica", "italic");
          pdf.text("Legenda:", margin, y);
          pdf.setFont("helvetica", "normal");
          y += 4;
          y = drawBody(post.legenda, y, contentW - 5);
          y += 8;
        }
      }

      // Footer on last page
      pdf.setFontSize(7);
      pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      pdf.text("Gerado por Mentora IA - Metodo Elevar", margin, H - 5);

      pdf.save(`perfil-instagram-${sanitize(username).replace("@", "")}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Erro ao exportar PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={copyBio} className="gap-1">
          <Copy className="h-3 w-3" /> Copiar Bio
        </Button>
        <Button size="sm" variant="outline" onClick={exportImage} className="gap-1">
          <Download className="h-3 w-3" /> Exportar Imagem
        </Button>
        <Button size="sm" variant="outline" onClick={exportPdf} disabled={exportingPdf} className="gap-1">
          <FileDown className="h-3 w-3" /> {exportingPdf ? "Gerando..." : "Exportar PDF"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onRegenerate}>
          Regenerar
        </Button>
      </div>

      {/* Username selector */}
      <div className="flex flex-wrap gap-2">
        {profile.username_sugestoes.map((u, i) => (
          <Badge
            key={i}
            variant={i === selectedUsername ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedUsername(i)}
          >
            {u}
          </Badge>
        ))}
      </div>

      {/* Instagram Preview */}
      <div ref={previewRef} className="mx-auto max-w-[375px] rounded-2xl border bg-white text-black overflow-hidden shadow-lg">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-[3px] shrink-0">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-2xl">
                {profile.nome_perfil.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 flex justify-around text-center">
              {[
                { n: profile.posts_sugeridos.length, l: "posts" },
                { n: "—", l: "seguidores" },
                { n: "—", l: "seguindo" },
              ].map(s => (
                <div key={s.l}>
                  <div className="font-bold text-sm">{s.n}</div>
                  <div className="text-[10px] text-gray-500">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <p className="font-bold text-sm">{profile.nome_perfil}</p>
            <p className="text-[11px] text-gray-400">{profile.categoria}</p>
            <p className="text-xs mt-1 whitespace-pre-line leading-relaxed">{bio}</p>
            <p className="text-xs text-blue-600 mt-1">{profile.link_sugerido}</p>
          </div>

          <div className="flex gap-2 mt-3">
            <button className="flex-1 bg-blue-500 text-white text-xs font-semibold py-1.5 rounded-lg">Seguir</button>
            <button className="flex-1 border border-gray-300 text-xs font-semibold py-1.5 rounded-lg">Mensagem</button>
          </div>
        </div>

        {/* Highlights */}
        <div className="flex gap-4 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {profile.destaques.map((d, i) => (
            <div key={i} className="flex flex-col items-center shrink-0">
              <div className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl bg-gray-50">
                {d.emoji}
              </div>
              <span className="text-[10px] mt-1 text-gray-600 max-w-[56px] truncate">{d.nome}</span>
            </div>
          ))}
        </div>

        {/* Tabs & Grid */}
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="w-full rounded-none border-t border-b bg-white h-10">
            <TabsTrigger value="grid" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none bg-transparent text-black">
              <Grid3X3 className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="destaques" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none bg-transparent text-black">
              <FileText className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none bg-transparent text-black">
              <TrendingUp className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="mt-0">
            <div className="grid grid-cols-3 gap-[2px]">
              {profile.posts_sugeridos.map((post, i) => {
                const Icon = POST_ICONS[post.tipo] || Layers;
                const faseColor = post.fase ? FASE_COLORS[post.fase] || "bg-gray-100" : "bg-gray-100";
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedPost(post)}
                    className={`aspect-square flex flex-col items-center justify-center gap-1 ${faseColor} hover:opacity-80 transition-opacity relative`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[9px] font-medium px-1 text-center line-clamp-2 leading-tight">{post.titulo}</span>
                    {post.fase && (
                      <span className="absolute top-1 right-1 text-[7px] font-bold uppercase opacity-60">
                        {post.fase === "atração" ? "ATR" : post.fase === "retenção" ? "RET" : "CONV"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Legenda do grid */}
            <div className="flex justify-center gap-3 py-2 bg-gray-50">
              {[
                { label: "Atração", color: "bg-emerald-400" },
                { label: "Retenção", color: "bg-blue-400" },
                { label: "Conversão", color: "bg-amber-400" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${l.color}`} />
                  <span className="text-[9px] text-gray-500">{l.label}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="destaques" className="mt-0 p-4 space-y-3 bg-gray-50 max-h-[400px] overflow-y-auto">
            {profile.destaques_detalhados?.length ? (
              profile.destaques_detalhados.map((dest, i) => (
                <div key={i} className="bg-white rounded-lg p-3 border space-y-1.5">
                  <p className="text-sm font-bold text-gray-800">{dest.emoji} {dest.nome}</p>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Conteúdo sugerido</p>
                    <p className="text-xs text-gray-600">{dest.conteudo_sugerido}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Estrutura</p>
                    <p className="text-xs text-gray-600">{dest.estrutura}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-blue-400 uppercase">Motivo estratégico</p>
                    <p className="text-xs text-blue-700">{dest.motivo}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-gray-400">Destaques detalhados não disponíveis para este perfil.</p>
                <p className="text-[10px] text-gray-300 mt-1">Regenere o perfil para obter o documento completo.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="strategy" className="mt-0 p-4 space-y-3 bg-gray-50">
            <div>
              <p className="text-xs font-bold text-gray-700 mb-1">📌 Pilares de Conteúdo</p>
              <div className="flex flex-wrap gap-1">
                {profile.estrategia.pilares.map((p, i) => (
                  <span key={i} className="text-[10px] bg-white border rounded-full px-2 py-0.5">{p}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 mb-1">📅 Frequência</p>
              <p className="text-xs text-gray-600">{profile.estrategia.frequencia}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 mb-1">⏰ Melhores Horários</p>
              <div className="flex gap-1">
                {profile.estrategia.horarios.map((h, i) => (
                  <span key={i} className="text-[10px] bg-white border rounded-full px-2 py-0.5">{h}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 mb-1">🚀 Dicas de Crescimento</p>
              <ul className="space-y-1">
                {profile.estrategia.dicas_crescimento.map((d, i) => (
                  <li key={i} className="text-[10px] text-gray-600">• {d}</li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Post detail modal */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {selectedPost && (() => { const Icon = POST_ICONS[selectedPost.tipo] || Layers; return <Icon className="h-4 w-4" />; })()}
              {selectedPost?.titulo}
            </DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs capitalize">{selectedPost.tipo}</Badge>
                {selectedPost.fase && (
                  <Badge variant="outline" className={`text-xs capitalize ${FASE_COLORS[selectedPost.fase] || ""}`}>
                    {selectedPost.fase}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{selectedPost.descricao}</p>
              <div>
                <p className="text-xs font-medium mb-1">Legenda sugerida:</p>
                <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded-md font-sans">{selectedPost.legenda}</pre>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPost.legenda);
                    toast.success("Legenda copiada!");
                  }}
                >
                  <Copy className="h-3 w-3" /> Copiar Legenda
                </Button>
                {selectedPost.tipo === "carrossel" && onCreateContent && (
                  <Button
                    size="sm"
                    className="w-full gap-1"
                    onClick={() => {
                      onCreateContent(selectedPost);
                      setSelectedPost(null);
                    }}
                  >
                    <Palette className="h-3 w-3" /> Criar no Carrossel
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

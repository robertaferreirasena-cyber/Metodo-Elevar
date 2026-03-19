import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Grid3X3, TrendingUp, Image, Film, Layers, Palette } from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";

export interface InstaProfile {
  username_sugestoes: string[];
  nome_perfil: string;
  categoria: string;
  bio_lines: string[];
  link_sugerido: string;
  destaques: { nome: string; emoji: string }[];
  posts_sugeridos: { tipo: string; titulo: string; descricao: string; legenda: string }[];
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

const POST_COLORS: Record<string, string> = {
  carrossel: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  reels: "bg-pink-500/20 text-pink-700 dark:text-pink-300",
  stories: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
};

const POST_ICONS: Record<string, typeof Layers> = {
  carrossel: Layers,
  reels: Film,
  stories: Image,
};

export default function InstagramProfilePreview({ profile, onRegenerate, onCreateContent }: Props) {
  const [selectedPost, setSelectedPost] = useState<typeof profile.posts_sugeridos[0] | null>(null);
  const [selectedUsername, setSelectedUsername] = useState(0);
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
      const url = await toPng(previewRef.current, { backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = url;
      a.download = "perfil-instagram.png";
      a.click();
      toast.success("Imagem exportada!");
    } catch {
      toast.error("Erro ao exportar imagem");
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
            <TabsTrigger value="strategy" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none bg-transparent text-black">
              <TrendingUp className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="mt-0">
            <div className="grid grid-cols-3 gap-[2px]">
              {profile.posts_sugeridos.map((post, i) => {
                const Icon = POST_ICONS[post.tipo] || Layers;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedPost(post)}
                    className={`aspect-square flex flex-col items-center justify-center gap-1 ${POST_COLORS[post.tipo] || "bg-gray-100"} hover:opacity-80 transition-opacity`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[9px] font-medium px-1 text-center line-clamp-2 leading-tight">{post.titulo}</span>
                  </button>
                );
              })}
            </div>
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
              <Badge variant="secondary" className="text-xs capitalize">{selectedPost.tipo}</Badge>
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

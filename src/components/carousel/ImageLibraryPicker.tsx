import { useState } from "react";
import { Search, Loader2, ImagePlus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageItem {
  id: string;
  url: string;
  thumbUrl: string;
  author: string;
  authorUrl?: string;
  sourceUrl: string;
  source: "unsplash" | "pexels";
  alt?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Aspect ratio hint passed to the API for better orientation matching */
  orientation?: "1:1" | "9:16" | "16:9";
  /** Suggested initial query (e.g., from carousel topic) */
  suggestedQuery?: string;
  /** Called with a data URL ready to drop into a slide */
  onSelect: (dataUrl: string, attribution: string) => void;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-library-search`;

export default function ImageLibraryPicker({
  open, onOpenChange, orientation = "1:1", suggestedQuery = "", onSelect,
}: Props) {
  const [query, setQuery] = useState(suggestedQuery);
  const [results, setResults] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const search = async (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ action: "search", query: term, orientation, page: 1 }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || `Erro ${r.status}`);
      setResults(json.images || []);
      if (!json.images?.length) toast.message("Nenhum resultado para esta busca");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro na busca");
    } finally {
      setLoading(false);
    }
  };

  const pick = async (img: ImageItem) => {
    setDownloadingId(img.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ action: "fetch", url: img.url }),
      });
      const json = await r.json();
      if (!r.ok || !json.dataUrl) throw new Error(json.error || "Falha ao baixar");
      const attrib = `Foto: ${img.author} via ${img.source === "unsplash" ? "Unsplash" : "Pexels"}`;
      onSelect(json.dataUrl, attrib);
      onOpenChange(false);
      toast.success("Imagem aplicada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao baixar imagem");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5" /> Banco de imagens grátis
          </DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            placeholder="Buscar (ex: café, yoga, produto, natureza)"
          />
          <Button onClick={() => search()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Resultados de Unsplash + Pexels. Uso comercial gratuito; atribuição automática no rodapé do slide.
        </p>
        <ScrollArea className="h-[480px]">
          {results.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">
              {loading ? "Buscando..." : "Digite uma palavra-chave e pressione Buscar."}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-1">
              {results.map((img) => (
                <button
                  key={img.id}
                  onClick={() => pick(img)}
                  disabled={!!downloadingId}
                  className="relative group rounded-lg overflow-hidden border border-border hover:border-primary/60 transition-colors disabled:opacity-40"
                  style={{ aspectRatio: orientation === "9:16" ? "9/16" : orientation === "16:9" ? "16/9" : "1/1" }}
                >
                  <img src={img.thumbUrl} alt={img.alt || ""} loading="lazy" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] text-white flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="truncate">{img.author}</span>
                    <span className="uppercase">{img.source}</span>
                  </div>
                  {downloadingId === img.id && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

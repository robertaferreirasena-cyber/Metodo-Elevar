import { useEffect, useRef, useState } from "react";
import { Search, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { scopedKey } from "@/lib/userScopedKey";

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
  orientation?: "1:1" | "9:16" | "16:9";
  suggestedQuery?: string;
  onSelect: (dataUrl: string, attribution: string) => void;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-library-search`;

// ---------- Client-side cache (sessionStorage + localStorage) ----------
// sessionStorage = fast in-tab; localStorage = survives browser restarts.
// Both share the same TTL (10 min) and 30-entry LRU cap.
const CACHE_BASE = "img_lib_cache_v1";
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 30;

function cachePrefix() { return scopedKey(CACHE_BASE) + "::"; }
function cacheKey(query: string, orientation: string, page: number) {
  return `${cachePrefix()}${query.trim().toLowerCase()}::${orientation}::${page}`;
}

function readEntry(storage: Storage, key: string): { ts: number; images: ImageItem[] } | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; images: ImageItem[] };
    if (!parsed || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) {
      storage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getCached(query: string, orientation: string, page: number): ImageItem[] | null {
  const key = cacheKey(query, orientation, page);
  // Try sessionStorage first (fastest)
  try {
    const sess = readEntry(sessionStorage, key);
    if (sess) return sess.images;
  } catch { /* ignore */ }
  // Fallback to localStorage; if hit, warm sessionStorage
  try {
    const local = readEntry(localStorage, key);
    if (local) {
      try { sessionStorage.setItem(key, JSON.stringify(local)); } catch { /* ignore */ }
      return local.images;
    }
  } catch { /* ignore */ }
  return null;
}

function writeWithRetry(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // Quota likely exceeded — prune aggressively and retry once
    try {
      pruneStorage(storage, Math.floor(CACHE_MAX_ENTRIES / 2));
      storage.setItem(key, value);
    } catch {
      /* give up silently */
    }
  }
}

function setCached(query: string, orientation: string, page: number, images: ImageItem[]) {
  const key = cacheKey(query, orientation, page);
  const payload = JSON.stringify({ ts: Date.now(), images });
  pruneCache();
  try { writeWithRetry(sessionStorage, key, payload); } catch { /* ignore */ }
  try { writeWithRetry(localStorage, key, payload); } catch { /* ignore */ }
}

function pruneStorage(storage: Storage, maxEntries: number = CACHE_MAX_ENTRIES) {
  try {
    const prefix = cachePrefix();
    const keys: { k: string; ts: number }[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      try {
        const ts = JSON.parse(storage.getItem(k)!).ts ?? 0;
        if (Date.now() - ts > CACHE_TTL_MS) {
          storage.removeItem(k);
          continue;
        }
        keys.push({ k, ts });
      } catch {
        storage.removeItem(k);
      }
    }
    if (keys.length > maxEntries) {
      keys.sort((a, b) => a.ts - b.ts);
      keys.slice(0, keys.length - maxEntries).forEach(({ k }) => storage.removeItem(k));
    }
  } catch {
    /* ignore */
  }
}

function pruneCache() {
  pruneStorage(sessionStorage);
  pruneStorage(localStorage);
}

export default function ImageLibraryPicker({
  open, onOpenChange, orientation = "1:1", suggestedQuery = "", onSelect,
}: Props) {
  const [query, setQuery] = useState(suggestedQuery);
  const [results, setResults] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const autoSearchedRef = useRef<string>("");

  const search = async (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) return;

    // 1) Try client cache first (instant)
    const cached = getCached(term, orientation, 1);
    if (cached) {
      setResults(cached);
      return;
    }

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
      const images: ImageItem[] = json.images || [];
      setResults(images);
      if (images.length) setCached(term, orientation, 1, images);
      else toast.message("Nenhum resultado para esta busca");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro na busca");
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when opening with a suggested query (uses cache when available)
  useEffect(() => {
    if (!open) return;
    const term = (suggestedQuery || "").trim();
    if (!term) return;
    const fingerprint = `${term}::${orientation}`;
    if (autoSearchedRef.current === fingerprint) return;
    autoSearchedRef.current = fingerprint;
    setQuery(term);
    search(term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, suggestedQuery, orientation]);

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
          Resultados de Unsplash + Pexels. Buscas recentes ficam em cache por 10 min para troca rápida entre layouts.
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

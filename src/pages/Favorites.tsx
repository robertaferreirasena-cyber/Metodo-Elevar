import { ArrowLeft, Trash2, Copy, Check } from "lucide-react";
import { HeartIcon, SparklesIcon, SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, loading, removeFavorite } = useFavorites();
  const [selectedFavorite, setSelectedFavorite] = useState<typeof favorites[0] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeFavorite(id);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
          <HeartIcon />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">Favoritos</h1>
          <p className="text-xs text-muted-foreground">
            Suas estratégias salvas para acesso rápido
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="card-main rounded-2xl">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <HeartIcon />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Nenhum favorito ainda</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Crie estratégias e clique no ícone de coração para salvar suas favoritas aqui.
            </p>
            <Button
              onClick={() => navigate("/privado/estrategias")}
              className="gradient-primary glow-pink text-primary-foreground"
            >
              Criar estratégia
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                onClick={() => setSelectedFavorite(fav)}
                className="flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors group"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                  fav.type === "strategy" 
                    ? "gradient-primary" 
                    : "bg-primary/20"
                }`}>
                  {fav.type === "strategy" ? <SparklesIcon /> : <SearchIcon />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground line-clamp-2">
                    {fav.title || fav.content.substring(0, 80) + (fav.content.length > 80 ? "..." : "")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(fav.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    fav.type === "strategy"
                      ? "bg-primary/20 text-primary"
                      : "bg-accent/20 text-accent-foreground"
                  }`}>
                    {fav.type === "strategy" ? "Estratégia" : "Análise"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(fav.content, fav.id);
                    }}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    {copiedId === fav.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover favorito?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O favorito será permanentemente removido.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => handleDelete(fav.id, e)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedFavorite} onOpenChange={() => setSelectedFavorite(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                selectedFavorite?.type === "strategy" 
                  ? "gradient-primary" 
                  : "bg-primary/20"
              }`}>
                {selectedFavorite?.type === "strategy" ? <SparklesIcon /> : <SearchIcon />}
              </div>
              {selectedFavorite?.type === "strategy" ? "Estratégia Favorita" : "Análise Favorita"}
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm prose-invert max-w-none mt-4">
            <ReactMarkdown>{selectedFavorite?.content || ""}</ReactMarkdown>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => selectedFavorite && handleCopy(selectedFavorite.content, selectedFavorite.id)}
            >
              {copiedId === selectedFavorite?.id ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

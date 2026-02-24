import { ArrowLeft, MessageSquare, Search, Trash2 } from "lucide-react";
import { ClockIcon, SparklesIcon, SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useConversations } from "@/hooks/useConversations";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

export default function History() {
  const navigate = useNavigate();
  const { conversations, loading, deleteConversation } = useConversations();

  const handleOpenConversation = (id: string, type: string) => {
    if (type === "strategy") {
      navigate(`/privado/estrategias?conversa=${id}`);
    } else {
      navigate(`/privado/analise?conversa=${id}`);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation(id);
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
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
          <ClockIcon />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">Histórico</h1>
          <p className="text-xs text-muted-foreground">
            Todas as conversas que você já teve
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
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
              <ClockIcon />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Histórico vazio</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Suas conversas aparecerão aqui. Comece criando sua primeira estratégia de vendas.
            </p>
            <Button
              onClick={() => navigate("/privado/estrategias")}
              className="gradient-primary glow-pink text-primary-foreground"
            >
              Criar primeira estratégia
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleOpenConversation(conv.id, conv.type)}
                className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors group"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  conv.type === "strategy" 
                    ? "gradient-primary" 
                    : "bg-primary/20"
                }`}>
                  {conv.type === "strategy" ? <SparklesIcon /> : <SearchIcon />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {conv.title || (conv.type === "strategy" ? "Estratégia sem título" : "Análise sem título")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(conv.updated_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    conv.type === "strategy"
                      ? "bg-primary/20 text-primary"
                      : "bg-accent/20 text-accent-foreground"
                  }`}>
                    {conv.type === "strategy" ? "Estratégia" : "Análise"}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. A conversa será permanentemente removida.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => handleDelete(conv.id, e)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
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
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, Pencil, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface CopilotSuggestionProps {
  suggestion: string;
  loading: boolean;
  onAccept: (text: string) => void;
  onDismiss: () => void;
}

export function CopilotSuggestion({ suggestion, loading, onAccept, onDismiss }: CopilotSuggestionProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(suggestion);

  useEffect(() => {
    setEditText(suggestion);
    setEditing(false);
  }, [suggestion]);

  if (!suggestion && !loading) return null;

  return (
    <div className="mx-2 mb-1 rounded-lg border border-primary/30 bg-primary/5 p-2 animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles className="h-3 w-3 text-primary" />
        <span className="text-[10px] font-semibold text-primary uppercase">Copiloto IA</span>
        {loading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Analisando conversa...</p>
      ) : editing ? (
        <Textarea
          value={editText}
          onChange={e => setEditText(e.target.value)}
          rows={3}
          className="text-xs mb-2"
          autoFocus
        />
      ) : (
        <p className="text-xs text-foreground whitespace-pre-wrap mb-2">{suggestion}</p>
      )}

      {!loading && (
        <div className="flex gap-1.5">
          <Button
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={() => onAccept(editing ? editText : suggestion)}
          >
            <Check className="h-3 w-3 mr-0.5" /> Enviar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={() => setEditing(!editing)}
          >
            <Pencil className="h-3 w-3 mr-0.5" /> {editing ? 'Visualizar' : 'Editar'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2 text-muted-foreground"
            onClick={onDismiss}
          >
            <X className="h-3 w-3 mr-0.5" /> Ignorar
          </Button>
        </div>
      )}
    </div>
  );
}

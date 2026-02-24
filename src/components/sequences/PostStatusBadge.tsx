import { Badge } from "@/components/ui/badge";
import { Clock, Check, AlertCircle, FileText } from "lucide-react";

interface PostStatusBadgeProps {
  status: string;
}

export function PostStatusBadge({ status }: PostStatusBadgeProps) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 text-[10px] gap-1">
          <Clock className="h-2.5 w-2.5" />
          Agendado
        </Badge>
      );
    case "sent":
      return (
        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30 text-[10px] gap-1">
          <Check className="h-2.5 w-2.5" />
          Enviado
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10 text-[10px] gap-1">
          <AlertCircle className="h-2.5 w-2.5" />
          Falhou
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground text-[10px] gap-1">
          <FileText className="h-2.5 w-2.5" />
          Rascunho
        </Badge>
      );
  }
}

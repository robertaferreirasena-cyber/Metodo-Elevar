import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { clearAllSessions } from "./useSessionPersistence";

const CLEANUP_INTERVAL_MS = 48 * 60 * 60 * 1000; // 48 horas
const LAST_CLEANUP_KEY = "last_history_cleanup";

/**
 * Hook que executa limpeza automática de histórico a cada 48 horas.
 * - Deleta todas as conversas do banco de dados
 * - Limpa cache de sessão (sessionStorage)
 * - Atualiza timestamp da última limpeza
 */
export function useAutoCleanup() {
  const { user } = useAuth();
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Executar apenas uma vez por sessão do app
    if (hasRunRef.current || !user) return;
    hasRunRef.current = true;

    const checkAndCleanup = async () => {
      try {
        const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
        const lastCleanupTime = lastCleanup ? parseInt(lastCleanup, 10) : 0;
        const now = Date.now();

        // Verificar se passaram 48h desde a última limpeza
        if (now - lastCleanupTime < CLEANUP_INTERVAL_MS) {
          console.log("[AutoCleanup] Próxima limpeza em", 
            Math.round((CLEANUP_INTERVAL_MS - (now - lastCleanupTime)) / (1000 * 60 * 60)), "horas");
          return; // Ainda não é hora de limpar
        }

        console.log("[AutoCleanup] Iniciando limpeza automática...");

        // 1. Contar conversas antes de deletar
        const { count: conversationCount } = await supabase
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // 2. Deletar todas as conversas do banco (mensagens são deletadas via cascade)
        const { error } = await supabase
          .from("conversations")
          .delete()
          .eq("user_id", user.id);

        if (error) {
          console.error("[AutoCleanup] Erro ao limpar conversas:", error);
          return;
        }

        // 3. Limpar cache de sessão
        clearAllSessions();

        // 4. Atualizar timestamp da última limpeza
        localStorage.setItem(LAST_CLEANUP_KEY, now.toString());

        // 5. Notificar o usuário (se houver conversas removidas)
        const deletedCount = conversationCount || 0;
        if (deletedCount > 0) {
          toast.info(`Histórico limpo automaticamente`, {
            description: `${deletedCount} conversa(s) removida(s) para manter o app leve.`,
            duration: 4000,
          });
        }

        console.log(`[AutoCleanup] Limpeza concluída: ${deletedCount} conversas removidas`);
      } catch (error) {
        console.error("[AutoCleanup] Erro na limpeza automática:", error);
      }
    };

    // Executar com pequeno delay para não bloquear carregamento inicial
    const timeoutId = setTimeout(checkAndCleanup, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [user]);
}

/**
 * Força a limpeza imediata do histórico (para uso manual).
 * Retorna o número de conversas removidas.
 */
export async function forceCleanup(userId: string): Promise<number> {
  try {
    // Contar antes de deletar
    const { count } = await supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Deletar todas
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;

    // Limpar cache
    clearAllSessions();

    // Atualizar timestamp
    localStorage.setItem(LAST_CLEANUP_KEY, Date.now().toString());

    return count || 0;
  } catch (error) {
    console.error("[ForceCleanup] Erro:", error);
    return 0;
  }
}

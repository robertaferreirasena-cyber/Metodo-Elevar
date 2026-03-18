import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

/**
 * Hook that checks every 30 minutes if the user has registered sales today.
 * After 18:00, if no sales are found, shows a toast reminder and
 * sends a browser notification (if permission granted).
 */
export function useSalesReminder(userId: string | undefined) {
  const lastReminderDate = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const checkAndRemind = async () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 18) return; // Only remind after 18h

      const today = format(now, "yyyy-MM-dd");
      
      // Don't remind twice on the same day
      if (lastReminderDate.current === today) return;

      // Check if there's a goal for this month
      const monthStr = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
      const { data: goal } = await supabase
        .from("sales_goals")
        .select("id")
        .eq("user_id", userId)
        .eq("month", monthStr)
        .maybeSingle();

      if (!goal) return; // No goal configured, skip

      // Check if there are sales today
      const { data: records } = await supabase
        .from("sales_records")
        .select("id")
        .eq("goal_id", goal.id)
        .eq("record_date", today)
        .limit(1);

      if (records && records.length > 0) return; // Already has sales today

      // Mark as reminded
      lastReminderDate.current = today;

      // Show toast
      toast.warning("🔔 Você ainda não registrou vendas hoje! Acesse Metas Elevar para registrar.", {
        duration: 8000,
        action: {
          label: "Registrar",
          onClick: () => {
            window.location.href = "/metas-elevar";
          },
        },
      });

      // Browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Metas Elevar — Lembrete", {
          body: "Você ainda não registrou vendas hoje. Não esqueça de atualizar sua meta!",
          icon: "/icon-192x192.png",
        });
      } else if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    };

    // Check immediately
    checkAndRemind();

    // Then check every 30 minutes
    const interval = setInterval(checkAndRemind, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId]);
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bell, ChevronDown, ChevronUp, X, MessageSquare, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowupAlert {
  id: string;
  contact_phone: string;
  contact_name: string;
  alert_message: string;
  suggested_action: string;
  priority: string;
  is_read: boolean;
  created_at: string;
}

interface FollowupAlertsBannerProps {
  instanceId: string;
  onGoToChat?: (phone: string) => void;
}

export function FollowupAlertsBanner({ instanceId, onGoToChat }: FollowupAlertsBannerProps) {
  const [alerts, setAlerts] = useState<FollowupAlert[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!instanceId) return;
    // Load alerts
    supabase.from('whatsapp_followup_alerts' as any)
      .select('*')
      .eq('instance_id', instanceId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setAlerts(data as unknown as FollowupAlert[]);
      });

    // Realtime
    const channel = supabase
      .channel('followup-alerts')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'whatsapp_followup_alerts',
        filter: `instance_id=eq.${instanceId}`,
      }, (payload) => {
        setAlerts(prev => [payload.new as unknown as FollowupAlert, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [instanceId]);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  const markRead = async (id: string) => {
    await supabase.from('whatsapp_followup_alerts' as any).update({ is_read: true }).eq('id', id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
  };

  const dismiss = async (id: string) => {
    await supabase.from('whatsapp_followup_alerts' as any).update({ is_dismissed: true }).eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (alerts.length === 0) return null;

  const priorityColor: Record<string, string> = {
    high: 'text-destructive',
    medium: 'text-orange-400',
    low: 'text-muted-foreground',
  };

  return (
    <div className="border-b border-border bg-card/80">
      {/* Banner header */}
      <button
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <Bell className={cn("h-3.5 w-3.5", unreadCount > 0 ? "text-primary" : "text-muted-foreground")} />
        <span className="text-xs font-medium">Follow-up</span>
        {unreadCount > 0 && (
          <span className="h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center px-1">
            {unreadCount}
          </span>
        )}
        <span className="ml-auto">
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </span>
      </button>

      {/* Expanded list */}
      {expanded && (
        <div className="max-h-48 overflow-y-auto border-t border-border/50">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-2 px-3 py-2 border-b border-border/30 hover:bg-muted/30 transition-colors",
                !alert.is_read && "bg-primary/5"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn("text-[10px] font-semibold", priorityColor[alert.priority] || '')}>
                    {alert.priority === 'high' ? '🔴' : alert.priority === 'medium' ? '🟡' : '⚪'}
                  </span>
                  <span className="text-[11px] font-medium truncate">{alert.contact_name || alert.contact_phone}</span>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{alert.alert_message}</p>
                {alert.suggested_action && (
                  <p className="text-[10px] text-primary mt-0.5">💡 {alert.suggested_action}</p>
                )}
              </div>
              <div className="flex gap-0.5 shrink-0">
                {!alert.is_read && (
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => markRead(alert.id)} title="Marcar como lido">
                    <Eye className="h-2.5 w-2.5" />
                  </Button>
                )}
                {onGoToChat && (
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { onGoToChat(alert.contact_phone); markRead(alert.id); }} title="Ir para conversa">
                    <MessageSquare className="h-2.5 w-2.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => dismiss(alert.id)} title="Dispensar">
                  <X className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

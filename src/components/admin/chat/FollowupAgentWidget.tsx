import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ExternalLink } from "lucide-react";

interface FollowupAlert {
  id: string;
  contact_name: string | null;
  contact_phone: string;
  alert_message: string;
  priority: string | null;
  created_at: string | null;
}

const PRIORITY_EMOJI: Record<string, string> = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
};

export function FollowupAgentWidget() {
  const [alerts, setAlerts] = useState<FollowupAlert[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    const { data, count } = await supabase
      .from('whatsapp_followup_alerts')
      .select('id, contact_name, contact_phone, alert_message, priority, created_at', { count: 'exact' })
      .eq('is_dismissed', false)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setAlerts(data);
    if (count !== null) setTotalPending(count);
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="h-4 w-4 text-orange-500" />
          Follow-up
          {totalPending > 0 && (
            <Badge variant="destructive" className="text-[9px] h-4 px-1.5">
              {totalPending}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">Nenhum alerta pendente</p>
        ) : (
          <>
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-2 text-xs py-1">
                <span className="mt-0.5">{PRIORITY_EMOJI[alert.priority || 'medium'] || '🟡'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{alert.contact_name || alert.contact_phone}</p>
                  <p className="text-muted-foreground line-clamp-1">{alert.alert_message}</p>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-[10px] mt-1"
              onClick={() => navigate('/admin/whatsapp-chat')}
            >
              <ExternalLink className="h-3 w-3 mr-1" /> Ver no Chat
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

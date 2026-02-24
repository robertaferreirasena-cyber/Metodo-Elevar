import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, QrCode, Power, RotateCcw, Loader2, Trash2, Webhook } from 'lucide-react';

interface InstanceCardProps {
  instance: {
    id: string;
    name: string;
    instance_token: string;
    phone?: string | null;
    status?: string;
    webhook_url?: string | null;
    webhook_enabled?: boolean | null;
  };
  onConnect: (token: string, name: string) => void;
  onDisconnect: (token: string) => void;
  onRestart: (token: string) => void;
  onDelete: () => void;
  onWebhook: () => void;
  loadingAction: string | null;
}

export function InstanceCard({ instance, onConnect, onDisconnect, onRestart, onDelete, onWebhook, loadingAction }: InstanceCardProps) {
  const { instance_token: token, name, status: rawStatus = 'disconnected' } = instance;
  const isConnected = rawStatus === 'connected' || rawStatus === 'open';
  const isConnecting = rawStatus === 'connecting' || rawStatus === 'qr';
  const isLoading = loadingAction === token;

  const statusConfig = isConnected
    ? { label: 'Conectado', variant: 'default' as const, color: 'bg-green-500' }
    : isConnecting
    ? { label: 'Conectando', variant: 'secondary' as const, color: 'bg-yellow-500' }
    : { label: 'Desconectado', variant: 'destructive' as const, color: 'bg-red-500' };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{name}</p>
              {instance.phone && (
                <p className="text-xs text-muted-foreground">{instance.phone}</p>
              )}
              <p className="text-[10px] text-muted-foreground font-mono">{token.slice(0, 12)}...</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${statusConfig.color}`} />
            <Badge variant={statusConfig.variant} className="text-[10px]">
              {statusConfig.label}
            </Badge>
            {instance.webhook_enabled && (
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                <Webhook className="h-2.5 w-2.5 mr-0.5" />
                Webhook
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-3 justify-end">
          {!isConnected && (
            <Button size="sm" variant="default" onClick={() => onConnect(token, name)} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <QrCode className="h-3.5 w-3.5 mr-1" />}
              Conectar
            </Button>
          )}
          {isConnected && (
            <Button size="sm" variant="destructive" onClick={() => onDisconnect(token)} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Power className="h-3.5 w-3.5 mr-1" />}
              Desconectar
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onWebhook} title="Configurar Webhook">
            <Webhook className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onRestart(token)} disabled={isLoading}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

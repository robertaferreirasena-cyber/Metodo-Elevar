import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InstanceWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceToken: string;
  instanceName: string;
  instanceId: string;
  initialUrl?: string;
  initialEnabled?: boolean;
}

export function InstanceWebhookDialog({
  open,
  onOpenChange,
  instanceToken,
  instanceName,
  instanceId,
  initialUrl = '',
  initialEnabled = false,
}: InstanceWebhookDialogProps) {
  const defaultWebhookUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'atizmwsokehhxclbckfr'}.supabase.co/functions/v1/whatsapp-webhook-receiver`;
  const [url, setUrl] = useState(initialUrl || defaultWebhookUrl);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [events, setEvents] = useState<string[]>(['messages', 'connection']);
  const [excludeApi, setExcludeApi] = useState(true);
  const [saving, setSaving] = useState(false);

  const toggleEvent = (event: string) => {
    setEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);
  };

  const handleSave = async () => {
    if (!url.trim() && enabled) {
      toast.error('Informe a URL do webhook');
      return;
    }
    setSaving(true);
    try {
      const webhookConfig = {
        enabled,
        url: url.trim(),
        events,
        excludeMessages: excludeApi ? ['wasSentByApi'] : [],
      };

      const { error } = await supabase.functions.invoke('uazapi-manager', {
        body: { action: 'webhook', instanceToken, webhookConfig },
      });
      if (error) throw error;

      // Persist locally
      await supabase
        .from('whatsapp_instances' as any)
        .update({ webhook_url: url.trim(), webhook_enabled: enabled } as any)
        .eq('id', instanceId);

      toast.success('Webhook configurado!');
      onOpenChange(false);
    } catch (err: any) {
      console.error('Webhook config error:', err);
      toast.error('Erro ao configurar webhook');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Webhook</DialogTitle>
          <DialogDescription>
            Configure notificações para a instância <strong>{instanceName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="wh-enabled">Webhook ativo</Label>
            <Switch id="wh-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div>
            <Label htmlFor="wh-url">URL do Webhook</Label>
            <Input
              id="wh-url"
              placeholder={defaultWebhookUrl}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              URL padrão pré-preenchida para receber eventos neste sistema.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Eventos</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={events.includes('messages')} onCheckedChange={() => toggleEvent('messages')} />
                Mensagens recebidas
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={events.includes('connection')} onCheckedChange={() => toggleEvent('connection')} />
                Mudanças de conexão
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={excludeApi} onCheckedChange={(v) => setExcludeApi(!!v)} />
            Ignorar mensagens enviadas pela API
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

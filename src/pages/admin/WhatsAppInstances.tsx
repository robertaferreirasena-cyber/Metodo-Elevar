import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, RefreshCw, Smartphone, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InstanceCard } from '@/components/admin/InstanceCard';
import { InstanceWebhookDialog } from '@/components/admin/InstanceWebhookDialog';
import { QrCodeModal } from '@/components/admin/QrCodeModal';
import { useAuth } from '@/hooks/useAuth';

interface Instance {
  id: string;
  name: string;
  instance_token: string;
  phone: string | null;
  status: string;
  webhook_url: string | null;
  webhook_enabled: boolean | null;
}

export default function WhatsAppInstances() {
  const { profile } = useAuth();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newToken, setNewToken] = useState('');
  const [creating, setCreating] = useState(false);
  const [qrModal, setQrModal] = useState<{ open: boolean; token: string; name: string; id: string }>({ open: false, token: '', name: '', id: '' });
  const [webhookModal, setWebhookModal] = useState<{ open: boolean; instance: Instance | null }>({ open: false, instance: null });

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInstances((data as any) || []);
    } catch (err: any) {
      console.error('Fetch instances error:', err);
      toast.error('Erro ao carregar instâncias');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check status of all instances via UAZapi
  const refreshStatuses = useCallback(async () => {
    for (const inst of instances) {
      try {
        const { data, error } = await supabase.functions.invoke('uazapi-manager', {
          body: { action: 'status', instanceToken: inst.instance_token },
        });
        if (error) continue;
        const newStatus = data?.instance?.status || data?.status || (data?.connected ? 'connected' : 'disconnected');
        const phone = data?.instance?.owner || data?.phone || data?.phoneNumber || inst.phone;
        if (newStatus !== inst.status || phone !== inst.phone) {
          await supabase
            .from('whatsapp_instances' as any)
            .update({ status: newStatus, phone } as any)
            .eq('id', inst.id);
        }
      } catch {}
    }
    fetchInstances();
  }, [instances, fetchInstances]);

  const hasAutoChecked = useRef(false);

  useEffect(() => { fetchInstances(); }, [fetchInstances]);


  const handleCreate = async () => {
    if (!newName.trim() || !newToken.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabase
        .from('whatsapp_instances' as any)
        .insert({
          name: newName.trim(),
          instance_token: newToken.trim(),
          created_by: profile?.id,
        } as any);
      if (error) throw error;
      toast.success(`Instância "${newName}" adicionada!`);
      setCreateOpen(false);
      setNewName('');
      setNewToken('');
      fetchInstances();
    } catch (err: any) {
      toast.error('Erro ao adicionar instância');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_instances' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Instância removida');
      fetchInstances();
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const handleConnect = (token: string, name: string, id: string) => {
    setQrModal({ open: true, token, name, id });
  };

  const handleDisconnect = async (token: string) => {
    setLoadingAction(token);
    try {
      const { error } = await supabase.functions.invoke('uazapi-manager', {
        body: { action: 'disconnect', instanceToken: token },
      });
      if (error) throw error;
      toast.success('Instância desconectada');
      refreshStatuses();
    } catch {
      toast.error('Erro ao desconectar');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRestart = async (token: string) => {
    setLoadingAction(token);
    try {
      const { error } = await supabase.functions.invoke('uazapi-manager', {
        body: { action: 'restart', instanceToken: token },
      });
      if (error) throw error;
      toast.success('Instância reiniciada');
      setTimeout(refreshStatuses, 3000);
    } catch {
      toast.error('Erro ao reiniciar');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Instâncias WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas conexões UAZapi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshStatuses} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Status
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Instância
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : instances.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Smartphone className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma instância cadastrada</p>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              Adicione suas instâncias UAZapi informando o nome e o token da instância (encontrado no painel UAZapi).
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Primeira Instância
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={instance}
              onConnect={(token, name) => handleConnect(token, name, instance.id)}
              onDisconnect={handleDisconnect}
              onRestart={handleRestart}
              onDelete={() => handleDelete(instance.id)}
              onWebhook={() => setWebhookModal({ open: true, instance })}
              loadingAction={loadingAction}
            />
          ))}
        </div>
      )}

      {/* Add Instance Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Instância</DialogTitle>
            <DialogDescription>
              Informe o nome e o token da instância do UAZapi. O token é encontrado no painel UAZapi em "Instance Token".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="inst-name">Nome da instância</Label>
              <Input
                id="inst-name"
                placeholder="Ex: Atendimento Principal"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="inst-token">Token da instância</Label>
              <Input
                id="inst-token"
                placeholder="Ex: 15ac02b1-596f-4935-..."
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim() || !newToken.trim()}>
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <QrCodeModal
        open={qrModal.open}
        onOpenChange={(open) => setQrModal(prev => ({ ...prev, open }))}
        instanceToken={qrModal.token}
        instanceName={qrModal.name}
      />

      {/* Webhook Config Dialog */}
      {webhookModal.instance && (
        <InstanceWebhookDialog
          open={webhookModal.open}
          onOpenChange={(open) => setWebhookModal(prev => ({ ...prev, open }))}
          instanceToken={webhookModal.instance.instance_token}
          instanceName={webhookModal.instance.name}
          instanceId={webhookModal.instance.id}
          initialUrl={webhookModal.instance.webhook_url || ''}
          initialEnabled={webhookModal.instance.webhook_enabled || false}
        />
      )}
    </div>
  );
}

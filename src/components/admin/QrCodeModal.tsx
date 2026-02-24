import { useEffect, useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QrCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceToken: string;
  instanceName: string;
}

export function QrCodeModal({ open, onOpenChange, instanceToken, instanceName }: QrCodeModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('loading');
  const [loading, setLoading] = useState(false);
  const hasConnected = useRef(false);

  // Step 1: Send connect command to start QR generation
  const sendConnect = useCallback(async () => {
    if (!instanceToken) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('uazapi-manager', {
        body: { action: 'connect', instanceToken },
      });
      if (error) throw error;
      // Connect response already includes QR code
      const instanceData = data?.instance || data;
      const qr = instanceData?.qrcode || '';
      if (qr) {
        setQrCode(qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`);
        setStatus('connecting');
      }
    } catch (err) {
      console.error('Connect error:', err);
    } finally {
      setLoading(false);
    }
  }, [instanceToken]);

  // Step 2: Poll status to get QR code
  const checkStatus = useCallback(async () => {
    if (!instanceToken) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('uazapi-manager', {
        body: { action: 'status', instanceToken },
      });
      if (error) throw error;

      const instanceData = data?.instance || data;
      const rawStatus: string = instanceData?.status || (data?.status?.connected ? 'connected' : 'disconnected');
      const qr = instanceData?.qrcode || '';

      if (rawStatus === 'connected' || data?.status?.connected) {
        setStatus('connected');
        toast.success(`${instanceName} conectada com sucesso!`);
        onOpenChange(false);
        return;
      }

      setStatus(rawStatus === 'connecting' ? 'connecting' : 'waiting');

      if (qr) {
        setQrCode(qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`);
      } else {
        setQrCode(null);
      }
    } catch (err: any) {
      console.error('Status check error:', err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }, [instanceToken, instanceName, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQrCode(null);
      setStatus('loading');
      hasConnected.current = false;
      return;
    }

    const init = async () => {
      if (!hasConnected.current) {
        hasConnected.current = true;
        await sendConnect();
      }
    };
    init();

    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [open, sendConnect, checkStatus]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar {instanceName}</DialogTitle>
          <DialogDescription>Escaneie o QR Code com o WhatsApp para conectar esta instância.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <Badge variant={status === 'connected' ? 'default' : status === 'connecting' || status === 'waiting' ? 'secondary' : 'destructive'}>
            {status === 'connecting' || status === 'waiting' ? 'Aguardando leitura...' : status === 'connected' ? 'Conectado!' : status === 'error' ? 'Erro' : 'Carregando...'}
          </Badge>

          {loading && !qrCode ? (
            <div className="flex items-center justify-center h-64 w-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : qrCode ? (
            <img
              src={qrCode}
              alt="QR Code WhatsApp"
              className="h-64 w-64 rounded-lg border"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 w-64 gap-3 border rounded-lg bg-muted/50">
              <XCircle className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">QR Code não disponível ainda</p>
            </div>
          )}

          <Button onClick={checkStatus} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar QR Code
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Verificação automática a cada 10 segundos.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

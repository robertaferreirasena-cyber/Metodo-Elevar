import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AppLogo } from '@/components/icons';

export default function SubscriptionExpired() {
  const { signOut, subscription } = useAuth();

  const expiredDate = subscription?.expires_at 
    ? new Date(subscription.expires_at).toLocaleDateString('pt-BR')
    : '';

  const handleRenew = () => {
    // Redirecionar para a página de compra na Kiwify
    // Substitua pelo seu link real de checkout
    window.open('https://pay.kiwify.com.br/SEU_PRODUTO', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AppLogo size={64} />
          </div>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-xl">Seu acesso expirou</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>
              Sua assinatura do <strong>Estrategista IA</strong> expirou
              {expiredDate && ` em ${expiredDate}`}.
            </p>
            <p className="mt-2">
              Para continuar acessando todas as funcionalidades, renove sua assinatura.
            </p>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium mb-2">O que você terá de volta:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Estratégias personalizadas de vendas</li>
              <li>✓ Análise de conversas com IA</li>
              <li>✓ Scripts prontos para WhatsApp</li>
              <li>✓ Comunidade exclusiva</li>
              <li>✓ Acesso por mais 1 ano completo</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button onClick={handleRenew} className="w-full gap-2" size="lg">
              <RefreshCw className="h-4 w-4" />
              Renovar Agora - R$ 197/ano
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={signOut}
              className="w-full gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Após o pagamento, seu acesso será restaurado automaticamente.
            Dúvidas? Entre em contato pelo suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

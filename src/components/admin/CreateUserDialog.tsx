import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateUserDialogProps {
  onCreateUser: (data: { email: string; fullName: string }) => Promise<{
    success: boolean;
    error?: string;
    user?: {
      id: string;
      email: string;
      fullName: string;
      tempPassword: string;
    };
    warning?: string;
  }>;
}

export function CreateUserDialog({ onCreateUser }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !fullName.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    
    const result = await onCreateUser({ email: email.trim(), fullName: fullName.trim() });
    
    setIsLoading(false);

    if (result.success && result.user) {
      setCreatedUser({
        email: result.user.email,
        tempPassword: result.user.tempPassword
      });
      toast.success('Usuário criado com sucesso!');
      
      if (result.warning) {
        toast.warning(result.warning);
      }
    } else {
      toast.error(result.error || 'Erro ao criar usuário');
    }
  };

  const handleCopyCredentials = () => {
    if (!createdUser) return;
    
    const text = `Email: ${createdUser.email}\nSenha temporária: ${createdUser.tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credenciais copiadas!');
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form after close animation
    setTimeout(() => {
      setEmail('');
      setFullName('');
      setCreatedUser(null);
      setCopied(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Cadastrar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!createdUser ? (
          <>
            <DialogHeader>
              <DialogTitle>Cadastrar Usuário Manualmente</DialogTitle>
              <DialogDescription>
                Cadastre um usuário que comprou antes do sistema estar pronto. 
                O acesso Pro será liberado por 1 ano.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  placeholder="João da Silva"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Criando...
                    </>
                  ) : (
                    'Criar Usuário'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-green-600">✓ Usuário Criado!</DialogTitle>
              <DialogDescription>
                Copie as credenciais abaixo e envie para o cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <p className="font-medium">{createdUser.email}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Senha temporária:</span>
                  <p className="font-mono font-bold text-lg">{createdUser.tempPassword}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                ⚠️ O usuário deve alterar a senha após o primeiro login.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleCopyCredentials} className="gap-2">
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar Credenciais
                  </>
                )}
              </Button>
              <Button onClick={handleClose}>
                Fechar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModuleKey } from '@/hooks/usePermissions';

const MODULE_NAMES: Record<ModuleKey, string> = {
  module_private: 'Modo Privado',
  module_group: 'Modo Grupo',
  module_sequences: 'Sequências de Posts',
  module_persona: 'Persona Raio-X',
  module_ideas: 'Gerador de Ideias',
  module_favorites: 'Favoritos',
  module_history: 'Histórico',
  module_community: 'Comunidade',
  module_photoboss: 'Ensaio Fotográfico',
  module_conversation_analysis: 'Análise de Conversas',
  module_traffic_ads: 'Tráfego Pago',
  module_manychat_flows: 'Automação Instagram',
};

export default function AccessBlocked() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { from?: Location; module?: ModuleKey } | null;

  const moduleName = state?.module ? MODULE_NAMES[state.module] : 'este módulo';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Acesso Restrito</CardTitle>
          <CardDescription className="text-base mt-2">
            Você não tem permissão para acessar {moduleName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Esta funcionalidade está desabilitada para sua conta. 
            Se você acredita que isso é um erro, entre em contato com o suporte.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button 
              className="flex-1"
              onClick={() => navigate('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Ir para Início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

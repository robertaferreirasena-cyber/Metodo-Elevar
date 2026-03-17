import { BotMessageSquare, Lightbulb, Brain, Camera, ArrowRight, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function MentoraHub() {
  const { user } = useAuth();
  const [mentorChats, setMentorChats] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('mentor_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setMentorChats(count ?? 0));
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-emerald-500/10">
          <BotMessageSquare className="h-7 w-7 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Mentora Gi</h1>
          <p className="text-sm text-muted-foreground">Sua mentora de vendas com IA</p>
        </div>
      </div>

      {/* Main CTA - Chat */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/20">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Conversar com a Gi</h2>
                <p className="text-xs text-muted-foreground">
                  {mentorChats > 0 ? `${mentorChats} conversa${mentorChats > 1 ? 's' : ''} anteriore${mentorChats > 1 ? 's' : ''}` : 'Comece sua primeira conversa'}
                </p>
              </div>
            </div>
            <Button asChild>
              <Link to="/mentora" className="gap-2">
                Abrir Chat <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Related Tools */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">🛠️ Recursos Relacionados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/ideias" className="group">
            <Card className="h-full hover:shadow-md transition-all hover:border-primary/30">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-yellow-500/10 flex-shrink-0">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Gerador de Ideias</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Ideias de conteúdo e posts</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/persona" className="group">
            <Card className="h-full hover:shadow-md transition-all hover:border-primary/30">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10 flex-shrink-0">
                  <Brain className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Raio-X Persona</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Mapa do cliente ideal</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/ensaio-fotografico" className="group">
            <Card className="h-full hover:shadow-md transition-all hover:border-primary/30">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-pink-500/10 flex-shrink-0">
                  <Camera className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">Ensaio Foto</h3>
                    <Badge className="bg-primary text-primary-foreground text-[7px] px-1 py-0">NOVO</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Guia para fotos profissionais</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

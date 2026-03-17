import { MessageCircle, Search, FileText, Users, Calendar, Layout, ArrowRight, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface HubCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
  isNew?: boolean;
}

function HubCard({ icon, title, description, href, color, isNew }: HubCardProps) {
  return (
    <Link to={href} className="group">
      <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/30">
        <CardContent className="p-4 flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${color} flex-shrink-0`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              {isNew && (
                <Badge className="bg-primary text-primary-foreground text-[7px] px-1 py-0">NOVO</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function WhatsAppHub() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ conversations: 0, favorites: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [convsRes, favsRes] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      setStats({ conversations: convsRes.count ?? 0, favorites: favsRes.count ?? 0 });
    };
    fetchStats();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-emerald-500/10">
          <Smartphone className="h-7 w-7 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">WhatsApp - Central de Vendas</h1>
          <p className="text-sm text-muted-foreground">Todas as ferramentas para vender pelo WhatsApp</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.conversations}</p>
              <p className="text-xs text-muted-foreground">Conversas geradas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.favorites}</p>
              <p className="text-xs text-muted-foreground">Conteúdos salvos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Private Sales */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">💬 Vendas Privadas (1:1)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <HubCard
            icon={<MessageCircle className="h-5 w-5 text-pink-500" />}
            title="Estratégias 1:1"
            description="Gere estratégias personalizadas para conversas individuais"
            href="/privado/estrategias"
            color="bg-pink-500/10"
          />
          <HubCard
            icon={<Search className="h-5 w-5 text-blue-500" />}
            title="Análise de Conversa"
            description="Cole uma conversa e receba análise detalhada"
            href="/privado/analise"
            color="bg-blue-500/10"
          />
          <HubCard
            icon={<FileText className="h-5 w-5 text-amber-500" />}
            title="Scripts Prontos"
            description="Modelos de mensagens para copiar e usar"
            href="/privado/scripts"
            color="bg-amber-500/10"
          />
        </div>
      </div>

      {/* Group Sales */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">👥 Grupos & Comunidade</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <HubCard
            icon={<Users className="h-5 w-5 text-violet-500" />}
            title="Conteúdo p/ Grupo"
            description="Posts engajantes para seus grupos"
            href="/grupo/conteudo"
            color="bg-violet-500/10"
          />
          <HubCard
            icon={<Calendar className="h-5 w-5 text-emerald-500" />}
            title="Sequências"
            description="Séries de conteúdo programadas"
            href="/grupo/sequencias"
            color="bg-emerald-500/10"
          />
          <HubCard
            icon={<Layout className="h-5 w-5 text-sky-500" />}
            title="Templates"
            description="Modelos prontos para grupos"
            href="/grupo/templates"
            color="bg-sky-500/10"
          />
        </div>
      </div>
    </div>
  );
}

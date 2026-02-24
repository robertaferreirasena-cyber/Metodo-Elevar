import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Cpu, Users, TrendingUp, Zap, MessageCircle, Brain, ListOrdered, Camera, BarChart3, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

interface TokenStats {
  total_tokens_used: number;
  total_requests: number;
  active_users: number;
  avg_tokens_per_user: number;
}

interface FeatureTokens {
  feature: string;
  tokens: number;
}

const FEATURE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'sales-strategist': { label: 'Estrategista', icon: <MessageCircle className="h-4 w-4" />, color: 'bg-primary' },
  'persona-generator': { label: 'Raio-X', icon: <Brain className="h-4 w-4" />, color: 'bg-accent' },
  'sequence-generator': { label: 'Sequências', icon: <ListOrdered className="h-4 w-4" />, color: 'bg-secondary' },
  'conversation-analyzer': { label: 'Análise', icon: <BarChart3 className="h-4 w-4" />, color: 'bg-muted' },
  'photoboss': { label: 'PhotoBoss', icon: <Camera className="h-4 w-4" />, color: 'bg-primary/70' },
};

export default function AdminTokens() {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [featureTokens, setFeatureTokens] = useState<FeatureTokens[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch aggregated stats
        const { data: statsData, error: statsError } = await supabase.rpc('get_token_stats');
        if (statsError) throw statsError;
        
        if (statsData && statsData.length > 0) {
          setStats(statsData[0]);
        }

        // Fetch tokens by feature
        const { data: featureData, error: featureError } = await supabase.rpc('get_tokens_by_feature');
        if (featureError) throw featureError;
        
        setFeatureTokens(featureData || []);
      } catch (error) {
        console.error('Error fetching token stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Calculate estimated cost (rough estimate: $0.075 per 1M input tokens for flash-lite)
  const estimatedCost = stats ? (stats.total_tokens_used / 1000000) * 0.075 : 0;

  // Get max tokens for progress bar scaling
  const maxTokens = featureTokens.length > 0 ? Math.max(...featureTokens.map(f => f.tokens)) : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin">Painel Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Métricas de Tokens</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Métricas de Tokens</h1>
        <p className="text-muted-foreground">Monitore o consumo de IA e custos operacionais</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tokens Este Mês</CardTitle>
            <Cpu className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.total_tokens_used || 0)}</div>
            <p className="text-xs text-muted-foreground">
              ~${estimatedCost.toFixed(2)} custo estimado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requisições</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.total_requests || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_tokens_used && stats?.total_requests 
                ? `~${Math.round(stats.total_tokens_used / stats.total_requests)} tokens/req`
                : 'Sem dados'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_users || 0}</div>
            <p className="text-xs text-muted-foreground">com requisições este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Média por Usuário</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.avg_tokens_per_user || 0)}</div>
            <p className="text-xs text-muted-foreground">tokens/usuário</p>
          </CardContent>
        </Card>
      </div>

      {/* Tokens by Feature */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Consumo por Feature
          </CardTitle>
          <CardDescription>
            Distribuição de tokens entre as funcionalidades de IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {featureTokens.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum dado de consumo ainda. Os dados aparecerão conforme usuários usam o app.
            </p>
          ) : (
            featureTokens.map((feature) => {
              const config = FEATURE_LABELS[feature.feature] || {
                label: feature.feature,
                icon: <Zap className="h-4 w-4" />,
                color: 'bg-gray-500'
              };
              const percentage = (feature.tokens / maxTokens) * 100;

              return (
                <div key={feature.feature} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${config.color} text-white`}>
                        {config.icon}
                      </div>
                      <span className="font-medium">{config.label}</span>
                    </div>
                    <span className="text-muted-foreground">{formatNumber(feature.tokens)} tokens</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Estimativa de Custos</CardTitle>
          <CardDescription>
            Baseado no modelo gemini-2.5-flash-lite ($0.075/1M tokens)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Custo Este Mês</p>
              <p className="text-2xl font-bold text-primary">${estimatedCost.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Custo por Usuário</p>
              <p className="text-2xl font-bold">
                ${stats?.active_users ? (estimatedCost / stats.active_users).toFixed(3) : '0.00'}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            💡 Dica: O uso do flash-lite economiza ~90% comparado ao GPT-4. 
            Com otimização de contexto, você está economizando ~70% adicionais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

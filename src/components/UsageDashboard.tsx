import { useUsageLimits } from '@/hooks/useUsageLimits';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Clock, Calendar, Zap, Brain, ListOrdered } from 'lucide-react';

export function UsageDashboard() {
  const {
    limits,
    loading,
    config,
    isSubscriptionValid,
    getUsagePercentages,
    getDaysRemaining,
    getTimeUntilDailyReset,
  } = useUsageLimits();

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-2 w-full bg-muted animate-pulse rounded" />
            <div className="h-2 w-full bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentages = getUsagePercentages();
  const daysRemaining = getDaysRemaining();
  const timeUntilReset = getTimeUntilDailyReset();
  const subscriptionValid = isSubscriptionValid();

  if (!subscriptionValid) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Assinatura Expirada</AlertTitle>
        <AlertDescription>
          Sua assinatura expirou ou está inativa. Renove para continuar usando o app.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Uso do Sistema
        </CardTitle>
        <CardDescription className="text-xs">
          {daysRemaining !== null && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {daysRemaining} dias restantes na assinatura
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Usage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Hoje
            </span>
            <span className="font-medium">
              {limits?.daily_requests || 0}/{config.daily_limit}
            </span>
          </div>
          <Progress value={percentages?.daily || 0} className="h-2" />
          {percentages && percentages.daily >= 80 && (
            <p className="text-xs text-amber-500">
              Reseta em {timeUntilReset.hours}h {timeUntilReset.minutes}min
            </p>
          )}
        </div>

        {/* Monthly Usage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Este mês
            </span>
            <span className="font-medium">
              {limits?.monthly_requests || 0}/{config.monthly_limit}
            </span>
          </div>
          <Progress value={percentages?.monthly || 0} className="h-2" />
        </div>

        {/* Special Limits */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Brain className="h-3 w-3" />
                Raio-X
              </span>
              <span>{limits?.persona_requests_month || 0}/{config.persona_limit}</span>
            </div>
            <Progress value={percentages?.persona || 0} className="h-1.5" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <ListOrdered className="h-3 w-3" />
                Sequências
              </span>
              <span>{limits?.sequence_requests_month || 0}/{config.sequence_limit}</span>
            </div>
            <Progress value={percentages?.sequence || 0} className="h-1.5" />
          </div>
        </div>

        {/* Warning if approaching limits */}
        {percentages && (percentages.daily >= 90 || percentages.monthly >= 90) && (
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500 text-sm">Limite próximo</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">
              Você está próximo do limite de uso. Use com moderação.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

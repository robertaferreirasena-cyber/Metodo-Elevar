import { useState } from 'react';
import { useAdminData } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Link as LinkIcon, CheckCircle, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminPayments() {
  const { orders, pendingOrders, loading, fetchOrders, fetchPendingOrders } = useAdminData();
  const [linkingEmail, setLinkingEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">Pago</Badge>;
      case 'refunded':
        return <Badge variant="destructive">Reembolsado</Badge>;
      case 'chargeback':
        return <Badge variant="destructive">Chargeback</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleGoToUsers = (email: string) => {
    // Navigate to users page with the email as search param
    navigate(`/admin/users?search=${encodeURIComponent(email)}`);
  };

  const handleRefresh = async () => {
    await Promise.all([fetchOrders(), fetchPendingOrders()]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
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
                <BreadcrumbPage>Pagamentos Kiwify</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pagamentos Kiwify</h1>
            <p className="text-muted-foreground">{orders.length} pagamentos • {pendingOrders.length} pendentes</p>
          </div>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos os Pagamentos</TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            Pendentes
            {pendingOrders.length > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingOrders.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    Nenhum pagamento registrado ainda.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Configure o webhook na Kiwify para começar a receber notificações de pagamento.
                  </p>
                  <div className="mt-6 p-4 bg-muted rounded-lg text-left max-w-lg mx-auto">
                    <p className="text-sm font-medium mb-2">URL do Webhook:</p>
                    <code className="text-xs bg-background p-2 rounded block break-all">
                      https://atizmwsokehhxclbckfr.supabase.co/functions/v1/kiwify-webhook
                    </code>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ID Kiwify</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customer_name || '-'}</p>
                            <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.product_name || 'Estrategista IA'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {order.kiwify_order_id?.substring(0, 8)}...
                          </code>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Compras Pendentes de Vinculação
              </CardTitle>
              <CardDescription>
                Estas compras foram pagas na Kiwify mas o email não corresponde a nenhum usuário cadastrado no app.
                Vincule manualmente acessando o usuário correto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingOrders.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Todas as compras estão vinculadas corretamente!
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data da Compra</TableHead>
                      <TableHead>Email da Compra</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map((order, index) => (
                      <TableRow key={`${order.kiwify_order_id}-${index}`} className="bg-amber-500/5">
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{order.customer_email}</span>
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              Não vinculado
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.customer_name || '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleGoToUsers(order.customer_email)}
                            className="gap-1"
                          >
                            <LinkIcon className="h-4 w-4" />
                            Vincular a Usuário
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Como vincular:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Clique em "Vincular a Usuário" na compra pendente</li>
                  <li>Busque e encontre o usuário correto na lista</li>
                  <li>Clique em "Gerenciar" no usuário desejado</li>
                  <li>Na aba "Emails", adicione o email da compra</li>
                  <li>A assinatura será ativada automaticamente!</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useAdminData } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ArrowLeft, Settings, Ban, Trash2, Eye, EyeOff, Link as LinkIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { UserManagementDialog } from '@/components/admin/UserManagementDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserData {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  plan: string;
  status: string;
  expires_at: string | null;
  payment_source: string;
  blocked_at: string | null;
  block_reason: string | null;
  is_soft_deleted: boolean;
}

export default function AdminUsers() {
  const { users, usersWithLinkedEmails, loading, createManualUser, fetchUsers, fetchUsersWithLinkedEmails } = useAdminData();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [linkedFilter, setLinkedFilter] = useState<string>('all');
  const [showDeleted, setShowDeleted] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [managementDialogOpen, setManagementDialogOpen] = useState(false);

  // Update search when URL param changes
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearch(urlSearch);
    }
  }, [searchParams]);

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = 
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(search.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.status === 'active' && !user.blocked_at) ||
      (statusFilter === 'blocked' && user.blocked_at) ||
      (statusFilter === 'expired' && user.expires_at && new Date(user.expires_at) < new Date()) ||
      (statusFilter === 'canceled' && user.status === 'canceled');
    
    // Plan filter
    const matchesPlan = planFilter === 'all' || user.plan === planFilter;
    
    // Linked emails filter
    const matchesLinked = linkedFilter === 'all' || 
      (linkedFilter === 'linked' && hasLinkedEmails(user.user_id)) ||
      (linkedFilter === 'not_linked' && !hasLinkedEmails(user.user_id));
    
    // Deleted filter
    const matchesDeleted = showDeleted || !user.is_soft_deleted;
    
    return matchesSearch && matchesStatus && matchesPlan && matchesLinked && matchesDeleted;
  });

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusBadge = (user: UserData) => {
    if (user.is_soft_deleted) {
      return <Badge variant="outline" className="border-destructive text-destructive"><Trash2 className="h-3 w-3 mr-1" /> Desativado</Badge>;
    }
    if (user.blocked_at) {
      return <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" /> Bloqueado</Badge>;
    }
    const expired = isExpired(user.expires_at);
    if (expired) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (user.status === 'active') {
      return <Badge variant="default">Ativo</Badge>;
    }
    return <Badge variant="secondary">Inativo</Badge>;
  };

  const handleOpenUserManagement = (user: UserData) => {
    setSelectedUser(user);
    setManagementDialogOpen(true);
  };

  const handleUserUpdated = () => {
    fetchUsers();
    fetchUsersWithLinkedEmails();
  };

  const hasLinkedEmails = (userId: string) => {
    return usersWithLinkedEmails.has(userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const deletedCount = users.filter(u => u.is_soft_deleted).length;
  const blockedCount = users.filter(u => u.blocked_at).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            {users.length} usuários • {blockedCount} bloqueados • {deletedCount} desativados
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email ou nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="blocked">Bloqueados</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                  <SelectItem value="canceled">Cancelados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Planos</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>

              <Select value={linkedFilter} onValueChange={setLinkedFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Vinculação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="linked">Com Vínculos</SelectItem>
                  <SelectItem value="not_linked">Sem Vínculos</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant={showDeleted ? "secondary" : "outline"} 
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
                className="gap-1"
              >
                {showDeleted ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {showDeleted ? 'Mostrando' : 'Ocultos'} ({deletedCount})
              </Button>
              
              <CreateUserDialog onCreateUser={createManualUser} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const expired = isExpired(user.expires_at);
                const daysRemaining = getDaysRemaining(user.expires_at);
                
                return (
                  <TableRow 
                    key={user.id} 
                    className={user.is_soft_deleted ? 'opacity-50' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{user.full_name || 'Sem nome'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        {hasLinkedEmails(user.user_id) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-blue-600 border-blue-600 gap-1">
                                  <LinkIcon className="h-3 w-3" />
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Possui emails vinculados</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.plan === 'pro' ? 'default' : 'secondary'}>
                        {user.plan === 'pro' ? 'Pro' : 'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>
                    <TableCell>
                      {user.expires_at ? (
                        <div>
                          <p className={expired ? 'text-destructive' : ''}>
                            {new Date(user.expires_at).toLocaleDateString('pt-BR')}
                          </p>
                          {daysRemaining && daysRemaining > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {daysRemaining} dias restantes
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {user.payment_source === 'kiwify' ? '💳 Kiwify' : '✋ Manual'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleOpenUserManagement(user)}
                        className="gap-1"
                      >
                        <Settings className="h-4 w-4" />
                        Gerenciar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum usuário encontrado
            </p>
          )}
        </CardContent>
      </Card>

      <UserManagementDialog 
        user={selectedUser}
        open={managementDialogOpen}
        onOpenChange={setManagementDialogOpen}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}

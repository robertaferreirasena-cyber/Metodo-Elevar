import { useState, useEffect } from 'react';
import { useAdminData } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Settings, Ban, Trash2, Eye, EyeOff, Link as LinkIcon, Upload, Loader2, KeyRound, Shield } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { UserManagementDialog } from '@/components/admin/UserManagementDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResults, setResetResults] = useState<any>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [adminUserIds, setAdminUserIds] = useState<Set<string>>(new Set());

  // Fetch admin user IDs
  useEffect(() => {
    const fetchAdminIds = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');
        if (!error && data) {
          setAdminUserIds(new Set(data.map(r => r.user_id)));
        }
      } catch (err) {
        console.error('Error fetching admin roles:', err);
      }
    };
    fetchAdminIds();
  }, []);

  const KIWIFY_USERS = [
    { email: "rosetelles1968@outlook.com", fullName: "Roselaine Souza Telles Walker", kiwifyOrderId: "Mt6TsBK" },
    { email: "ana_angelica_acosta@yahoo.com.br", fullName: "Ana Angelica Borges Acosta", kiwifyOrderId: "6KtOctI" },
    { email: "robertabaggiotto@gmail.com", fullName: "Roberta Vestena Baggiotto", kiwifyOrderId: "QXW6Ou8" },
    { email: "crisarteembiscuit80@gmail.com", fullName: "Cristiane de Barros Alvares", kiwifyOrderId: "ubW0gsD" },
    { email: "pinowmilena@gmail.com", fullName: "Milena Henzel Pinow", kiwifyOrderId: "XpLsT1i" },
    { email: "kerberlaura0@gmail.com", fullName: "Laura Cristina Kerber", kiwifyOrderId: "0qNuoZo" },
    { email: "witekinha@yahoo.com.br", fullName: "Luciane Witek", kiwifyOrderId: "kPR9YGp" },
    { email: "micheleoliveirami531@gmail.com", fullName: "Michele Oliveira Carre", kiwifyOrderId: "aVy0VvG" },
    { email: "ivanete_a@hotmail.com", fullName: "Ivanete Chiodi", kiwifyOrderId: "p299FpE" },
    { email: "fabiana.knechtel@gmail.com", fullName: "Fabiana Knechtel", kiwifyOrderId: "PacgsLD" },
    { email: "tainara_marafon@hotmail.com", fullName: "Tainara Aparecida Marafon", kiwifyOrderId: "6cVqleM" },
    { email: "lenibergozza@hotmail.com.br", fullName: "Leni Natalina de Bergozza", kiwifyOrderId: "LZ2anrZ" },
    { email: "francileoncio@hotmail.com", fullName: "Francieli Leoncio", kiwifyOrderId: "WSfiiZ4" },
    { email: "alinejjoanelo16m@gmail.com", fullName: "Aline Joanelo", kiwifyOrderId: "ThouHNj" },
    { email: "cutelariaventania@gmail.com", fullName: "Cutelaria Ventania", kiwifyOrderId: "GAxFpLQ" },
    { email: "rb4324791@gmail.com", fullName: "Raquel Batista Kunz", kiwifyOrderId: "6WO4haS" },
    { email: "pittrichele@gmail.com", fullName: "Richele Girotto Pitt", kiwifyOrderId: "ncv4tXi" },
    { email: "tatielegt@hotmail.com", fullName: "Tatiele Knapp Kempf", kiwifyOrderId: "yXd1RV4" },
    { email: "izabelapasquali615@gmail.com", fullName: "Izabela Santos", kiwifyOrderId: "UxK3Pfn" },
    { email: "thaismanuellaalves@gmail.com", fullName: "Tais Alves", kiwifyOrderId: "BFtJJto" },
    { email: "anaaluisa70@gmail.com", fullName: "Ana Luisa Honaiser", kiwifyOrderId: "zjK2R1B" },
    { email: "contato.closetplusg@gmail.com", fullName: "Sabrina Gabriela dos Santos", kiwifyOrderId: "v2zdT2e" },
    { email: "marina.fiorenza4@gmail.com", fullName: "Marina Fiorenza", kiwifyOrderId: "yZZy6LD" },
    { email: "viviserena13@gmail.com", fullName: "Viviane Serena", kiwifyOrderId: "cZmw662" },
    { email: "elissavaris@hotmail.com", fullName: "Elisangela Terezinha Savaris", kiwifyOrderId: "1slbE1h" },
    { email: "lusi_leacrestani@hotmail.com", fullName: "Lusi Lea Crestani", kiwifyOrderId: "e8YP5LT" },
    { email: "carolinexavier6571@gmail.com", fullName: "Caroline dos Santos Xavier Fernandes", kiwifyOrderId: "4MP1JZg" },
  ];

  const handleBulkImport = async () => {
    setImportLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bulk-import-users', {
        body: { users: KIWIFY_USERS }
      });
      if (error) throw error;
      setImportResults(data);
      setImportDialogOpen(true);
      toast.success(`Importação concluída: ${data.summary.created} criados, ${data.summary.skipped} já existiam`);
      fetchUsers();
    } catch (err: any) {
      toast.error('Erro na importação: ' + err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const handleBulkResetPasswords = async () => {
    setResetLoading(true);
    try {
      const emails = KIWIFY_USERS.map(u => u.email);
      const { data, error } = await supabase.functions.invoke('bulk-reset-password', {
        body: { emails, newPassword: 'mentoragi123' }
      });
      if (error) throw error;
      setResetResults(data);
      setResetDialogOpen(true);
      toast.success(`Senhas resetadas: ${data.summary.success} atualizadas, ${data.summary.errors} erros`);
    } catch (err: any) {
      toast.error('Erro ao resetar senhas: ' + err.message);
    } finally {
      setResetLoading(false);
    }
  };

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
    // Refresh admin IDs
    supabase.from('user_roles').select('user_id').eq('role', 'admin').then(({ data }) => {
      if (data) setAdminUserIds(new Set(data.map(r => r.user_id)));
    });
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
            <BreadcrumbPage>Gerenciar Usuários</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h1>
        <p className="text-muted-foreground">
          {users.length} usuários • {blockedCount} bloqueados • {deletedCount} desativados
        </p>
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
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBulkImport}
                disabled={importLoading}
                className="gap-1"
              >
                {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Importar Kiwify (27)
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBulkResetPasswords}
                disabled={resetLoading}
                className="gap-1"
              >
                {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Resetar Senhas Kiwify
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
                <TableHead>Cargo</TableHead>
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
                    <TableCell>
                      {adminUserIds.has(user.user_id) ? (
                        <Badge className="bg-amber-500 text-white gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Usuário</span>
                      )}
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

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resultado da Importação</DialogTitle>
            <DialogDescription>
              {importResults && `${importResults.summary.created} criados, ${importResults.summary.skipped} pulados, ${importResults.summary.errors} erros`}
            </DialogDescription>
          </DialogHeader>
          {importResults?.results && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Senha Temporária</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importResults.results.map((r: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{r.email}</TableCell>
                    <TableCell className="text-sm">{r.fullName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'created' ? 'default' : r.status === 'skipped' ? 'secondary' : 'destructive'}>
                        {r.status === 'created' ? '✅ Criado' : r.status === 'skipped' ? '⏭️ Já existe' : '❌ Erro'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{r.tempPassword || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resultado do Reset de Senhas</DialogTitle>
            <DialogDescription>
              {resetResults && `${resetResults.summary.success} atualizadas, ${resetResults.summary.errors} erros de ${resetResults.summary.total} total`}
            </DialogDescription>
          </DialogHeader>
          {resetResults?.results && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resetResults.results.map((r: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{r.email}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'updated' ? 'default' : 'destructive'}>
                        {r.status === 'updated' ? '✅ Atualizado' : r.status === 'not_found' ? '⚠️ Não encontrado' : '❌ Erro'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.error || 'Senha definida como mentoragi123'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

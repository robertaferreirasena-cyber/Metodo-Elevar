import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, X, Tag, Shield, User, Calendar, Key, AlertTriangle, Trash2, RotateCcw, Mail, Link, Unlink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  deleted_at?: string | null;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface UserPermissions {
  module_group: boolean;
  module_sequences: boolean;
  module_community: boolean;
  module_favorites: boolean;
  module_history: boolean;
  module_persona: boolean;
  module_ideas: boolean;
  module_photoboss: boolean;
  custom_daily_limit: number | null;
  custom_monthly_limit: number | null;
  custom_persona_limit: number | null;
  custom_sequence_limit: number | null;
}

interface LinkedEmail {
  id: string;
  purchase_email: string;
  linked_at: string;
  notes: string | null;
}

interface PendingOrder {
  customer_email: string;
  customer_name: string | null;
  status: string;
  created_at: string;
  kiwify_order_id: string;
}

interface UserManagementDialogProps {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

const defaultPermissions: UserPermissions = {
  module_group: true,
  module_sequences: true,
  module_community: true,
  module_favorites: true,
  module_history: true,
  module_persona: true,
  module_ideas: true,
  module_photoboss: true,
  custom_daily_limit: null,
  custom_monthly_limit: null,
  custom_persona_limit: null,
  custom_sequence_limit: null,
};

export function UserManagementDialog({ user, open, onOpenChange, onUserUpdated }: UserManagementDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  
  // Subscription state
  const [plan, setPlan] = useState('free');
  const [status, setStatus] = useState('active');
  const [expiresAt, setExpiresAt] = useState('');
  
  // Block state
  const [blockReason, setBlockReason] = useState('');
  
  // Permissions state
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  
  // Tags state
  const [userTags, setUserTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');
  
  // Linked emails state
  const [linkedEmails, setLinkedEmails] = useState<LinkedEmail[]>([]);
  const [newLinkedEmail, setNewLinkedEmail] = useState('');
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  
  // Delete confirmation
  const [showHardDeleteConfirm, setShowHardDeleteConfirm] = useState(false);
  
  // Password reset
  const [newPassword, setNewPassword] = useState<string | null>(null);

  // Admin role state
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [showAdminConfirm, setShowAdminConfirm] = useState<'promote' | 'demote' | null>(null);

  useEffect(() => {
    if (user && open) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setPlan(user.plan || 'free');
      setStatus(user.status || 'active');
      setExpiresAt(user.expires_at ? user.expires_at.split('T')[0] : '');
      setBlockReason(user.block_reason || '');
      setNewPassword(null);
      setNewLinkedEmail('');
      setLinkedEmails([]);
      setPendingOrders([]);
      setIsUserAdmin(false);
      setShowAdminConfirm(null);
      loadUserData();
    }
  }, [user, open]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      // Load permissions
      const { data: permData } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'get_permissions', userId: user.user_id }
      });
      if (permData?.permissions) {
        setPermissions({ ...defaultPermissions, ...permData.permissions });
      }

      // Load user tags
      const { data: tagsData } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'get_user_tags', userId: user.user_id }
      });
      if (tagsData?.tags) {
        setUserTags(tagsData.tags.map((t: any) => t.user_tags));
      }

      // Load all available tags
      const { data: allTagsData } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'get_all_tags', userId: user.user_id }
      });
      if (allTagsData?.tags) {
        setAllTags(allTagsData.tags);
      }

      // Load linked emails
      const { data: linkedData } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'get_linked_emails', userId: user.user_id }
      });
      if (linkedData?.linkedEmails) {
        setLinkedEmails(linkedData.linkedEmails);
      }

      // Check admin status
      const { data: adminData } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'check_admin', userId: user.user_id }
      });
      if (adminData) {
        setIsUserAdmin(adminData.isAdmin === true);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadPendingOrders = async () => {
    if (!user) return;
    setIsLoadingEmails(true);
    try {
      const { data } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'get_pending_orders', userId: user.user_id }
      });
      if (data?.pendingOrders) {
        setPendingOrders(data.pendingOrders);
      }
    } catch (error) {
      console.error('Error loading pending orders:', error);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const handleAction = async (action: string, params: Record<string, any> = {}) => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: { action, userId: user.user_id, ...params }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data?.message || 'Operação realizada com sucesso');
      
      if (action === 'reset_password' && data?.tempPassword) {
        setNewPassword(data.tempPassword);
      }
      
      if (['hard_delete', 'soft_delete', 'restore', 'block', 'unblock'].includes(action)) {
        onUserUpdated();
        if (action === 'hard_delete') {
          onOpenChange(false);
        }
      }
      
      return data;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar operação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    await handleAction('update_profile', { fullName, email });
    onUserUpdated();
  };

  const handleSaveSubscription = async () => {
    await handleAction('update_subscription', { 
      plan, 
      status, 
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null 
    });
    onUserUpdated();
  };

  const handleSavePermissions = async () => {
    await handleAction('update_permissions', { permissions });
  };

  const handleBlock = async () => {
    await handleAction('block', { reason: blockReason });
  };

  const handleUnblock = async () => {
    await handleAction('unblock');
  };

  const handleAddTag = async (tagId: string) => {
    await handleAction('add_tag', { tagId });
    loadUserData();
  };

  const handleRemoveTag = async (tagId: string) => {
    await handleAction('remove_tag', { tagId });
    loadUserData();
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const result = await handleAction('create_tag', { name: newTagName, color: newTagColor });
    if (result?.tag) {
      setAllTags([...allTags, result.tag]);
      setNewTagName('');
    }
  };

  const handleLinkEmail = async (emailToLink?: string) => {
    const email = emailToLink || newLinkedEmail;
    if (!email.trim()) return;
    
    const result = await handleAction('link_email', { purchaseEmail: email });
    if (result?.success) {
      setNewLinkedEmail('');
      loadUserData();
      onUserUpdated();
      
      if (result.subscriptionActivated) {
        toast.success('Assinatura ativada automaticamente!', {
          description: `Encontrada compra paga para ${email}`
        });
      }
    }
  };

  const handleUnlinkEmail = async (linkedEmailId: string) => {
    await handleAction('unlink_email', { linkedEmailId });
    loadUserData();
  };

  const handleResetPassword = async () => {
    await handleAction('reset_password');
  };

  const isBlocked = user?.blocked_at != null;
  const isDeleted = user?.is_soft_deleted;

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Gerenciar Usuário
            </DialogTitle>
            <DialogDescription>
              {user.email} • {user.full_name || 'Sem nome'}
            </DialogDescription>
          </DialogHeader>

          {/* Status badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant={plan === 'pro' ? 'default' : 'secondary'}>
              {plan === 'pro' ? 'Pro' : 'Free'}
            </Badge>
            {isBlocked && (
              <Badge variant="destructive">Bloqueado</Badge>
            )}
            {isDeleted && (
              <Badge variant="outline" className="border-destructive text-destructive">Desativado</Badge>
            )}
            {isUserAdmin && (
              <Badge className="bg-amber-500 text-white">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
            {userTags.map(tag => (
              <Badge 
                key={tag.id} 
                style={{ backgroundColor: tag.color, color: '#fff' }}
                className="cursor-pointer"
                onClick={() => handleRemoveTag(tag.id)}
              >
                {tag.name} ×
              </Badge>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            if (value === 'emails') {
              loadPendingOrders();
            }
          }}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="subscription">Assinatura</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
              <TabsTrigger value="permissions">Permissões</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="actions">Ações</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button onClick={handleSaveProfile} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Perfil
              </Button>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={plan} onValueChange={setPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data de Expiração</Label>
                <Input 
                  type="date" 
                  value={expiresAt} 
                  onChange={(e) => setExpiresAt(e.target.value)} 
                />
              </div>
              <Button onClick={handleSaveSubscription} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Assinatura
              </Button>
            </TabsContent>

            <TabsContent value="emails" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Emails Vinculados
                </h4>
                <p className="text-xs text-muted-foreground">
                  Vincule emails de compra da Kiwify quando o cliente usou um email diferente para comprar e para acessar o app.
                </p>
                
                {/* Current linked emails */}
                {linkedEmails.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhum email vinculado</p>
                ) : (
                  <div className="space-y-2">
                    {linkedEmails.map((le) => (
                      <div key={le.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{le.purchase_email}</p>
                          <p className="text-xs text-muted-foreground">
                            Vinculado em {new Date(le.linked_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleUnlinkEmail(le.id)}
                          disabled={isLoading}
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new linked email */}
                <div className="flex gap-2">
                  <Input 
                    placeholder="Email da compra (ex: cliente@hotmail.com)"
                    value={newLinkedEmail}
                    onChange={(e) => setNewLinkedEmail(e.target.value)}
                    type="email"
                  />
                  <Button onClick={() => handleLinkEmail()} disabled={isLoading || !newLinkedEmail.trim()}>
                    <Link className="h-4 w-4 mr-2" />
                    Vincular
                  </Button>
                </div>
              </div>

              {/* Pending orders section */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Compras Pendentes
                  </h4>
                  <Button variant="outline" size="sm" onClick={loadPendingOrders} disabled={isLoadingEmails}>
                    {isLoadingEmails ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Compras pagas na Kiwify que não foram associadas a nenhum usuário. Clique para vincular ao usuário atual.
                </p>
                
                {isLoadingEmails ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhuma compra pendente</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {pendingOrders.map((order) => (
                      <div key={order.kiwify_order_id} className="flex items-center justify-between bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        <div>
                          <p className="text-sm font-medium">{order.customer_email}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.customer_name || 'Sem nome'} • {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleLinkEmail(order.customer_email)}
                          disabled={isLoading}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Vincular
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Módulos
                  </h4>
                  {[
                    { key: 'module_private', label: 'Modo Privado' },
                    { key: 'module_group', label: 'Modo Grupo' },
                    { key: 'module_sequences', label: 'Sequências' },
                    { key: 'module_community', label: 'Comunidade' },
                    { key: 'module_favorites', label: 'Favoritos' },
                    { key: 'module_history', label: 'Histórico' },
                    { key: 'module_persona', label: 'Persona Raio-X' },
                    { key: 'module_ideas', label: 'Gerador de Ideias' },
                    { key: 'module_photoboss', label: 'PhotoBoss' },
                    { key: 'module_conversation_analysis', label: 'Análise de Conversas' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-sm">{label}</Label>
                      <Switch 
                        checked={permissions[key as keyof UserPermissions] as boolean}
                        onCheckedChange={(checked) => setPermissions({ ...permissions, [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Limites Personalizados</h4>
                  <p className="text-xs text-muted-foreground">Deixe vazio para usar limites padrão do plano</p>
                  <div className="space-y-2">
                    <Label className="text-sm">Limite Diário</Label>
                    <Input 
                      type="number" 
                      placeholder="Padrão do plano"
                      value={permissions.custom_daily_limit ?? ''} 
                      onChange={(e) => setPermissions({ ...permissions, custom_daily_limit: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Limite Mensal</Label>
                    <Input 
                      type="number" 
                      placeholder="Padrão do plano"
                      value={permissions.custom_monthly_limit ?? ''} 
                      onChange={(e) => setPermissions({ ...permissions, custom_monthly_limit: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Limite Personas/mês</Label>
                    <Input 
                      type="number" 
                      placeholder="Padrão do plano"
                      value={permissions.custom_persona_limit ?? ''} 
                      onChange={(e) => setPermissions({ ...permissions, custom_persona_limit: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Limite Sequências/mês</Label>
                    <Input 
                      type="number" 
                      placeholder="Padrão do plano"
                      value={permissions.custom_sequence_limit ?? ''} 
                      onChange={(e) => setPermissions({ ...permissions, custom_sequence_limit: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleSavePermissions} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Permissões
              </Button>
            </TabsContent>

            <TabsContent value="tags" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Tags do Usuário
                </h4>
                <div className="flex flex-wrap gap-2">
                  {userTags.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma tag atribuída</p>
                  )}
                  {userTags.map(tag => (
                    <Badge 
                      key={tag.id} 
                      style={{ backgroundColor: tag.color, color: '#fff' }}
                      className="cursor-pointer"
                      onClick={() => handleRemoveTag(tag.id)}
                    >
                      {tag.name} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Adicionar Tag</h4>
                <div className="flex flex-wrap gap-2">
                  {allTags.filter(t => !userTags.find(ut => ut.id === t.id)).map(tag => (
                    <Badge 
                      key={tag.id} 
                      variant="outline"
                      style={{ borderColor: tag.color, color: tag.color }}
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => handleAddTag(tag.id)}
                    >
                      + {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">Criar Nova Tag</h4>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Nome da tag" 
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  <Input 
                    type="color" 
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-16"
                  />
                  <Button onClick={handleCreateTag} disabled={isLoading || !newTagName.trim()}>
                    Criar
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              {/* Admin Role */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Cargo de Administrador
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isUserAdmin ? 'Este usuário é administrador.' : 'Este usuário não é administrador.'}
                </p>
                {isUserAdmin ? (
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowAdminConfirm('demote')} 
                    disabled={isLoading}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Remover Admin
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setShowAdminConfirm('promote')} 
                    disabled={isLoading}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Promover a Admin
                  </Button>
                )}
              </div>

              {/* Block/Unblock */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Bloqueio
                </h4>
                {!isBlocked ? (
                  <>
                    <Textarea 
                      placeholder="Motivo do bloqueio (será exibido ao usuário)"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                    />
                    <Button variant="destructive" onClick={handleBlock} disabled={isLoading}>
                      Bloquear Usuário
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Bloqueado em: {new Date(user.blocked_at!).toLocaleString('pt-BR')}
                    </p>
                    {user.block_reason && (
                      <p className="text-sm">Motivo: {user.block_reason}</p>
                    )}
                    <Button onClick={handleUnblock} disabled={isLoading}>
                      Desbloquear Usuário
                    </Button>
                  </>
                )}
              </div>

              {/* Reset Password */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" /> Senha
                </h4>
                <Button onClick={handleResetPassword} disabled={isLoading}>
                  Resetar Senha
                </Button>
                {newPassword && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Nova senha temporária:</p>
                    <p className="font-mono font-bold text-lg">{newPassword}</p>
                    <p className="text-xs text-muted-foreground mt-1">Copie e envie ao usuário</p>
                  </div>
                )}
              </div>

              {/* Soft/Hard Delete */}
              <div className="border border-destructive rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" /> Exclusão
                </h4>
                {!isDeleted ? (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleAction('soft_delete')} 
                      disabled={isLoading}
                    >
                      Desativar (Soft Delete)
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowHardDeleteConfirm(true)} 
                      disabled={isLoading}
                    >
                      Excluir Permanentemente
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Usuário desativado em: {user.deleted_at ? new Date(user.deleted_at).toLocaleString('pt-BR') : 'N/A'}
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={() => handleAction('restore')} disabled={isLoading}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurar Usuário
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => setShowHardDeleteConfirm(true)} 
                        disabled={isLoading}
                      >
                        Excluir Permanentemente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Confirmation */}
      <AlertDialog open={showHardDeleteConfirm} onOpenChange={setShowHardDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>irreversível</strong>. O usuário {user.email} e todos os seus dados serão excluídos permanentemente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                handleAction('hard_delete');
                setShowHardDeleteConfirm(false);
              }}
            >
              Sim, excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Role Confirmation */}
      <AlertDialog open={showAdminConfirm !== null} onOpenChange={(open) => !open && setShowAdminConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showAdminConfirm === 'promote' ? 'Promover a administrador?' : 'Remover cargo de administrador?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showAdminConfirm === 'promote'
                ? `O usuário ${user.email} terá acesso total ao painel administrativo.`
                : `O usuário ${user.email} perderá acesso ao painel administrativo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const action = showAdminConfirm === 'promote' ? 'promote_admin' : 'demote_admin';
                setShowAdminConfirm(null);
                const result = await handleAction(action);
                if (result?.success) {
                  setIsUserAdmin(showAdminConfirm === 'promote');
                  loadUserData();
                }
              }}
            >
              {showAdminConfirm === 'promote' ? 'Sim, promover' : 'Sim, remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

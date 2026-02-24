

# Plano: Promover/Remover Administrador

## Resumo
Adicionar um botao no painel de gerenciamento de usuarios para promover ou remover o cargo de administrador.

## Alteracoes

### 1. Edge Function (`supabase/functions/admin-manage-user/index.ts`)
Adicionar duas novas actions:

- **`promote_admin`**: Insere na tabela `user_roles` o role `admin` para o usuario selecionado
- **`demote_admin`**: Remove o role `admin` da tabela `user_roles`
- **`check_admin`**: Verifica se o usuario ja e admin (para mostrar o estado correto no UI)

### 2. UserManagementDialog (`src/components/admin/UserManagementDialog.tsx`)
Na aba "Acoes" (actions tab), adicionar:

- Um indicador mostrando se o usuario e admin ou nao
- Botao "Promover a Admin" (com icone Shield) - aparece quando o usuario NAO e admin
- Botao "Remover Admin" (com icone Shield em vermelho) - aparece quando o usuario JA e admin
- Confirmacao via AlertDialog antes de executar a acao (para evitar cliques acidentais)

### 3. Fluxo de seguranca
- A acao so pode ser executada por quem ja e admin (verificado no backend pelo `is_admin` check existente)
- Nao sera possivel remover o proprio cargo de admin (protecao contra auto-remocao)

## Detalhes tecnicos

A tabela `user_roles` ja existe com a estrutura:
```
user_roles (id, user_id, role, created_at)
```
E o enum `app_role` ja inclui `admin`. As RLS policies ja permitem que admins gerenciem roles.

O codigo usara:
```sql
-- Promover
INSERT INTO user_roles (user_id, role) VALUES (userId, 'admin') ON CONFLICT DO NOTHING;

-- Remover  
DELETE FROM user_roles WHERE user_id = userId AND role = 'admin';

-- Verificar
SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = userId AND role = 'admin');
```


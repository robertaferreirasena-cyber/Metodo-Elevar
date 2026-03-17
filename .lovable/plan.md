

# Plano: Remover "Usuarios" do Sidebar e Manter Dentro do Painel Admin

## Resumo
Remover o link "Usuarios" que foi adicionado ao menu lateral (sidebar) e manter o acesso ao gerenciamento de usuarios exclusivamente atraves do card "Gerenciar Usuarios" dentro do Painel Administrativo (`/admin`).

## Alteracao

### Sidebar (`src/components/layout/AppSidebar.tsx`)
Remover o `SidebarMenuItem` de "Usuarios" que aponta para `/admin/usuarios`, revertendo a alteracao anterior. O menu Admin ficara assim:

```text
Admin
  - Painel Admin
  - WhatsApp
  - Chat
  - Agentes IA
  - Agenda
  - Analytics
  - Organizador
```

O acesso a pagina de usuarios continua funcionando normalmente pelo card "Gerenciar Usuarios" dentro do dashboard admin (`/admin`), que ja inclui todas as funcionalidades: ativar/desativar acesso, promover/remover admin, permissoes, tags e emails vinculados.

### Detalhes tecnicos
- Remover apenas as linhas 177-184 do arquivo `AppSidebar.tsx` (o bloco do SidebarMenuItem de Usuarios)
- Nenhuma outra alteracao necessaria - a rota `/admin/usuarios` e a pagina `AdminUsers.tsx` continuam existindo e acessiveis pelo card no dashboard


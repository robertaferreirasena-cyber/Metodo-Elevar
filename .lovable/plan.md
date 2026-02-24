

# Plano: Adicionar "Gerenciar Usuarios" no sidebar admin

## Resumo
Adicionar um link direto para a pagina de gerenciamento de usuarios (`/admin/usuarios`) na secao Admin do sidebar, para que o admin nao precise passar pelo dashboard para acessar a lista de usuarios.

## Alteracoes

### 1. Sidebar (`src/components/layout/AppSidebar.tsx`)
Adicionar um item "Usuarios" na secao Admin do sidebar, logo apos o "Painel Admin":

```text
🔐 Admin
  - Painel Admin     (Settings)
  - Usuarios         (Users)       <-- NOVO
  - WhatsApp         (Smartphone)
  - Chat             (MessagesSquare)
  - Agentes IA       (Bot)
  - Agenda           (CalendarDays)
  - Analytics        (BarChart3)
  - Organizador      (Sparkles)
```

Sera um `SidebarMenuItem` com icone `Users`, rota `/admin/usuarios`, usando o mesmo padrao dos outros itens.

### Detalhes tecnicos
- O icone `Users` ja esta importado no arquivo
- A rota `/admin/usuarios` ja existe e funciona (definida em App.tsx)
- Todas as funcionalidades de gerenciamento (promover admin, bloquear, permissoes, tags, emails vinculados) ja estao implementadas no `UserManagementDialog`
- Nenhuma alteracao de backend necessaria - tudo ja esta funcional


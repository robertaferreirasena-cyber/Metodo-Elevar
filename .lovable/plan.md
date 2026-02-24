

# Solucao: Confirmar email do usuario e revisar configuracao

## Problema identificado

O usuario `robertaferreirasena@gmail.com` (Roberta Sena) se cadastrou no sistema, mas o **email nao foi confirmado**. O Supabase bloqueia o login ate que o email seja verificado, retornando "Invalid login credentials".

## Solucao proposta

### Passo 1 - Confirmar o email manualmente via SQL

Executar um UPDATE na tabela `auth.users` para marcar o email como confirmado:

```sql
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'robertaferreirasena@gmail.com';
```

Isso vai permitir que a Roberta faca login imediatamente com a senha que ela cadastrou.

### Passo 2 - Verificar se o profile e subscription foram criados

O trigger `handle_new_user` deveria ter criado automaticamente o perfil e a assinatura. Precisamos verificar se isso aconteceu (a migracao foi feita depois do cadastro, entao pode nao ter disparado o trigger).

Se nao existirem, sera necessario criar manualmente:
- Registro na tabela `profiles`
- Registro na tabela `subscriptions` (plano free)
- Registro na tabela `user_roles` (role atendente)

### Passo 3 (Opcional) - Desabilitar confirmacao de email

Se voce quiser que futuros usuarios possam fazer login sem precisar confirmar o email, podemos desativar essa exigencia nas configuracoes do Supabase Auth (Dashboard > Authentication > Providers > Email > Confirm email).

## Detalhes tecnicos

- A tabela `auth.users` e gerenciada pelo Supabase e nao tem RLS, por isso o UPDATE precisa ser feito via migration ou SQL Editor
- O trigger `on_auth_user_created` pode nao ter sido executado para este usuario porque ele foi criado antes da migracao que criou o trigger
- Sera necessario verificar e corrigir os dados nas tabelas `profiles`, `subscriptions` e `user_roles` manualmente


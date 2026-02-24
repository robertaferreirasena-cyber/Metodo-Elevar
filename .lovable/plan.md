

## Definir senha padrao "mentoragi123" para os 27 usuarios importados

### Resumo

Criar uma Edge Function que redefine a senha de todos os 27 usuarios importados da Kiwify para a senha padrao `mentoragi123`, usando o metodo `auth.admin.updateUserById`.

### O que sera feito

1. **Criar Edge Function `bulk-reset-password`** que:
   - Recebe uma lista de emails e a nova senha
   - Valida que o chamador e admin
   - Para cada email, busca o usuario na tabela `profiles`
   - Usa `supabaseAdmin.auth.admin.updateUserById()` para redefinir a senha
   - Retorna relatorio de sucesso/erro para cada usuario

2. **Adicionar botao na pagina Admin Usuarios** para executar o reset em lote com a senha padrao `mentoragi123` para os 27 emails da lista Kiwify

### Lista de emails que terao a senha redefinida (27)

Os mesmos 27 emails ja cadastrados na importacao anterior:
- rosetelles1968@outlook.com
- ana_angelica_acosta@yahoo.com.br
- robertabaggiotto@gmail.com
- crisarteembiscuit80@gmail.com
- pinowmilena@gmail.com
- kerberlaura0@gmail.com
- witekinha@yahoo.com.br
- micheleoliveirami531@gmail.com
- ivanete_a@hotmail.com
- fabiana.knechtel@gmail.com
- tainara_marafon@hotmail.com
- lenibergozza@hotmail.com.br
- francileoncio@hotmail.com
- alinejjoanelo16m@gmail.com
- cutelariaventania@gmail.com
- rb4324791@gmail.com
- pittrichele@gmail.com
- tatielegt@hotmail.com
- izabelapasquali615@gmail.com
- thaismanuellaalves@gmail.com
- anaaluisa70@gmail.com
- contato.closetplusg@gmail.com
- marina.fiorenza4@gmail.com
- viviserena13@gmail.com
- elissavaris@hotmail.com
- lusi_leacrestani@hotmail.com
- carolinexavier6571@gmail.com

### Detalhes Tecnicos

**Edge Function `bulk-reset-password/index.ts`:**
- Endpoint recebe `{ emails: string[], newPassword: string }`
- Autentica o chamador como admin via token JWT
- Para cada email:
  - Busca o `user_id` na tabela `profiles`
  - Chama `auth.admin.updateUserById(userId, { password: newPassword })`
- Retorna `{ summary: { total, success, errors }, results: [...] }`

**Pagina AdminUsers.tsx:**
- Adiciona botao "Resetar Senhas Kiwify" ao lado do botao de importacao existente
- Ao clicar, chama a Edge Function com os 27 emails e a senha `mentoragi123`
- Exibe dialogo com resultado (quantos foram atualizados com sucesso)

### Resultado esperado

Todos os 27 usuarios poderao fazer login com:
- **Email:** seu email pessoal
- **Senha:** mentoragi123

Recomenda-se orientar os usuarios a trocar a senha apos o primeiro acesso.


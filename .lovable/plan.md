
## Importar 26 Clientes Assinantes da Kiwify

### Resumo

Criar uma Edge Function de importacao em lote que registra automaticamente os 26 clientes com status "paid" do CSV como usuarios do app com plano Pro e 1 ano de acesso.

### Clientes a importar (26 pagos, excluindo 7 "waiting_payment")

| # | Nome | Email | Kiwify ID |
|---|------|-------|-----------|
| 1 | ROSELAINE SOUZA TELLES WALKER | rosetelles1968@outlook.com | Mt6TsBK |
| 2 | Ana Angelica Borges Acosta | ana_angelica_acosta@yahoo.com.br | 6KtOctI |
| 3 | ROBERTA VESTENA BAGGIOTTO | robertabaggiotto@gmail.com | QXW6Ou8 |
| 4 | Cristiane de Barros Alvares | crisarteembiscuit80@gmail.com | ubW0gsD |
| 5 | Milena Henzel Pinow | pinowmilena@gmail.com | XpLsT1i |
| 6 | Laura Cristina Kerber | kerberlaura0@gmail.com | 0qNuoZo |
| 7 | Luciane Witek | witekinha@yahoo.com.br | kPR9YGp |
| 8 | Michele Oliveira Carre | micheleoliveirami531@gmail.com | aVy0VvG |
| 9 | Ivanete Chiodi | ivanete_a@hotmail.com | p299FpE |
| 10 | Fabiana Knechtel | fabiana.knechtel@gmail.com | PacgsLD |
| 11 | Tainara Aparecida Marafon | tainara_marafon@hotmail.com | 6cVqleM |
| 12 | Leni Natalina de | lenibergozza@hotmail.com.br | LZ2anrZ |
| 13 | Francieli Leoncio | francileoncio@hotmail.com | WSfiiZ4 |
| 14 | Alinejoanelo | alinejjoanelo16m@gmail.com | ThouHNj |
| 15 | cutelaria ventania | cutelariaventania@gmail.com | GAxFpLQ |
| 16 | Raquel Batista Kunz | rb4324791@gmail.com | 6WO4haS |
| 17 | RICHELE GIROTTO PITT | pittrichele@gmail.com | ncv4tXi |
| 18 | Tatiele knapp kempf | tatielegt@hotmail.com | yXd1RV4 |
| 19 | Izabela Santos | izabelapasquali615@gmail.com | UxK3Pfn |
| 20 | Tais Alves | thaismanuellaalves@gmail.com | BFtJJto |
| 21 | Ana Luisa Honaiser | anaaluisa70@gmail.com | zjK2R1B |
| 22 | Sabrina Gabriela dos Santos | contato.closetplusg@gmail.com | v2zdT2e |
| 23 | Marina Fiorenza | marina.fiorenza4@gmail.com | yZZy6LD |
| 24 | Viviane serena | viviserena13@gmail.com | cZmw662 |
| 25 | Elisangela Terezinha Savaris | elissavaris@hotmail.com | 1slbE1h |
| 26 | Lusi Lea Crestani | lusi_leacrestani@hotmail.com | e8YP5LT |
| -- | CAROLINE DOS SANTOS XAVIER FERNANDES | carolinexavier6571@gmail.com | 4MP1JZg |

Total: **27 usuarios unicos pagos** (descontando duplicatas de waiting_payment)

### O que sera feito

1. **Criar Edge Function `bulk-import-users`** que:
   - Recebe a lista de usuarios (email, nome, kiwify_order_id)
   - Valida que o chamador e admin
   - Para cada usuario:
     - Cria conta via `auth.admin.createUser` com senha temporaria
     - Aguarda o trigger `handle_new_user` criar profile e subscription
     - Atualiza subscription para plano `pro`, status `active`, expiracao em 1 ano, `payment_source: 'kiwify'`, com o `kiwify_order_id`
   - Registra cada venda na tabela `kiwify_orders`
   - Retorna relatorio com senhas temporarias e status de cada importacao
   - Pula emails duplicados ja existentes

2. **Criar pagina/botao de importacao no admin** (ou executar via curl) com os dados hardcoded do CSV

3. **Registrar ordens na tabela `kiwify_orders`** para manter historico consistente

### Detalhes Tecnicos

- A Edge Function reutiliza a logica existente de `admin-create-user` mas em lote
- Cada usuario recebe senha temporaria gerada automaticamente
- O resultado inclui todas as senhas para que voce possa enviar aos clientes
- Emails duplicados sao ignorados automaticamente
- Vendas `waiting_payment` sao excluidas da importacao
- Expiracao: 1 ano a partir da data de importacao

### Resultado esperado

Apos a execucao, todos os 27 clientes pagos terao:
- Conta criada com email confirmado
- Plano Pro ativo por 1 ano
- Registro da ordem Kiwify vinculado
- Senha temporaria para primeiro acesso

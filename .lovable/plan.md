

## Problema: Login falha com "captcha verification process failed"

O Supabase do projeto tem **CAPTCHA habilitado** nas configurações de autenticação (no dashboard), mas o código do app **não envia nenhum `captcha_token`** nas chamadas de `signInWithPassword` ou `signUp`. Isso causa erro 500 em toda tentativa de login.

### Causa raiz

No painel do Supabase (Authentication > Settings), há um provedor de CAPTCHA ativo (provavelmente Turnstile ou hCaptcha). O servidor exige o token, mas o frontend não implementa nenhum widget de CAPTCHA.

### Solução recomendada: Desabilitar CAPTCHA no dashboard

Como o app não usa CAPTCHA no frontend, a solução mais rápida e segura é:

1. Acesse o **Supabase Dashboard** > **Authentication** > **Settings** (Bot and Abuse Protection)
2. **Desabilite** o CAPTCHA provider (mude para "None" / desligado)
3. Salve as alterações

Isso resolve o erro imediatamente sem precisar alterar nenhum código.

### Alternativa (se quiser manter CAPTCHA)

Se por algum motivo o CAPTCHA precisa ficar ativo, seria necessário:
- Instalar o widget do provedor (Turnstile/hCaptcha) no frontend
- Passar o `captchaToken` nas chamadas `signIn` e `signUp` via `options.captchaToken`
- Isso é mais complexo e normalmente desnecessário para este tipo de app

### Ação imediata

A correção é apenas no dashboard do Supabase — nenhuma mudança de código é necessária.


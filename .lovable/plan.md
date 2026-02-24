

## Adicionar botao de visualizar senha na tela de Login

### Resumo

Adicionar um icone de "olhinho" (Eye/EyeOff) no campo de senha da pagina de Login, permitindo ao usuario alternar entre visualizar e ocultar a senha digitada. O mesmo padrao ja existe na pagina `ResetPassword.tsx`.

### O que sera feito

**Arquivo: `src/pages/Login.tsx`**

1. Importar os icones `Eye` e `EyeOff` do `lucide-react`
2. Adicionar estado `showPassword` para controlar a visibilidade
3. Envolver o campo de senha em um `div` com `position: relative`
4. Adicionar botao com o icone Eye/EyeOff posicionado a direita do campo
5. Alternar o `type` do input entre `password` e `text` conforme o estado

### Detalhes Tecnicos

O padrao sera identico ao ja utilizado em `ResetPassword.tsx`:

```tsx
const [showPassword, setShowPassword] = useState(false);

<div className="relative">
  <Input
    id="password"
    type={showPassword ? 'text' : 'password'}
    ...
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
  >
    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
</div>
```

Alteracao simples e isolada, sem impacto em outros componentes.


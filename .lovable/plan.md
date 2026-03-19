

## Plano: Auto-preenchimento com Raio-X da Persona

### O que será feito

Adicionar um botão "Preencher com Raio-X" nas páginas **TrafficAds** e **ManyChatFlows** que puxa os dados completos da persona e preenche automaticamente os campos de **Produto/Serviço** e **Público-alvo**.

### Dados mapeados

| Campo do formulário | Dados do Raio-X usados |
|---|---|
| **Produto/Serviço** | `product_description` + `main_differentiator` + `transformation` + `price_range` |
| **Público-alvo** | `target_gender` + `target_age_range` + `target_profession` + `target_location` + `main_pain` + dados do `raioX` (dores, desejos, medos) |

### Comportamento

- O botão só aparece quando `hasProfile === true`
- Ao clicar, os campos são preenchidos com texto descritivo montado a partir dos dados da persona
- O usuário pode editar os campos após o preenchimento
- Substitui o banner passivo atual ("Dados do Raio-X serão usados automaticamente") por um botão ativo + banner informativo

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/pages/TrafficAds.tsx` | Adicionar botão "Preencher com Raio-X" que seta `product` e `audience` |
| `src/pages/ManyChatFlows.tsx` | Mesmo botão com mesma lógica |

### Detalhes técnicos

Ambas as páginas já importam `usePersonaContext`. Será adicionado acesso a `formData` e `raioX` (já disponíveis no contexto). A função de preenchimento monta strings descritivas:

```typescript
// Produto
const productText = [formData.product_description, formData.main_differentiator, formData.transformation]
  .filter(Boolean).join(". ");

// Público
const audienceParts = [];
if (formData.target_gender) audienceParts.push(formData.target_gender);
if (formData.target_age_range) audienceParts.push(formData.target_age_range);
if (formData.target_profession) audienceParts.push(formData.target_profession);
if (formData.target_location) audienceParts.push(formData.target_location);
if (formData.main_pain) audienceParts.push(`Dor principal: ${formData.main_pain}`);
if (raioX?.desejos?.length) audienceParts.push(`Desejos: ${raioX.desejos.slice(0,3).join(", ")}`);
```

O botão terá ícone `Zap` e texto "Preencher com Raio-X", posicionado logo acima dos campos de texto.


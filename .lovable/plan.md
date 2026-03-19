

## Plano: Corrigir PDF Premium — Letras Estranhas e Margens

### Problema

1. **Letras estranhas**: jsPDF com fonte Helvetica embutida não renderiza corretamente caracteres acentuados do português (ã, é, ç, ô, etc.), gerando caracteres corrompidos no PDF
2. **Texto ultrapassando margens**: Algumas chamadas diretas a `doc.text()` no header (linhas 339, 344, 349) não usam `splitTextToSize`, podendo ultrapassar a folha

### Solução

**Abordagem**: Criar função `sanitize(text)` que remove acentos usando `String.normalize("NFD").replace(...)`, garantindo compatibilidade total com a fonte Helvetica padrão do jsPDF. Aplicar em todo texto antes de escrever no PDF.

### Mudanças em `AdManagerSimulator.tsx`

1. **Adicionar helper `sanitize`**:
```typescript
function sanitize(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
```

2. **Aplicar `sanitize` em `writeText`** — envolver `text` com `sanitize()` antes de `splitTextToSize`

3. **Aplicar `sanitize` nas chamadas diretas** — header do PDF (título, subtítulo, data) que usam `doc.text()` diretamente

4. **Ajustar chamadas diretas no header** para usar `splitTextToSize` respeitando `maxW`, evitando overflow lateral

### Arquivo modificado

| Arquivo | Mudança |
|---|---|
| `src/components/traffic/AdManagerSimulator.tsx` | Adicionar `sanitize()`, aplicar em todo texto do PDF, ajustar header para respeitar margens |


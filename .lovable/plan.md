

## Plano: Corrigir redirecionamento de missões para Insta PRO

### Problema Encontrado

A missão "Ajustar posicionamento nas redes" tem `activity_type = 'instapro'` no banco (correto) e o `ACTIVITY_CONFIG` mapeia para `/aprendizado?tab=instapro` (correto). O `navigate()` funciona. **Porém**, na página `LearningModules.tsx`, o `useEffect` que lê os query params só trata `tab=carousel` — ignora completamente `tab=instapro`. Resultado: o usuário chega na página mas fica na aba "Encontros" em vez de abrir a aba "Insta PRO".

### Dados do banco (confirmados)

| Missão | activity_type | Status |
|---|---|---|
| Ajustar posicionamento nas redes | `instapro` | Rota correta, aba não abre |
| Atualizar Instagram completamente | `instapro` | Mesmo problema |
| Criar ensaio fotográfico estratégico | `foto` | OK (rota `/ensaio-fotografico` funciona) |
| Todas as demais (financeiro, metas, trafego) | corretos | OK (rotas diretas, sem tabs) |

### Correção

**Arquivo: `src/pages/LearningModules.tsx`** (linhas 27-38)

Expandir o `useEffect` para também tratar `tab=instapro`:

```typescript
useEffect(() => {
  const tab = searchParams.get("tab");
  const topic = searchParams.get("topic");
  if (tab === "carousel") {
    if (topic) {
      setCarouselTopic(decodeURIComponent(topic));
      toast.success("Tema recebido! Gerando carrossel...");
    }
    setActiveTab("carousel");
    setSearchParams({}, { replace: true });
  } else if (tab === "instapro") {
    setActiveTab("instapro");
    setSearchParams({}, { replace: true });
  }
}, [searchParams, setSearchParams]);
```

Isso é a única mudança necessária. Todas as demais missões estão com activity_type e rotas corretos no banco.


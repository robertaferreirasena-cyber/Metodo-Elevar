

## Plano: Upload de Catálogo/Produtos na Persona e Central Financeira

### Visão Geral

Duas funcionalidades de upload de arquivos (PDF, imagens, texto) de catálogos/produtos:

1. **Persona Raio-X** — Upload no Step 2 (Produto) para que a IA considere o conteúdo dos materiais ao gerar o Raio-X
2. **Central Financeira** — Upload na Calculadora de Produto e Serviço para extrair preços reais e gerar insights de precificação

### Infraestrutura

#### Storage Bucket (migração SQL)
Criar bucket `product-catalogs` para armazenar os arquivos:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('product-catalogs', 'product-catalogs', false);
-- RLS: usuário autenticado pode upload/read seus próprios arquivos
```

#### Edge Function: `catalog-extractor`
Nova edge function que recebe URLs dos arquivos uploadados, baixa o conteúdo, extrai texto (para PDFs/texto) e retorna um resumo estruturado dos produtos/serviços com preços, descrições e categorias. Para imagens, usa a IA com visão para descrever o catálogo.

### 1. Persona Raio-X — Upload de Materiais

**Onde**: Step 2 (Produto) do wizard, abaixo do campo "O que você vende?"

**UI**: Área de drag-and-drop com lista de arquivos enviados (nome + badge de tipo + botão remover). Aceita PDF, imagens (JPG/PNG), TXT. Máximo 5 arquivos, 10MB cada.

**Fluxo**:
1. Usuário faz upload dos arquivos no Step 2
2. Arquivos são salvos no bucket `product-catalogs`
3. URLs dos arquivos são armazenadas no state do formulário
4. Ao gerar o Raio-X, a edge function `persona-generator` recebe as URLs
5. A edge function extrai texto dos arquivos e inclui como contexto adicional no prompt da IA

**Mudanças na Edge Function `persona-generator`**:
- Receber campo `catalogFiles: string[]` (URLs)
- Para cada URL, fazer fetch e extrair conteúdo textual
- Incluir no prompt: `MATERIAIS DO CATÁLOGO/PRODUTOS:\n{conteúdo extraído}`

### 2. Central Financeira — Import de Catálogo

**Onde**: Nova seção "Importar Catálogo" dentro da aba Produto e aba Serviço

**UI**: Botão "📦 Importar Catálogo" que abre um dialog com:
- Área de upload (mesmos tipos: PDF, imagens, texto)
- Botão "Analisar" que envia para uma edge function
- Resultado: lista de produtos detectados com preços sugeridos, custos estimados e insights

**Edge Function: `catalog-price-analyzer`**
- Recebe URLs dos arquivos + contexto do negócio (nicho da persona se disponível)
- Extrai produtos/preços dos materiais
- Retorna JSON com: produtos detectados, preços sugeridos, insights de margem, recomendações de precificação
- O usuário pode importar os produtos detectados direto para a calculadora

### Arquivos

| Arquivo | Mudança |
|---|---|
| `src/pages/PersonaRaioX.tsx` | Adicionar zona de upload no Step 2 com lista de arquivos |
| `src/hooks/usePersonaProfile.ts` | Adicionar campo `catalogFileUrls` ao state e enviar para edge function |
| `supabase/functions/persona-generator/index.ts` | Receber `catalogFiles`, extrair conteúdo e injetar no prompt |
| `src/pages/PriceCalculator.tsx` | Adicionar botão e dialog "Importar Catálogo" nas abas Produto e Serviço |
| `src/components/catalog/CatalogUploader.tsx` | Componente reutilizável de upload de catálogo (novo) |
| `src/components/catalog/CatalogAnalysisResult.tsx` | Componente para exibir resultados da análise (novo) |
| `supabase/functions/catalog-price-analyzer/index.ts` | Nova edge function para análise de preços (novo) |
| SQL Migration | Criar bucket `product-catalogs` + RLS policies |

### Detalhes Técnicos

**Extração de texto na Edge Function**: Para PDFs e textos, o conteúdo é baixado via fetch da URL do storage. Para imagens, o modelo de IA com visão (gemini-2.5-flash-lite) recebe a imagem em base64 para descrever os produtos visíveis.

**Limite de contexto**: O conteúdo extraído dos catálogos é truncado em ~3000 caracteres para não estourar o limite de tokens da IA, mantendo as informações mais relevantes (nomes, preços, descrições).

**Componente CatalogUploader**: Reutilizável entre Persona e Financeiro, aceita `onFilesUploaded(urls: string[])` como callback.


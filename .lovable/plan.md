

## Plano: Duplicação A/B + Checklist de Configuração

### 1. Duplicar campanhas para variações A/B

**AdManagerSimulator.tsx**:
- Adicionar `duplicateMutation` que copia a campanha selecionada no banco (`ad_campaigns`) com nome sufixado "(Variação B)", "(Variação C)" etc.
- Botão "Duplicar A/B" no header da campanha (ao lado de "Exportar PDF")
- Após duplicar, seleciona automaticamente a nova campanha

**CampaignStructurePanel.tsx**:
- Adicionar prop `onDuplicateCampaign` e botão "Duplicar" ao lado de "Ver" e "Excluir" no painel lateral

### 2. Checklist de configuração

**AdManagerSimulator.tsx**:
- Adicionar um card "Checklist de Implementação" abaixo da tabela hierárquica
- Lista de passos com checkboxes (estado local, sem persistência) adaptados à plataforma:
  - Meta: Criar campanha no Meta Ads Manager → Configurar objetivo → Definir orçamento → Configurar público → Selecionar posicionamentos → Criar anúncios → Instalar Pixel → Publicar
  - Google: Criar campanha no Google Ads → Configurar objetivo → Definir lances → Configurar grupos → Criar anúncios → Vincular conversões → Publicar
  - TikTok: Criar campanha no TikTok Ads → Configurar objetivo → Definir orçamento → Configurar público → Criar anúncios → Instalar Pixel → Publicar
- Barra de progresso mostrando % de passos concluídos
- Usa `Checkbox` do shadcn/ui

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/components/traffic/AdManagerSimulator.tsx` | Adicionar duplicateMutation, botão "Duplicar A/B", card Checklist |
| `src/components/traffic/CampaignStructurePanel.tsx` | Adicionar botão "Duplicar" e prop `onDuplicateCampaign` |

Nenhuma alteração de banco de dados necessária — a duplicação usa INSERT na tabela `ad_campaigns` existente.


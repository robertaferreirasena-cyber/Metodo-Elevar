# Plano: Jornada do Aluno + Hub Pages + Menu Simplificado

## Status: ✅ Implementado

## O que foi feito

### 1. Sidebar Simplificado (`AppSidebar.tsx`)
- Rebrand: "Mentoria Elevar" / "Sua assistente de vendas"
- Menu reduzido: Dashboard, WhatsApp, Mentora Gi, Aprendizado, Conquistas
- Seção "Mais" collapsible com itens secundários

### 2. WhatsApp Hub (`/whatsapp`) - NOVA
- Página centralizando todas ferramentas de WhatsApp
- Seções: Vendas Privadas (1:1) e Grupos & Comunidade
- Stats de conversas e favoritos

### 3. Mentora Gi Hub (`/mentora-hub`) - NOVA
- Hub com CTA principal para chat + recursos relacionados
- Links para Ideias, Persona, Ensaio Foto

### 4. Dashboard = Jornada do Aluno
- Card de boas-vindas contextualizado para mentoria
- Card "Sua Próxima Atividade" baseado em learning_lessons
- Progresso do aluno (%, nível XP, streak)
- Acesso rápido aos 4 hubs principais
- Persona insights mantidos

### 5. Migração: `activity_type` em `learning_lessons`
- Coluna `activity_type text default null` adicionada
- Valores: whatsapp_private, whatsapp_group, persona, content, mentor, calculator, photo

### 6. Rotas atualizadas
- `/whatsapp` → WhatsAppHub
- `/mentora-hub` → MentoraHub

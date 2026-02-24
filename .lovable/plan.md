

# Migracao SQL Completa do Projeto

## Resumo

O banco de dados esta completamente vazio. A migracao vai criar toda a infraestrutura necessaria para o projeto funcionar.

## O que sera criado

- **1 enum**: `app_role` com valores `admin`, `user`, `atendente`, `desenvolvedor`
- **25 tabelas**: profiles, subscriptions, user_roles, conversations, messages, favorites, sequences, sequence_posts, persona_profiles, usage_limits, user_feature_permissions, user_tags, user_tag_assignments, linked_emails, kiwify_orders, community_messages, community_materials, community_polls, community_poll_votes, community_reactions, crm_pipeline_stages, crm_contacts, crm_deals, crm_activities, whatsapp_instances, whatsapp_messages, whatsapp_ai_agents, whatsapp_contact_tags, whatsapp_followup_alerts
- **~50 politicas RLS** para seguranca
- **10 funcoes RPC**: is_admin, has_role, handle_new_user, handle_new_user_usage_limits, check_and_reset_usage, increment_usage, track_token_usage, get_all_profiles, get_all_subscriptions, get_token_stats, get_tokens_by_feature, update_updated_at_column, update_user_feature_permissions_updated_at
- **10 triggers** para auto-update de timestamps e setup automatico de novos usuarios
- **1 trigger em auth.users** para auto-criar profile, subscription e role quando um usuario se registra

## Ordem de execucao

A migracao sera executada em uma unica operacao SQL, organizada na seguinte ordem para respeitar dependencias de foreign keys:

1. Enum `app_role`
2. Funcoes base (is_admin, has_role, update_updated_at_column, etc.)
3. Tabelas sem dependencias (profiles, user_tags, kiwify_orders, crm_pipeline_stages, whatsapp_instances)
4. Tabelas com dependencia de profiles (subscriptions, user_roles, conversations, sequences, community_messages, crm_contacts, etc.)
5. Tabelas com dependencias secundarias (messages, favorites, sequence_posts, community_polls, crm_deals, whatsapp_messages, etc.)
6. Tabelas com dependencias terciarias (community_poll_votes, community_reactions, crm_activities)
7. Todas as politicas RLS
8. Todos os triggers
9. Trigger `on_auth_user_created` em `auth.users` para handle_new_user

## Detalhes tecnicos

O SQL fornecido sera reordenado para que as funcoes (`is_admin`, `has_role`, etc.) sejam criadas antes das tabelas, pois as politicas RLS referenciam essas funcoes. As tabelas serao criadas na ordem correta de dependencias de foreign keys. Nenhuma alteracao no codigo frontend e necessaria.


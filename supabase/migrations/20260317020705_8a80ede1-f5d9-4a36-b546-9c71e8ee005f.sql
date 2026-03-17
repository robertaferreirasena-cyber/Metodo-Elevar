
-- Drop all WhatsApp-related tables
DROP TABLE IF EXISTS public.whatsapp_followup_alerts CASCADE;
DROP TABLE IF EXISTS public.whatsapp_contact_tags CASCADE;
DROP TABLE IF EXISTS public.whatsapp_ai_agents CASCADE;
DROP TABLE IF EXISTS public.whatsapp_messages CASCADE;
DROP TABLE IF EXISTS public.whatsapp_instances CASCADE;

-- Drop all CRM-related tables
DROP TABLE IF EXISTS public.crm_activities CASCADE;
DROP TABLE IF EXISTS public.crm_deals CASCADE;
DROP TABLE IF EXISTS public.crm_contacts CASCADE;
DROP TABLE IF EXISTS public.crm_pipeline_stages CASCADE;


-- STEP 1: ENUM
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'atendente', 'desenvolvedor');

-- STEP 2: TABLES (no functions referenced yet)

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.user_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#6366f1'::text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT user_tags_name_key UNIQUE (name)
);

CREATE TABLE public.kiwify_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kiwify_order_id text NOT NULL,
  customer_email text NOT NULL,
  customer_name text,
  product_id text,
  product_name text,
  status text NOT NULL DEFAULT 'paid'::text,
  amount integer,
  processed_at timestamp with time zone DEFAULT now(),
  raw_payload jsonb,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT kiwify_orders_kiwify_order_id_key UNIQUE (kiwify_order_id)
);

CREATE TABLE public.crm_pipeline_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1'::text,
  "position" integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.whatsapp_instances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  instance_token text NOT NULL,
  phone text,
  status text DEFAULT 'disconnected'::text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  webhook_url text,
  webhook_enabled boolean DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free'::text,
  status text NOT NULL DEFAULT 'active'::text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  kiwify_order_id text,
  payment_source text DEFAULT 'manual'::text,
  blocked_at timestamp with time zone,
  block_reason text,
  deleted_at timestamp with time zone,
  is_soft_deleted boolean DEFAULT false,
  PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_key UNIQUE (user_id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  type text NOT NULL DEFAULT 'strategy'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  product text NOT NULL,
  goal text NOT NULL,
  total_posts integer NOT NULL DEFAULT 5,
  duration text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  webhook_url text,
  whatsapp_group_id text,
  whatsapp_group_name text,
  send_mode text NOT NULL DEFAULT 'uazapi'::text,
  PRIMARY KEY (id),
  CONSTRAINT sequences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.persona_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_name text,
  niche text,
  sub_niche text,
  time_in_market text,
  sales_channels text[],
  product_description text,
  price_range text,
  main_differentiator text,
  transformation text,
  target_gender text,
  target_age_range text,
  target_profession text,
  target_location text,
  main_pain text,
  previous_attempts text,
  sales_challenges text,
  common_objections text,
  improvement_goals text,
  generated_raio_x jsonb,
  suggested_templates text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT persona_profiles_user_id_key UNIQUE (user_id)
);

CREATE TABLE public.usage_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  daily_requests integer NOT NULL DEFAULT 0,
  monthly_requests integer NOT NULL DEFAULT 0,
  persona_requests_month integer NOT NULL DEFAULT 0,
  sequence_requests_month integer NOT NULL DEFAULT 0,
  last_request_at timestamp with time zone,
  reset_daily_at date NOT NULL DEFAULT CURRENT_DATE,
  reset_monthly_at date NOT NULL DEFAULT (date_trunc('month', CURRENT_DATE::timestamp with time zone))::date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tokens_used_daily integer DEFAULT 0,
  tokens_used_monthly integer DEFAULT 0,
  tokens_by_feature jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id),
  CONSTRAINT usage_limits_user_id_key UNIQUE (user_id)
);

CREATE TABLE public.user_feature_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_private boolean DEFAULT true,
  module_group boolean DEFAULT true,
  module_sequences boolean DEFAULT true,
  module_community boolean DEFAULT true,
  module_favorites boolean DEFAULT true,
  module_history boolean DEFAULT true,
  module_persona boolean DEFAULT true,
  module_ideas boolean DEFAULT true,
  module_photoboss boolean DEFAULT true,
  module_conversation_analysis boolean DEFAULT true,
  custom_daily_limit integer,
  custom_monthly_limit integer,
  custom_persona_limit integer,
  custom_sequence_limit integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT user_feature_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_feature_permissions_user_id_key UNIQUE (user_id)
);

CREATE TABLE public.user_tag_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT user_tag_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.user_tags(id),
  CONSTRAINT user_tag_assignments_user_id_tag_id_key UNIQUE (user_id, tag_id)
);

CREATE TABLE public.linked_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  purchase_email text NOT NULL,
  linked_by uuid NOT NULL,
  linked_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  PRIMARY KEY (id),
  CONSTRAINT linked_emails_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT linked_emails_linked_by_fkey FOREIGN KEY (linked_by) REFERENCES public.profiles(id),
  CONSTRAINT linked_emails_purchase_email_key UNIQUE (purchase_email)
);

CREATE TABLE public.community_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text'::text,
  attachment_url text,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  reply_to_id uuid,
  PRIMARY KEY (id),
  CONSTRAINT community_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT community_messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.community_messages(id)
);

CREATE TABLE public.community_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  uploaded_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text,
  downloads integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT community_materials_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);

CREATE TABLE public.crm_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  source text DEFAULT 'outro'::text,
  notes text,
  tags text[] DEFAULT '{}'::text[],
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT crm_contacts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
);

CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_id uuid,
  content text NOT NULL,
  title text,
  type text NOT NULL DEFAULT 'strategy'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT favorites_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id)
);

CREATE TABLE public.sequence_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL,
  post_order integer NOT NULL,
  timing text NOT NULL,
  objective text NOT NULL,
  content text NOT NULL,
  expected_reaction text,
  tips text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  scheduled_at timestamp with time zone,
  send_status text NOT NULL DEFAULT 'draft'::text,
  send_error text,
  sent_at timestamp with time zone,
  PRIMARY KEY (id),
  CONSTRAINT sequence_posts_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.sequences(id)
);

CREATE TABLE public.community_polls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT community_polls_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.community_messages(id)
);

CREATE TABLE public.community_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT community_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT community_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.community_messages(id),
  CONSTRAINT community_reactions_message_id_user_id_emoji_key UNIQUE (message_id, user_id, emoji)
);

CREATE TABLE public.crm_deals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  title text NOT NULL,
  value numeric DEFAULT 0,
  expected_close_date date,
  status text NOT NULL DEFAULT 'open'::text,
  lost_reason text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  priority text DEFAULT 'medium'::text,
  notes text,
  PRIMARY KEY (id),
  CONSTRAINT crm_deals_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.crm_pipeline_stages(id),
  CONSTRAINT crm_deals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT crm_deals_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id)
);

CREATE TABLE public.whatsapp_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  instance_id uuid,
  message_id text,
  from_number text NOT NULL,
  to_number text,
  body text,
  message_type text DEFAULT 'text'::text,
  media_url text,
  is_from_me boolean DEFAULT false,
  status text DEFAULT 'received'::text,
  raw_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT whatsapp_messages_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.whatsapp_instances(id)
);

CREATE TABLE public.whatsapp_ai_agents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL,
  group_id text NOT NULL,
  group_name text,
  is_active boolean DEFAULT true,
  system_prompt text DEFAULT 'Você é um assistente de vendas inteligente. Responda de forma natural, amigável e persuasiva. Use técnicas de copywriting e neuromarketing.'::text,
  trigger_mode text DEFAULT 'mention'::text,
  trigger_keywords text[] DEFAULT '{}'::text[],
  response_delay_seconds integer DEFAULT 5,
  max_responses_per_hour integer DEFAULT 20,
  responses_this_hour integer DEFAULT 0,
  hour_reset_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  agent_type text DEFAULT 'custom'::text,
  knowledge_base text DEFAULT ''::text,
  use_persona_context boolean DEFAULT true,
  use_copy_formats boolean DEFAULT false,
  PRIMARY KEY (id),
  CONSTRAINT whatsapp_ai_agents_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.whatsapp_instances(id)
);

CREATE TABLE public.whatsapp_contact_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL,
  contact_phone text NOT NULL,
  tag text NOT NULL DEFAULT 'novo'::text,
  notes text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT whatsapp_contact_tags_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.whatsapp_instances(id),
  CONSTRAINT whatsapp_contact_tags_instance_id_contact_phone_key UNIQUE (instance_id, contact_phone)
);

CREATE TABLE public.whatsapp_followup_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL,
  contact_phone text NOT NULL,
  contact_name text DEFAULT ''::text,
  alert_type text NOT NULL DEFAULT 'no_response'::text,
  alert_message text NOT NULL,
  suggested_action text DEFAULT ''::text,
  priority text DEFAULT 'medium'::text,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT whatsapp_followup_alerts_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.whatsapp_instances(id)
);

CREATE TABLE public.community_poll_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL,
  user_id uuid NOT NULL,
  option_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT community_poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT community_poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.community_polls(id),
  CONSTRAINT community_poll_votes_poll_id_user_id_key UNIQUE (poll_id, user_id)
);

CREATE TABLE public.crm_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid,
  deal_id uuid,
  type text NOT NULL DEFAULT 'note'::text,
  title text NOT NULL,
  description text,
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT crm_activities_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.crm_deals(id),
  CONSTRAINT crm_activities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT crm_activities_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id)
);

-- STEP 3: FUNCTIONS (tables exist now)

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = check_user_id AND role = 'admin') $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_user_feature_permissions_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name) VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO public.subscriptions (user_id, plan, status) VALUES (NEW.id, 'free', 'active');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'atendente') ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_usage_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN INSERT INTO public.usage_limits (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.check_and_reset_usage(p_user_id uuid)
RETURNS TABLE(out_daily_requests integer, out_monthly_requests integer, out_persona_requests_month integer, out_sequence_requests_month integer, out_needs_daily_reset boolean, out_needs_monthly_reset boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_limits RECORD;
  v_today DATE := CURRENT_DATE;
  v_current_month DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_needs_daily_reset boolean;
  v_needs_monthly_reset boolean;
BEGIN
  SELECT * INTO v_limits FROM public.usage_limits WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO public.usage_limits (user_id) VALUES (p_user_id) RETURNING * INTO v_limits;
  END IF;
  v_needs_daily_reset := v_limits.reset_daily_at < v_today;
  v_needs_monthly_reset := v_limits.reset_monthly_at < v_current_month;
  IF v_needs_daily_reset OR v_needs_monthly_reset THEN
    UPDATE public.usage_limits SET
      daily_requests = CASE WHEN v_needs_daily_reset THEN 0 ELSE usage_limits.daily_requests END,
      monthly_requests = CASE WHEN v_needs_monthly_reset THEN 0 ELSE usage_limits.monthly_requests END,
      persona_requests_month = CASE WHEN v_needs_monthly_reset THEN 0 ELSE usage_limits.persona_requests_month END,
      sequence_requests_month = CASE WHEN v_needs_monthly_reset THEN 0 ELSE usage_limits.sequence_requests_month END,
      tokens_used_daily = CASE WHEN v_needs_daily_reset THEN 0 ELSE usage_limits.tokens_used_daily END,
      tokens_used_monthly = CASE WHEN v_needs_monthly_reset THEN 0 ELSE usage_limits.tokens_used_monthly END,
      tokens_by_feature = CASE WHEN v_needs_monthly_reset THEN '{}'::jsonb ELSE usage_limits.tokens_by_feature END,
      reset_daily_at = CASE WHEN v_needs_daily_reset THEN v_today ELSE usage_limits.reset_daily_at END,
      reset_monthly_at = CASE WHEN v_needs_monthly_reset THEN v_current_month ELSE usage_limits.reset_monthly_at END
    WHERE user_id = p_user_id
    RETURNING usage_limits.daily_requests, usage_limits.monthly_requests, usage_limits.persona_requests_month, usage_limits.sequence_requests_month
    INTO out_daily_requests, out_monthly_requests, out_persona_requests_month, out_sequence_requests_month;
  ELSE
    out_daily_requests := v_limits.daily_requests;
    out_monthly_requests := v_limits.monthly_requests;
    out_persona_requests_month := v_limits.persona_requests_month;
    out_sequence_requests_month := v_limits.sequence_requests_month;
  END IF;
  out_needs_daily_reset := v_needs_daily_reset;
  out_needs_monthly_reset := v_needs_monthly_reset;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_function_type text DEFAULT 'general')
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.usage_limits SET
    daily_requests = daily_requests + 1,
    monthly_requests = monthly_requests + 1,
    persona_requests_month = CASE WHEN p_function_type = 'persona' THEN persona_requests_month + 1 ELSE persona_requests_month END,
    sequence_requests_month = CASE WHEN p_function_type = 'sequence' THEN sequence_requests_month + 1 ELSE sequence_requests_month END,
    last_request_at = NOW()
  WHERE user_id = p_user_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_token_usage(p_user_id uuid, p_feature text, p_tokens integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_current_feature_tokens integer;
BEGIN
  SELECT COALESCE((tokens_by_feature->>p_feature)::integer, 0) INTO v_current_feature_tokens FROM usage_limits WHERE user_id = p_user_id;
  UPDATE usage_limits SET
    tokens_used_daily = tokens_used_daily + p_tokens,
    tokens_used_monthly = tokens_used_monthly + p_tokens,
    tokens_by_feature = jsonb_set(COALESCE(tokens_by_feature, '{}'::jsonb), ARRAY[p_feature], to_jsonb(v_current_feature_tokens + p_tokens))
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS SETOF profiles LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT * FROM public.profiles WHERE public.is_admin(auth.uid()) $$;

CREATE OR REPLACE FUNCTION public.get_all_subscriptions()
RETURNS TABLE(id uuid, user_id uuid, plan text, status text, started_at timestamptz, expires_at timestamptz, kiwify_order_id text, payment_source text, email text, full_name text, blocked_at timestamptz, block_reason text, is_soft_deleted boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT s.id, s.user_id, s.plan, s.status, s.started_at, s.expires_at, s.kiwify_order_id, s.payment_source, p.email, p.full_name, s.blocked_at, s.block_reason, COALESCE(s.is_soft_deleted, false)
  FROM public.subscriptions s JOIN public.profiles p ON p.id = s.user_id WHERE public.is_admin(auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.get_token_stats()
RETURNS TABLE(total_tokens_used bigint, total_requests bigint, active_users bigint, avg_tokens_per_user numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(tokens_used_monthly), 0)::bigint, COALESCE(SUM(monthly_requests), 0)::bigint, COUNT(DISTINCT user_id)::bigint,
    CASE WHEN COUNT(DISTINCT user_id) > 0 THEN ROUND(COALESCE(SUM(tokens_used_monthly), 0)::numeric / COUNT(DISTINCT user_id), 0) ELSE 0 END
  FROM usage_limits WHERE monthly_requests > 0
$$;

CREATE OR REPLACE FUNCTION public.get_tokens_by_feature()
RETURNS TABLE(feature text, tokens bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT key as feature, COALESCE(SUM(value::numeric), 0)::bigint as tokens
  FROM usage_limits, jsonb_each_text(tokens_by_feature) GROUP BY key ORDER BY tokens DESC
$$;

-- STEP 4: RLS + POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON public.subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any subscription" ON public.subscriptions FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete subscriptions" ON public.subscriptions FOR DELETE TO authenticated USING (is_admin(auth.uid()));

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (is_admin(auth.uid()));

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create own conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create messages in own conversations" ON public.messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));
CREATE POLICY "Users can view messages from own conversations" ON public.messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create own favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create their own sequences" ON public.sequences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sequences" ON public.sequences FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own sequences" ON public.sequences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own sequences" ON public.sequences FOR UPDATE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.sequence_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create posts for their sequences" ON public.sequence_posts FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM sequences WHERE sequences.id = sequence_posts.sequence_id AND sequences.user_id = auth.uid()));
CREATE POLICY "Users can delete posts from their sequences" ON public.sequence_posts FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM sequences WHERE sequences.id = sequence_posts.sequence_id AND sequences.user_id = auth.uid()));
CREATE POLICY "Users can view posts from their sequences" ON public.sequence_posts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM sequences WHERE sequences.id = sequence_posts.sequence_id AND sequences.user_id = auth.uid()));
CREATE POLICY "Users can update posts from their sequences" ON public.sequence_posts FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM sequences WHERE sequences.id = sequence_posts.sequence_id AND sequences.user_id = auth.uid()));

ALTER TABLE public.persona_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create their own persona profile" ON public.persona_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own persona profile" ON public.persona_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own persona profile" ON public.persona_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own persona profile" ON public.persona_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service can insert usage limits" ON public.usage_limits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage limits" ON public.usage_limits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own usage limits" ON public.usage_limits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all usage limits" ON public.usage_limits FOR SELECT TO authenticated USING (is_admin(auth.uid()));

ALTER TABLE public.user_feature_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage permissions" ON public.user_feature_permissions FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can view own permissions" ON public.user_feature_permissions FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage tags" ON public.user_tags FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can view tags" ON public.user_tags FOR SELECT TO authenticated USING (true);

ALTER TABLE public.user_tag_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage tag assignments" ON public.user_tag_assignments FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can view own tags" ON public.user_tag_assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.linked_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage linked emails" ON public.linked_emails FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can view own linked emails" ON public.linked_emails FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.kiwify_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all orders" ON public.kiwify_orders FOR SELECT TO authenticated USING (is_admin(auth.uid()));

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can update messages" ON public.community_messages FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can view messages" ON public.community_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own messages" ON public.community_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages or admins" ON public.community_messages FOR DELETE TO authenticated USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

ALTER TABLE public.community_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can create materials" ON public.community_materials FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can delete materials" ON public.community_materials FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update materials" ON public.community_materials FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can view materials" ON public.community_materials FOR SELECT TO authenticated USING (true);

ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can create polls" ON public.community_polls FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can delete polls" ON public.community_polls FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can view polls" ON public.community_polls FOR SELECT TO authenticated USING (true);

ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view votes" ON public.community_poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can change their vote" ON public.community_poll_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can remove their vote" ON public.community_poll_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can vote" ON public.community_poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view reactions" ON public.community_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add their own reactions" ON public.community_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own reactions" ON public.community_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access on crm_pipeline_stages" ON public.crm_pipeline_stages FOR ALL TO authenticated USING (is_admin(auth.uid()));

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access on crm_contacts" ON public.crm_contacts FOR ALL TO authenticated USING (is_admin(auth.uid()));

ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access on crm_deals" ON public.crm_deals FOR ALL TO authenticated USING (is_admin(auth.uid()));

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access on crm_activities" ON public.crm_activities FOR ALL TO authenticated USING (is_admin(auth.uid()));

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access" ON public.whatsapp_instances FOR ALL TO authenticated USING (is_admin(auth.uid()));

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage whatsapp_messages" ON public.whatsapp_messages FOR ALL TO authenticated USING (is_admin(auth.uid()));

ALTER TABLE public.whatsapp_ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage ai agents" ON public.whatsapp_ai_agents FOR ALL TO authenticated USING (is_admin(auth.uid()));

ALTER TABLE public.whatsapp_contact_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage contact tags" ON public.whatsapp_contact_tags FOR ALL TO authenticated USING (is_admin(auth.uid()));

ALTER TABLE public.whatsapp_followup_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage followup alerts" ON public.whatsapp_followup_alerts FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- STEP 5: TRIGGERS

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_deals_updated_at BEFORE UPDATE ON public.crm_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_persona_profiles_updated_at BEFORE UPDATE ON public.persona_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER on_profile_created_usage_limits AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_new_user_usage_limits();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_feature_permissions_timestamp BEFORE UPDATE ON public.user_feature_permissions FOR EACH ROW EXECUTE FUNCTION update_user_feature_permissions_updated_at();
CREATE TRIGGER update_whatsapp_contact_tags_updated_at BEFORE UPDATE ON public.whatsapp_contact_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_followup_alerts_updated_at BEFORE UPDATE ON public.whatsapp_followup_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON public.whatsapp_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 6: AUTH TRIGGER
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

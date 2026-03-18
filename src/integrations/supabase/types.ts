export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          condition_type: string
          condition_value: number | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          category?: string | null
          condition_type?: string
          condition_value?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          category?: string | null
          condition_type?: string
          condition_value?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      agent_knowledge_base: {
        Row: {
          agent_key: string
          agent_name: string
          id: string
          system_prompt: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          agent_key: string
          agent_name: string
          id?: string
          system_prompt: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          agent_key?: string
          agent_name?: string
          id?: string
          system_prompt?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      community_materials: {
        Row: {
          created_at: string | null
          description: string | null
          downloads: number | null
          file_type: string | null
          file_url: string
          id: string
          title: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          downloads?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          title: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          downloads?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          message_type: string | null
          reply_to_id: string | null
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          message_type?: string | null
          reply_to_id?: string | null
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          message_type?: string | null
          reply_to_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_polls: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          message_id: string
          options: Json
          question: string
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          message_id: string
          options?: Json
          question: string
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          message_id?: string
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_polls_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          content: string
          created_at: string
          id: string
          message_id: string | null
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_id?: string | null
          title?: string | null
          type?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_id?: string | null
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kiwify_orders: {
        Row: {
          amount: number | null
          created_at: string | null
          customer_email: string
          customer_name: string | null
          id: string
          kiwify_order_id: string
          processed_at: string | null
          product_id: string | null
          product_name: string | null
          raw_payload: Json | null
          status: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          customer_email: string
          customer_name?: string | null
          id?: string
          kiwify_order_id: string
          processed_at?: string | null
          product_id?: string | null
          product_name?: string | null
          raw_payload?: Json | null
          status?: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string | null
          id?: string
          kiwify_order_id?: string
          processed_at?: string | null
          product_id?: string | null
          product_name?: string | null
          raw_payload?: Json | null
          status?: string
        }
        Relationships: []
      }
      learning_lessons: {
        Row: {
          activity_type: string | null
          content: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          module_id: string
          position: number | null
          title: string
          video_url: string | null
        }
        Insert: {
          activity_type?: string | null
          content?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          module_id: string
          position?: number | null
          title: string
          video_url?: string | null
        }
        Update: {
          activity_type?: string | null
          content?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          module_id?: string
          position?: number | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_modules: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          position: number | null
          title: string
          total_lessons: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          position?: number | null
          title: string
          total_lessons?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          position?: number | null
          title?: string
          total_lessons?: number | null
        }
        Relationships: []
      }
      linked_emails: {
        Row: {
          id: string
          linked_at: string
          linked_by: string
          notes: string | null
          purchase_email: string
          user_id: string
        }
        Insert: {
          id?: string
          linked_at?: string
          linked_by: string
          notes?: string | null
          purchase_email: string
          user_id: string
        }
        Update: {
          id?: string
          linked_at?: string
          linked_by?: string
          notes?: string | null
          purchase_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linked_emails_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linked_emails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_conversations: {
        Row: {
          created_at: string | null
          id: string
          persona: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          persona?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          persona?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mentor_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_status: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          current_step: number
          id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_profiles: {
        Row: {
          business_name: string | null
          common_objections: string | null
          created_at: string
          generated_raio_x: Json | null
          id: string
          improvement_goals: string | null
          main_differentiator: string | null
          main_pain: string | null
          niche: string | null
          previous_attempts: string | null
          price_range: string | null
          product_description: string | null
          sales_challenges: string | null
          sales_channels: string[] | null
          sub_niche: string | null
          suggested_templates: string[] | null
          target_age_range: string | null
          target_gender: string | null
          target_location: string | null
          target_profession: string | null
          time_in_market: string | null
          transformation: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          common_objections?: string | null
          created_at?: string
          generated_raio_x?: Json | null
          id?: string
          improvement_goals?: string | null
          main_differentiator?: string | null
          main_pain?: string | null
          niche?: string | null
          previous_attempts?: string | null
          price_range?: string | null
          product_description?: string | null
          sales_challenges?: string | null
          sales_channels?: string[] | null
          sub_niche?: string | null
          suggested_templates?: string[] | null
          target_age_range?: string | null
          target_gender?: string | null
          target_location?: string | null
          target_profession?: string | null
          time_in_market?: string | null
          transformation?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          common_objections?: string | null
          created_at?: string
          generated_raio_x?: Json | null
          id?: string
          improvement_goals?: string | null
          main_differentiator?: string | null
          main_pain?: string | null
          niche?: string | null
          previous_attempts?: string | null
          price_range?: string | null
          product_description?: string | null
          sales_challenges?: string | null
          sales_channels?: string[] | null
          sub_niche?: string | null
          suggested_templates?: string[] | null
          target_age_range?: string | null
          target_gender?: string | null
          target_location?: string | null
          target_profession?: string | null
          time_in_market?: string | null
          transformation?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_goals: {
        Row: {
          average_ticket: number
          created_at: string | null
          id: string
          month: string
          monthly_target: number
          niche: string | null
          updated_at: string | null
          user_id: string
          working_days: number
        }
        Insert: {
          average_ticket?: number
          created_at?: string | null
          id?: string
          month?: string
          monthly_target?: number
          niche?: string | null
          updated_at?: string | null
          user_id: string
          working_days?: number
        }
        Update: {
          average_ticket?: number
          created_at?: string | null
          id?: string
          month?: string
          monthly_target?: number
          niche?: string | null
          updated_at?: string | null
          user_id?: string
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_records: {
        Row: {
          created_at: string | null
          goal_id: string
          id: string
          notes: string | null
          quantity: number
          record_date: string
          total_value: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal_id: string
          id?: string
          notes?: string | null
          quantity?: number
          record_date?: string
          total_value?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal_id?: string
          id?: string
          notes?: string | null
          quantity?: number
          record_date?: string
          total_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_records_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "sales_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_posts: {
        Row: {
          content: string
          created_at: string
          expected_reaction: string | null
          id: string
          objective: string
          post_order: number
          scheduled_at: string | null
          send_error: string | null
          send_status: string
          sent_at: string | null
          sequence_id: string
          timing: string
          tips: string | null
        }
        Insert: {
          content: string
          created_at?: string
          expected_reaction?: string | null
          id?: string
          objective: string
          post_order: number
          scheduled_at?: string | null
          send_error?: string | null
          send_status?: string
          sent_at?: string | null
          sequence_id: string
          timing: string
          tips?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          expected_reaction?: string | null
          id?: string
          objective?: string
          post_order?: number
          scheduled_at?: string | null
          send_error?: string | null
          send_status?: string
          sent_at?: string | null
          sequence_id?: string
          timing?: string
          tips?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequence_posts_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequences: {
        Row: {
          created_at: string
          description: string | null
          duration: string | null
          goal: string
          id: string
          product: string
          send_mode: string
          title: string
          total_posts: number
          user_id: string
          webhook_url: string | null
          whatsapp_group_id: string | null
          whatsapp_group_name: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: string | null
          goal: string
          id?: string
          product: string
          send_mode?: string
          title: string
          total_posts?: number
          user_id: string
          webhook_url?: string | null
          whatsapp_group_id?: string | null
          whatsapp_group_name?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string | null
          goal?: string
          id?: string
          product?: string
          send_mode?: string
          title?: string
          total_posts?: number
          user_id?: string
          webhook_url?: string | null
          whatsapp_group_id?: string | null
          whatsapp_group_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_commitments: {
        Row: {
          annual_goal: string | null
          annual_revenue: string | null
          commitment_text: string | null
          created_at: string | null
          current_revenue: string | null
          generated_copy: string | null
          id: string
          main_challenge: string | null
          quarterly_goal: string | null
          signature_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annual_goal?: string | null
          annual_revenue?: string | null
          commitment_text?: string | null
          created_at?: string | null
          current_revenue?: string | null
          generated_copy?: string | null
          id?: string
          main_challenge?: string | null
          quarterly_goal?: string | null
          signature_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annual_goal?: string | null
          annual_revenue?: string | null
          commitment_text?: string | null
          created_at?: string | null
          current_revenue?: string | null
          generated_copy?: string | null
          id?: string
          main_challenge?: string | null
          quarterly_goal?: string | null
          signature_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          block_reason: string | null
          blocked_at: string | null
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_soft_deleted: boolean | null
          kiwify_order_id: string | null
          payment_source: string | null
          plan: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          block_reason?: string | null
          blocked_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_soft_deleted?: boolean | null
          kiwify_order_id?: string | null
          payment_source?: string | null
          plan?: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          block_reason?: string | null
          blocked_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_soft_deleted?: boolean | null
          kiwify_order_id?: string | null
          payment_source?: string | null
          plan?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_limits: {
        Row: {
          created_at: string
          daily_requests: number
          id: string
          last_request_at: string | null
          monthly_requests: number
          persona_requests_month: number
          reset_daily_at: string
          reset_monthly_at: string
          sequence_requests_month: number
          tokens_by_feature: Json | null
          tokens_used_daily: number | null
          tokens_used_monthly: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_requests?: number
          id?: string
          last_request_at?: string | null
          monthly_requests?: number
          persona_requests_month?: number
          reset_daily_at?: string
          reset_monthly_at?: string
          sequence_requests_month?: number
          tokens_by_feature?: Json | null
          tokens_used_daily?: number | null
          tokens_used_monthly?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          daily_requests?: number
          id?: string
          last_request_at?: string | null
          monthly_requests?: number
          persona_requests_month?: number
          reset_daily_at?: string
          reset_monthly_at?: string
          sequence_requests_month?: number
          tokens_by_feature?: Json | null
          tokens_used_daily?: number | null
          tokens_used_monthly?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feature_permissions: {
        Row: {
          created_at: string | null
          custom_daily_limit: number | null
          custom_monthly_limit: number | null
          custom_persona_limit: number | null
          custom_sequence_limit: number | null
          id: string
          module_community: boolean | null
          module_conversation_analysis: boolean | null
          module_favorites: boolean | null
          module_group: boolean | null
          module_history: boolean | null
          module_ideas: boolean | null
          module_persona: boolean | null
          module_photoboss: boolean | null
          module_private: boolean | null
          module_sequences: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_daily_limit?: number | null
          custom_monthly_limit?: number | null
          custom_persona_limit?: number | null
          custom_sequence_limit?: number | null
          id?: string
          module_community?: boolean | null
          module_conversation_analysis?: boolean | null
          module_favorites?: boolean | null
          module_group?: boolean | null
          module_history?: boolean | null
          module_ideas?: boolean | null
          module_persona?: boolean | null
          module_photoboss?: boolean | null
          module_private?: boolean | null
          module_sequences?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_daily_limit?: number | null
          custom_monthly_limit?: number | null
          custom_persona_limit?: number | null
          custom_sequence_limit?: number | null
          id?: string
          module_community?: boolean | null
          module_conversation_analysis?: boolean | null
          module_favorites?: boolean | null
          module_group?: boolean | null
          module_history?: boolean | null
          module_ideas?: boolean | null
          module_persona?: boolean | null
          module_photoboss?: boolean | null
          module_private?: boolean | null
          module_sequences?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feature_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learning_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tag_assignments: {
        Row: {
          created_at: string | null
          id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "user_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tag_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          id: string
          last_activity_at: string | null
          level: number | null
          streak_days: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          last_activity_at?: string | null
          level?: number | null
          streak_days?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          last_activity_at?: string | null
          level?: number | null
          streak_days?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_xp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_reset_usage: {
        Args: { p_user_id: string }
        Returns: {
          out_daily_requests: number
          out_monthly_requests: number
          out_needs_daily_reset: boolean
          out_needs_monthly_reset: boolean
          out_persona_requests_month: number
          out_sequence_requests_month: number
        }[]
      }
      get_all_profiles: {
        Args: never
        Returns: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_all_subscriptions: {
        Args: never
        Returns: {
          block_reason: string
          blocked_at: string
          email: string
          expires_at: string
          full_name: string
          id: string
          is_soft_deleted: boolean
          kiwify_order_id: string
          payment_source: string
          plan: string
          started_at: string
          status: string
          user_id: string
        }[]
      }
      get_token_stats: {
        Args: never
        Returns: {
          active_users: number
          avg_tokens_per_user: number
          total_requests: number
          total_tokens_used: number
        }[]
      }
      get_tokens_by_feature: {
        Args: never
        Returns: {
          feature: string
          tokens: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage: {
        Args: { p_function_type?: string; p_user_id: string }
        Returns: boolean
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { check_user_id: string }; Returns: boolean }
      track_token_usage: {
        Args: { p_feature: string; p_tokens: number; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "atendente" | "desenvolvedor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "atendente", "desenvolvedor"],
    },
  },
} as const

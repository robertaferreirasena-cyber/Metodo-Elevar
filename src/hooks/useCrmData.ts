import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CrmContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  notes: string | null;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CrmPipelineStage {
  id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
}

export interface CrmDeal {
  id: string;
  contact_id: string;
  stage_id: string;
  title: string;
  value: number;
  expected_close_date: string | null;
  status: string;
  lost_reason: string | null;
  priority: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // joined
  contact?: CrmContact;
  stage?: CrmPipelineStage;
}

export interface CrmActivity {
  id: string;
  contact_id: string | null;
  deal_id: string | null;
  type: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  // joined
  contact?: CrmContact;
  deal?: CrmDeal;
}

export function useCrmContacts() {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('crm_contacts')
      .select('*')
      .order('created_at', { ascending: false });
    setContacts((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (contact: Partial<CrmContact>) => {
    const { error } = await supabase.from('crm_contacts').insert(contact as any);
    if (!error) await fetch();
    return { error };
  };

  const update = async (id: string, updates: Partial<CrmContact>) => {
    const { error } = await supabase.from('crm_contacts').update(updates as any).eq('id', id);
    if (!error) await fetch();
    return { error };
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('crm_contacts').delete().eq('id', id);
    if (!error) await fetch();
    return { error };
  };

  return { contacts, loading, fetch, create, update, remove };
}

export function useCrmStages() {
  const [stages, setStages] = useState<CrmPipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('crm_pipeline_stages')
      .select('*')
      .order('position', { ascending: true });
    setStages((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { stages, loading, fetch };
}

export function useCrmDeals() {
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('crm_deals')
      .select('*, contact:crm_contacts(*), stage:crm_pipeline_stages(*)')
      .order('created_at', { ascending: false });
    setDeals((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (deal: Partial<CrmDeal>) => {
    const { error } = await supabase.from('crm_deals').insert(deal as any);
    if (!error) await fetch();
    return { error };
  };

  const update = async (id: string, updates: Partial<CrmDeal>) => {
    const { error } = await supabase.from('crm_deals').update(updates as any).eq('id', id);
    if (!error) await fetch();
    return { error };
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('crm_deals').delete().eq('id', id);
    if (!error) await fetch();
    return { error };
  };

  return { deals, loading, fetch, create, update, remove };
}

export function useCrmActivities() {
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('crm_activities')
      .select('*, contact:crm_contacts(id, name), deal:crm_deals(id, title)')
      .order('created_at', { ascending: false });
    setActivities((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (activity: Partial<CrmActivity>) => {
    const { error } = await supabase.from('crm_activities').insert(activity as any);
    if (!error) await fetch();
    return { error };
  };

  const complete = async (id: string) => {
    const { error } = await supabase
      .from('crm_activities')
      .update({ completed_at: new Date().toISOString() } as any)
      .eq('id', id);
    if (!error) await fetch();
    return { error };
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('crm_activities').delete().eq('id', id);
    if (!error) await fetch();
    return { error };
  };

  return { activities, loading, fetch, create, complete, remove };
}

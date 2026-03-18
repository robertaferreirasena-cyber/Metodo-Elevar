
CREATE TABLE public.financial_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_type text NOT NULL DEFAULT 'financial_map',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  label text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.financial_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own snapshots" ON public.financial_snapshots
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_financial_snapshots_updated_at
  BEFORE UPDATE ON public.financial_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

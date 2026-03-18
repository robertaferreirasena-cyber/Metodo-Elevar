
-- Sales Goals table
CREATE TABLE public.sales_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  monthly_target numeric NOT NULL DEFAULT 0,
  average_ticket numeric NOT NULL DEFAULT 0,
  working_days integer NOT NULL DEFAULT 22,
  niche text,
  month date NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals" ON public.sales_goals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sales Records table
CREATE TABLE public.sales_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES public.sales_goals(id) ON DELETE CASCADE,
  record_date date NOT NULL DEFAULT CURRENT_DATE,
  quantity integer NOT NULL DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, goal_id, record_date)
);

ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own records" ON public.sales_records
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on sales_goals
CREATE TRIGGER update_sales_goals_updated_at
  BEFORE UPDATE ON public.sales_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

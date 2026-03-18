ALTER TABLE public.strategic_commitments ADD COLUMN IF NOT EXISTS generated_copy text;
ALTER TABLE public.strategic_commitments ADD COLUMN IF NOT EXISTS signature_name text;
ALTER TABLE public.strategic_commitments ADD COLUMN IF NOT EXISTS annual_revenue text;
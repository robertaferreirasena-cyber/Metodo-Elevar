
-- Add new fields to crm_deals
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS notes text;

-- Delete existing stages and insert new ones
DELETE FROM crm_pipeline_stages WHERE id NOT IN (SELECT DISTINCT stage_id FROM crm_deals);

-- Update remaining stages to new schema, then insert missing ones
-- First, let's just delete all and re-insert, remapping deals to first stage
DO $$
DECLARE
  v_novo_id uuid := gen_random_uuid();
BEGIN
  -- Create temp mapping
  UPDATE crm_deals SET stage_id = v_novo_id WHERE stage_id IN (SELECT id FROM crm_pipeline_stages);
  
  -- Delete all old stages
  DELETE FROM crm_pipeline_stages;
  
  -- Insert new stages
  INSERT INTO crm_pipeline_stages (id, name, color, position) VALUES
    (v_novo_id, 'Novo contato', '#3b82f6', 0),
    (gen_random_uuid(), 'Em contato', '#8b5cf6', 1),
    (gen_random_uuid(), 'Apresentação', '#06b6d4', 2),
    (gen_random_uuid(), 'Negociação', '#f59e0b', 3),
    (gen_random_uuid(), 'Fechamento', '#f97316', 4),
    (gen_random_uuid(), 'A contatar no futuro', '#6b7280', 5),
    (gen_random_uuid(), 'Perdido', '#ef4444', 6),
    (gen_random_uuid(), 'Ganho', '#22c55e', 7);
END $$;

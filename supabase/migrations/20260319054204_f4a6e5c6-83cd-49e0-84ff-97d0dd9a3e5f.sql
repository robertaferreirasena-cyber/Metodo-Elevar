
-- Create product-catalogs storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-catalogs', 'product-catalogs', false);

-- RLS: Users can upload to their own folder
CREATE POLICY "Users can upload own catalogs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-catalogs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can read their own files
CREATE POLICY "Users can read own catalogs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-catalogs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can delete their own files
CREATE POLICY "Users can delete own catalogs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-catalogs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create storage bucket for carousel uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-carousel-uploads', 'user-carousel-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for the bucket
CREATE POLICY "Public can view carousel uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-carousel-uploads');

CREATE POLICY "Authenticated users can upload to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-carousel-uploads' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-carousel-uploads' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

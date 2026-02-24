-- Create storage bucket for community materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-materials', 'community-materials', true);

-- Policy: Anyone can view files (public bucket)
CREATE POLICY "Public can view community materials"
ON storage.objects
FOR SELECT
USING (bucket_id = 'community-materials');

-- Policy: Only admins can upload files
CREATE POLICY "Admins can upload community materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-materials' 
  AND public.is_admin(auth.uid())
);

-- Policy: Only admins can update files
CREATE POLICY "Admins can update community materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'community-materials' 
  AND public.is_admin(auth.uid())
);

-- Policy: Only admins can delete files
CREATE POLICY "Admins can delete community materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-materials' 
  AND public.is_admin(auth.uid())
);
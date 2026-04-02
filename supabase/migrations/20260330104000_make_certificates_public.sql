-- Make certificates bucket public so clients can view their PDFs
UPDATE storage.buckets SET public = true WHERE id = 'certificates';

-- Allow public to read certificates
DROP POLICY IF EXISTS "Anyone can read certificates" ON storage.objects;
CREATE POLICY "Anyone can read certificates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

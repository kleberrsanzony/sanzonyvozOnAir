-- Make audio-files bucket public so WhatsApp API can download the media
UPDATE storage.buckets SET public = true WHERE id = 'audio-files';

-- Allow public (and API) to read audio files
DROP POLICY IF EXISTS "Anyone can read audio files" ON storage.objects;
CREATE POLICY "Anyone can read audio files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio-files');

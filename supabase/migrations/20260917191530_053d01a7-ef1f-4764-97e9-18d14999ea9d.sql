ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS original_path TEXT,
  ADD COLUMN IF NOT EXISTS optimized_path TEXT,
  ADD COLUMN IF NOT EXISTS output_format TEXT,
  ADD COLUMN IF NOT EXISTS preset_name TEXT;

CREATE POLICY "Users manage own files read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'pixelforge-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users manage own files insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pixelforge-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users manage own files update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'pixelforge-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users manage own files delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'pixelforge-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
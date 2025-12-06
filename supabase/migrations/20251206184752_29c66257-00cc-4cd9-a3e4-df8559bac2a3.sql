-- Create storage bucket for user photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-photos', 'user-photos', true);

-- Create policy for users to view all photos (public gallery)
CREATE POLICY "Anyone can view photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-photos');

-- Create policy for users to upload their own photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for users to update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
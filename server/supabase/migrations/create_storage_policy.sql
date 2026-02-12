-- Create the storage bucket 'quotes-archive' if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quotes-archive', 'quotes-archive', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'quotes-archive' );

-- Policy to allow authenticated users to view files
CREATE POLICY "Allow authenticated view"
ON storage.objects
FOR SELECT
TO authenticated
USING ( bucket_id = 'quotes-archive' );

-- Policy to allow authenticated users to update their own files (optional, based on requirement)
-- For quotes, usually they are immutable once sent, but maybe useful for re-uploading if error.
-- keeping it simple for now.

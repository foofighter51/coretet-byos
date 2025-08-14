-- Create feedback attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-attachments', 'feedback-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for feedback attachments
CREATE POLICY "Authenticated users can upload feedback attachments" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'feedback-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view feedback attachments" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'feedback-attachments');

-- Add attachments column to feedback table if it doesn't exist
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT NULL;
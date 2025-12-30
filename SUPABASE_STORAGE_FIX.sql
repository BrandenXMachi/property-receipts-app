-- FIX FOR "Saving settings to storage failed" ERROR
-- Run this in your Supabase SQL Editor

-- Add UPDATE policy for receipt-images bucket (MISSING!)
CREATE POLICY "Allow public update of images" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'receipt-images')
    WITH CHECK (bucket_id = 'receipt-images');

-- Add UPDATE policy for voice-notes bucket (MISSING!)
CREATE POLICY "Allow public update of voice notes" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'voice-notes')
    WITH CHECK (bucket_id = 'voice-notes');

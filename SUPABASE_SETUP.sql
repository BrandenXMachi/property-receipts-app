-- Property Receipts Database Schema
-- Run this in Supabase SQL Editor

-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    property TEXT NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(10, 2),
    category TEXT NOT NULL,
    note TEXT,
    image_url TEXT,
    voice_note_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_receipts_property ON receipts(property);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);

-- Enable Row Level Security (RLS)
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since you have password auth)
-- Everyone can read all receipts
CREATE POLICY "Allow public read access" ON receipts
    FOR SELECT
    USING (true);

-- Everyone can insert receipts
CREATE POLICY "Allow public insert access" ON receipts
    FOR INSERT
    WITH CHECK (true);

-- Everyone can update receipts
CREATE POLICY "Allow public update access" ON receipts
    FOR UPDATE
    USING (true);

-- Everyone can delete receipts
CREATE POLICY "Allow public delete access" ON receipts
    FOR DELETE
    USING (true);

-- Create storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipt-images', 'receipt-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for receipt-images bucket
CREATE POLICY "Allow public read access to images" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'receipt-images');

CREATE POLICY "Allow public upload of images" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'receipt-images');

CREATE POLICY "Allow public delete of images" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'receipt-images');

-- Storage policies for voice-notes bucket
CREATE POLICY "Allow public read access to voice notes" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'voice-notes');

CREATE POLICY "Allow public upload of voice notes" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'voice-notes');

CREATE POLICY "Allow public delete of voice notes" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'voice-notes');

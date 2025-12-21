# Quick Supabase Setup Fix

You're getting the "row-level security policy" error because the Supabase database hasn't been set up yet.

## Follow these steps:

### 1. Go to your Supabase Project
- Open https://supabase.com/dashboard
- Click on your project: `msquxcujurktuhtvfcju`

### 2. Open the SQL Editor
- In the left sidebar, click **"SQL Editor"**
- Click **"New Query"**

### 3. Copy and Paste this SQL:

```sql
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_receipts_property ON receipts(property);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);

-- Enable Row Level Security
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
CREATE POLICY "Allow all operations" ON receipts FOR ALL USING (true) WITH CHECK (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipt-images', 'receipt-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for receipt-images
CREATE POLICY "Allow all operations on images" ON storage.objects FOR ALL USING (bucket_id = 'receipt-images') WITH CHECK (bucket_id = 'receipt-images');

-- Storage policies for voice-notes
CREATE POLICY "Allow all operations on voice notes" ON storage.objects FOR ALL USING (bucket_id = 'voice-notes') WITH CHECK (bucket_id = 'voice-notes');
```

### 4. Run the Query
- Click the **"Run"** button (or press Ctrl+Enter)
- You should see "Success. No rows returned"

### 5. Test Your App
- Go back to your property receipts app
- Try uploading a receipt again
- It should work now!

## That's it!

The error will be gone and you'll be able to save receipts.

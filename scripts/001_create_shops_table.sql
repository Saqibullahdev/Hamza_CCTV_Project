-- Create shops (ledger) table for storing vendor/shop information
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  mob_no TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but allow public access for this dashboard (no auth required)
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Allow all operations for this internal dashboard
CREATE POLICY "Allow all operations on shops" ON shops FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_shops_name ON shops(shop_name);

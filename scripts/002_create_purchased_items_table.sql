-- Create purchased_items table for stock entries
CREATE TABLE IF NOT EXISTS purchased_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  serial_numbers TEXT[] NOT NULL,
  item_type TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but allow public access for this dashboard
ALTER TABLE purchased_items ENABLE ROW LEVEL SECURITY;

-- Allow all operations for this internal dashboard
CREATE POLICY "Allow all operations on purchased_items" ON purchased_items FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for faster lookups
CREATE INDEX idx_purchased_items_shop_id ON purchased_items(shop_id);
CREATE INDEX idx_purchased_items_category ON purchased_items(category);
CREATE INDEX idx_purchased_items_purchase_date ON purchased_items(purchase_date);
CREATE INDEX idx_purchased_items_serial_numbers ON purchased_items USING GIN(serial_numbers);

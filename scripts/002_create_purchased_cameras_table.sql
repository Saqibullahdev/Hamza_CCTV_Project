-- Create purchased_cameras table for stock entries
CREATE TABLE IF NOT EXISTS purchased_cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  serial_numbers TEXT[] NOT NULL,
  camera_type TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but allow public access for this dashboard
ALTER TABLE purchased_cameras ENABLE ROW LEVEL SECURITY;

-- Allow all operations for this internal dashboard
CREATE POLICY "Allow all operations on purchased_cameras" ON purchased_cameras FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for faster lookups
CREATE INDEX idx_purchased_cameras_shop_id ON purchased_cameras(shop_id);
CREATE INDEX idx_purchased_cameras_category ON purchased_cameras(category);
CREATE INDEX idx_purchased_cameras_purchase_date ON purchased_cameras(purchase_date);
CREATE INDEX idx_purchased_cameras_serial_numbers ON purchased_cameras USING GIN(serial_numbers);

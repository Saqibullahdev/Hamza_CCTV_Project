-- Add new columns for line items and payment details to purchased_cameras table
-- Line items will be stored as JSONB array for flexibility

ALTER TABLE purchased_cameras 
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS model_code TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS qr_code_data JSONB;

-- Update category options to include CCTV product types
COMMENT ON COLUMN purchased_cameras.category IS 'Product category: Camera, DVR, Cable, Accessory, Power Supply, etc.';
COMMENT ON COLUMN purchased_cameras.payment_method IS 'Payment method: Cash, Bank Transfer, JazzCash, EasyPaisa';

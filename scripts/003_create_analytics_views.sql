-- Create views for analytics

-- Daily analytics view
CREATE OR REPLACE VIEW daily_analytics AS
SELECT 
  purchase_date,
  COUNT(*) as total_purchases,
  SUM(quantity) as total_quantity,
  SUM(unit_price * quantity) as total_amount
FROM purchased_cameras
GROUP BY purchase_date
ORDER BY purchase_date DESC;

-- Monthly analytics view
CREATE OR REPLACE VIEW monthly_analytics AS
SELECT 
  DATE_TRUNC('month', purchase_date) as month,
  COUNT(*) as total_purchases,
  SUM(quantity) as total_quantity,
  SUM(unit_price * quantity) as total_amount,
  COUNT(DISTINCT shop_id) as shops_interacted
FROM purchased_cameras
GROUP BY DATE_TRUNC('month', purchase_date)
ORDER BY month DESC;

-- Quarterly analytics view
CREATE OR REPLACE VIEW quarterly_analytics AS
SELECT 
  DATE_TRUNC('quarter', purchase_date) as quarter,
  COUNT(*) as total_purchases,
  SUM(quantity) as total_quantity,
  SUM(unit_price * quantity) as total_amount
FROM purchased_cameras
GROUP BY DATE_TRUNC('quarter', purchase_date)
ORDER BY quarter DESC;

-- Yearly analytics view
CREATE OR REPLACE VIEW yearly_analytics AS
SELECT 
  DATE_TRUNC('year', purchase_date) as year,
  COUNT(*) as total_purchases,
  SUM(quantity) as total_quantity,
  SUM(unit_price * quantity) as total_amount
FROM purchased_cameras
GROUP BY DATE_TRUNC('year', purchase_date)
ORDER BY year DESC;

-- Category analytics view
CREATE OR REPLACE VIEW category_analytics AS
SELECT 
  category,
  COUNT(*) as total_purchases,
  SUM(quantity) as total_quantity,
  SUM(unit_price * quantity) as total_amount
FROM purchased_cameras
GROUP BY category
ORDER BY total_quantity DESC;

-- Top shops view
CREATE OR REPLACE VIEW top_shops AS
SELECT 
  s.id,
  s.shop_name,
  s.mob_no,
  COUNT(pc.id) as total_purchases,
  COALESCE(SUM(pc.quantity), 0) as total_quantity,
  COALESCE(SUM(pc.unit_price * pc.quantity), 0) as total_amount
FROM shops s
LEFT JOIN purchased_cameras pc ON s.id = pc.shop_id
GROUP BY s.id, s.shop_name, s.mob_no
ORDER BY total_amount DESC;

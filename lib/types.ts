export interface Shop {
  id: string
  shop_name: string
  mob_no: string
  created_at: string
  updated_at: string
}

export interface PurchasedItem {
  id: string
  shop_id: string
  serial_numbers: string[]
  item_type: string
  category: string
  unit_price: number
  quantity: number
  purchase_date: string
  created_at: string
  updated_at: string
  shops?: Shop
  // New fields for enhanced purchase details
  product_name?: string
  brand?: string
  model_code?: string
  payment_method?: string
  paid_amount?: number
  remaining_amount?: number
  discount?: number
  qr_code_data?: QRData
}

export interface QRData {
  id: string
  serial_numbers: string[]
  shop_name: string
  date: string
  category: string
  item_type: string
  product_name?: string
  brand?: string
  model_code?: string
  total_amount?: number
}

export interface DailyAnalytics {
  purchase_date: string
  total_purchases: number
  total_quantity: number
  total_amount: number
}

export interface MonthlyAnalytics {
  month: string
  total_purchases: number
  total_quantity: number
  total_amount: number
  shops_interacted: number
}

export interface CategoryAnalytics {
  category: string
  total_purchases: number
  total_quantity: number
  total_amount: number
}

export interface TopShop {
  id: string
  shop_name: string
  mob_no: string
  total_purchases: number
  total_quantity: number
  total_amount: number
}

export interface SearchResult {
  camera: PurchasedItem
  shop: Shop
}

export interface Invoice {
  id: string
  serial_number?: number
  invoice_number: string
  invoice_date: string
  customer_name: string
  customer_id: string
  customer_location?: string
  customer_phone?: string
  subtotal: number
  discount: number
  tax: number
  total: number
  paid_amount: number
  remaining_amount: number
  payment_method?: string
  payment_status: "pending" | "partial" | "paid"
  notes?: string
  terms_conditions?: string
  created_at: string
  updated_at: string
  invoice_items?: InvoiceItem[]
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  item_name: string
  description?: string
  category?: string
  brand?: string
  model_code?: string
  unit_price: number
  quantity: number
  line_total: number
  created_at: string
}

export interface Profile {
  id: string
  email: string
  role: "admin" | "customer"
  created_at: string
  updated_at: string
}

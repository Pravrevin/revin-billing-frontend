export type PurchaseItem = {
  id: number
  purchase_id: number
  item_id: number
  item_name?: string
  batch_no?: string
  quantity?: string | number | null
  free_quantity?: string | number | null
  purchase_rate?: string | number | null
  mrp?: string | number | null
  sale_rate?: string | number | null
  discount?: string | number | null
  gst_percent?: string | number | null
  tax_amount?: string | number | null
  expiry_date?: string | null
  total?: string | number | null
}

export type Purchase = {
  id: number
  invoice_no?: string | null
  invoice_date?: string | null
  entry_date?: string | null
  due_date?: string | null
  supplier_id?: number | null
  supplier_name?: string | null
  total_amount?: string | number | null
  discount_percentage?: string | number | null
  discount_amount?: string | number | null
  tax_percentage?: string | number | null
  tax_amount?: string | number | null
  net_amount?: string | number | null
  created_at?: string | null
  updated_at?: string | null
  extra_data?: unknown
  items?: PurchaseItem[]
  purchase_items?: PurchaseItem[]
}

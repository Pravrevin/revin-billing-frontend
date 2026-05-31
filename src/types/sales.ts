export type SalesItem = {
  id: number
  sales_id: number
  item_id: number
  batch_no: string | null
  quantity: string | null
  mrp: string | null
  sale_rate: string | null
  discount: string | null
  gst_percent: string | null
  tax_amount: string | null
  expiry_date: string | null
  total: string | null
}

export type Sale = {
  id: number
  invoice_no: string | null
  invoice_date: string | null
  customer_id: number | null
  doctor_name: string | null
  total_amount: string | null
  discount: string | null
  tax_amount: string | null
  net_amount: string | null
  payment_mode_id: number | null
  payment_mode_name: string | null
  payment_status: string | null
  extra_data: unknown
  created_at: string
  updated_at: string
  items: SalesItem[]
}

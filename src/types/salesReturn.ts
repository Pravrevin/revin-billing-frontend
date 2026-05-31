export type ReturnableLine = {
  sales_item_id: number
  item_id: number
  item_name: string | null
  batch_no: string | null
  sold_qty: string | number
  returned_qty: string | number
  returnable_qty: string | number
  mrp: string | number | null
  sale_rate: string | number | null
  gst_percent: string | number | null
  expiry_date: string | null
}

export type Returnable = {
  sales_id: number
  invoice_no: string | null
  invoice_date: string | null
  customer_id: number | null
  customer_name: string | null
  lines: ReturnableLine[]
}

export type SalesReturnItemCreate = {
  sales_item_id?: number | null
  item_id: number
  batch_no?: string | null
  quantity: number
  mrp?: number | null
  sale_rate?: number | null
  gst_percent?: number | null
  tax_amount?: number | null
  total?: number | null
  expiry_date?: string | null
}

export type SalesReturnCreate = {
  sales_id: number
  return_date?: string
  reason?: string | null
  notes?: string | null
  refund_amount?: number | null
  refund_mode_id?: number | null
  refund_status?: string | null
  items: SalesReturnItemCreate[]
}

export type SalesReturnItem = {
  id: number
  return_id: number
  sales_item_id: number | null
  item_id: number
  item_name: string | null
  batch_no: string | null
  quantity: string | number | null
  mrp: string | number | null
  sale_rate: string | number | null
  gst_percent: string | number | null
  tax_amount: string | number | null
  total: string | number | null
  expiry_date: string | null
}

export type SalesReturn = {
  id: number
  return_no: string | null
  return_date: string
  sales_id: number | null
  invoice_no: string | null
  customer_id: number | null
  customer_name: string | null
  total_amount: string | number | null
  tax_amount: string | number | null
  refund_amount: string | number | null
  refund_mode_id: number | null
  refund_mode_name: string | null
  refund_status: string | null
  reason: string | null
  notes: string | null
  created_at?: string
  updated_at?: string
  items: SalesReturnItem[]
}

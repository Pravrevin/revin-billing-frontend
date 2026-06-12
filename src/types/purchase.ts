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

/** One line item as returned by the AI bill-extraction endpoint (purchase prefill). */
export type ExtractedBillItem = {
  item_id: number | null
  extracted_name: string | null
  matched_name: string | null
  batch_no: string | null
  quantity: number | null
  free_quantity: number | null
  purchase_rate: number | null
  mrp: number | null
  sale_rate: number | null
  discount: number | null
  gst_percent: number | null
  expiry_date: string | null
}

/** Response of POST /purchases/extract-bill — a prefill payload for the entry form. */
export type ExtractedBill = {
  header: {
    supplier_id: number | null
    supplier_name_guess: string | null
    invoice_no: string | null
    invoice_date: string | null
  }
  items: ExtractedBillItem[]
  unmatched_count: number
  column_map: Record<string, string>
  raw: unknown
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
  /** Alias used by the list/detail UI; mirrors discount_amount when present. */
  discount?: string | number | null
  payment_mode_name?: string | null
  payment_status?: string | null
  created_at?: string | null
  updated_at?: string | null
  extra_data?: unknown
  items?: PurchaseItem[]
  purchase_items?: PurchaseItem[]
}

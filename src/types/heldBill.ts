/** One editable line of a held bill draft — mirrors SalesBillingModal's SaleRow (minus the runtime _key). */
export type HeldBillRow = {
  item_id: string
  batch_no: string
  quantity: string
  mrp: string
  sale_rate: string
  discount: string
  gst_percent: string
  expiry_date: string
  available: string
}

export type HeldBillDraft = {
  customer_id: number | null
  invoice_no: string
  invoice_date: string
  doctor_name: string
  payment_status: string
  rows: HeldBillRow[]
}

export type HeldBillCreate = {
  customer_id?: number | null
  customer_name?: string | null
  invoice_no?: string | null
  invoice_date?: string | null
  doctor_name?: string | null
  payment_status?: string | null
  net_amount?: number | null
  item_count?: number | null
  note?: string | null
  payload: HeldBillDraft
}

export type HeldBill = {
  id: number
  hold_no: string | null
  customer_id: number | null
  customer_name: string | null
  invoice_no: string | null
  invoice_date: string | null
  doctor_name: string | null
  payment_status: string | null
  net_amount: string | number | null
  item_count: number | null
  note: string | null
  payload: HeldBillDraft
  created_at: string
  updated_at?: string
}

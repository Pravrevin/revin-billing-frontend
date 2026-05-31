export type PaymentMode = {
  id: number
  mode_name: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type PaymentCreate = {
  party_id: number
  txn_type: 'RECEIPT' | 'PAYMENT'
  reference_type?: 'sale' | 'purchase' | 'advance' | 'adjustment' | null
  reference_id?: number | null
  txn_date: string
  amount: number
  payment_mode_id?: number | null
  reference_no?: string | null
  notes?: string | null
}

export type Payment = {
  id: number
  party_id: number
  party_name?: string | null
  txn_type: string
  reference_type?: string | null
  reference_id?: number | null
  reference_no_doc?: string | null
  txn_date: string
  amount: string | number
  payment_mode_id?: number | null
  payment_mode_name?: string | null
  reference_no?: string | null
  notes?: string | null
  receipt_path?: string | null
  created_at: string
  updated_at: string
}

export type LedgerEntry = {
  entry_date: string
  entry_type: string // INVOICE / PAYMENT / RECEIPT
  reference_type?: string | null
  reference_id?: number | null
  doc_no?: string | null
  description: string
  debit: string | number
  credit: string | number
  balance: string | number
}

export type OutstandingSummary = {
  party_id: number
  party_name?: string | null
  party_type?: string | null
  total_invoiced: string | number
  total_settled: string | number
  total_outstanding: string | number
  overdue_amount: string | number
  invoice_count: number
  overdue_count: number
  credit_days: number
}

export type SupplierLedgerRow = {
  entry_date: string
  particulars: string
  voucher_type: string // Opening / Purchase / Payment
  voucher_no?: string | null
  debit: string | number
  credit: string | number
  balance: string | number
  balance_type: string // Dr / Cr
}

export type SupplierLedger = {
  party_id: number
  party_name?: string | null
  party_code?: string | null
  gstin?: string | null
  from_date?: string | null
  to_date?: string | null
  opening_balance: string | number
  opening_balance_type: string
  rows: SupplierLedgerRow[]
  total_debit: string | number
  total_credit: string | number
  closing_balance: string | number
  closing_balance_type: string
}

export type OutstandingSale = {
  id: number
  invoice_no?: string | null
  invoice_date?: string | null
  customer_id?: number | null
  customer_name?: string | null
  net_amount?: string | number | null
  total_received: string | number
  outstanding_amount: string | number
  payment_status?: string | null
  is_overdue: boolean
  days_overdue: number
  credit_days: number
  receipts: Payment[]
}

export type OutstandingInvoice = {
  id: number
  invoice_no?: string | null
  invoice_date?: string | null
  entry_date?: string | null
  due_date?: string | null
  effective_due_date?: string | null
  supplier_id?: number | null
  supplier_name?: string | null
  net_amount?: string | number | null
  total_paid: string | number
  outstanding_amount: string | number
  payment_status?: string | null
  is_overdue: boolean
  days_overdue: number
  credit_days: number
  payments: Payment[]
}

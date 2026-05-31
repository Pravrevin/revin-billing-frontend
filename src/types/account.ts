export type AccountsOverview = {
  as_of: string
  payables: { outstanding: number; overdue: number; bills: number; overdue_bills: number }
  receivables: { outstanding: number; overdue: number; bills: number; overdue_bills: number }
  balances: { cash_in_hand: number; bank_balance: number }
  today: { money_in: number; money_out: number; net: number }
  month_expenses: number
  net_position: number
  counts: { payments: number; expenses: number }
}

export type BookRow = {
  date: string
  particulars: string
  voucher_type: string
  voucher_no: string | null
  money_in: number
  money_out: number
  balance: number
}

export type CashBankBook = {
  book: 'cash' | 'bank'
  range: { from: string; to: string }
  opening_balance: number
  rows: BookRow[]
  total_in: number
  total_out: number
  closing_balance: number
}

export type DayVoucher = {
  type: string
  voucher_no: string
  party: string
  amount: number
  direction: 'in' | 'out'
  mode?: string
}

export type DayBook = {
  day: string
  summary: {
    sales: number
    purchases: number
    receipts: number
    payments: number
    expenses: number
    cash_in: number
    cash_out: number
    net_cash: number
  }
  vouchers: DayVoucher[]
}

export type SupplierWiseRow = {
  supplier_id: number
  supplier_name: string
  bills: number
  billed: number
  paid: number
  outstanding: number
  last_payment: string | null
}

export type SupplierWise = { suppliers: SupplierWiseRow[] }

export type Expense = {
  id: number
  expense_date: string
  category: string | null
  description: string | null
  amount: string | number
  payment_mode_id: number | null
  payment_mode_name: string | null
  reference_no: string | null
  notes: string | null
  created_at?: string
  updated_at?: string
}

export type ExpenseCreate = {
  expense_date: string
  category?: string | null
  description?: string | null
  amount: number
  payment_mode_id?: number | null
  reference_no?: string | null
  notes?: string | null
}

export type AccountsTab =
  | 'overview'
  | 'payments'
  | 'payables'
  | 'receivables'
  | 'supplier-wise'
  | 'expenses'
  | 'cash-book'
  | 'bank-book'
  | 'day-book'

export type DateRange = { from: string; to: string }

export type DailyPoint = { date: string; total: number; count: number }

export type SalesReport = {
  range: DateRange
  summary: {
    net_sales: number
    gross_sales: number
    discount: number
    tax: number
    bill_count: number
    avg_bill: number
    qty_sold: number
    unique_customers: number
  }
  daily: DailyPoint[]
  top_items: { item_id: number; item_name: string; qty: number; revenue: number }[]
  payment_breakdown: { status: string; count: number; amount: number }[]
  recent: {
    id: number
    invoice_no: string | null
    invoice_date: string | null
    customer_name: string
    net_amount: number
    payment_status: string | null
  }[]
}

export type PurchaseReport = {
  range: DateRange
  summary: {
    net_purchase: number
    gross_purchase: number
    discount: number
    tax: number
    bill_count: number
    avg_bill: number
    qty_bought: number
    unique_suppliers: number
  }
  daily: DailyPoint[]
  top_suppliers: { supplier_id: number; name: string; amount: number; bills: number }[]
  top_items: { item_id: number; item_name: string; qty: number; amount: number }[]
  recent: {
    id: number
    invoice_no: string | null
    invoice_date: string | null
    supplier_name: string
    net_amount: number
  }[]
}

export type ProfitReport = {
  range: DateRange
  summary: {
    revenue: number
    cost: number
    gross_profit: number
    margin_pct: number
    lines: number
  }
  daily: DailyPoint[]
  top_items: {
    item_name: string
    qty: number
    revenue: number
    cost: number
    profit: number
    margin_pct: number
  }[]
}

export type DailyReport = {
  day: string
  summary: {
    sales_net: number
    sales_gross: number
    sales_tax: number
    sales_bills: number
    purchase_net: number
    purchase_bills: number
    net_cash: number
  }
  payment_breakdown: { status: string; count: number; amount: number }[]
  top_items: { item_name: string; qty: number; revenue: number }[]
  bills: {
    id: number
    invoice_no: string | null
    customer_name: string
    net_amount: number
    payment_status: string | null
  }[]
}

export type GstSlab = {
  rate: number
  taxable: number
  cgst: number
  sgst: number
  tax: number
}

export type GstReport = {
  range: DateRange
  summary: { output_gst: number; input_gst: number; net_payable: number }
  output_slabs: GstSlab[]
  input_slabs: GstSlab[]
}

export type InventoryReport = {
  as_of: string
  summary: {
    items_in_stock: number
    batches: number
    total_qty: number
    stock_value_cost: number
    stock_value_mrp: number
    potential_margin: number
    out_of_stock: number
    near_expiry: number
    expired: number
  }
  top_value_items: { item_name: string; qty: number; value: number }[]
  category_breakdown: { category: string; value: number }[]
}

export type ReportType =
  | 'sales'
  | 'purchase'
  | 'profit'
  | 'daily'
  | 'gst'
  | 'inventory'

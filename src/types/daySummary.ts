export type DaySummaryPoint = {
  date: string
  sales: number
  returns: number
  net: number
  bills: number
}

export type DaySummary = {
  range: { from: string; to: string; single_day: boolean }
  summary: {
    gross_sales: number
    returns: number
    net_sales: number
    bill_count: number
    return_count: number
    items_sold: number
    items_returned: number
    discount: number
    tax: number
    avg_bill: number
    unique_customers: number
    collected: number
  }
  payment_status: { status: string; count: number; amount: number }[]
  payment_modes: { mode: string; amount: number; count: number }[]
  daily: DaySummaryPoint[]
  top_items: { item_name: string; qty: number; revenue: number }[]
  bills: {
    id: number
    invoice_no: string
    invoice_date: string | null
    customer_name: string
    items: number
    gross: number
    discount: number
    tax: number
    net: number
    payment_status: string | null
    payment_mode: string | null
  }[]
  returns: {
    id: number
    return_no: string
    return_date: string | null
    customer_name: string
    amount: number
    refund_amount: number
    reason: string | null
  }[]
}

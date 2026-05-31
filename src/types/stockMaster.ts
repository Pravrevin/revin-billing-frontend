export type StockMaster = {
  id: number
  item_id: number
  /** Display name from item master (read-only on this endpoint). */
  item_name?: string | null
  batch_no: string
  manufacture_date: string
  expiry_date: string
  mrp: string
  purchase_rate: string
  sale_rate: string
  quantity: string
  free_quantity: string
  warehouse_id: number
  rack_location: string
  extra_data: unknown
  created_at: string
  updated_at: string
}

/** One row of the stock movement ledger (IN from purchase, OUT from sale, etc.). */
export type StockLedgerEntry = {
  id: number
  item_id: number
  item_name?: string | null
  batch_no?: string | null
  movement_type: string // IN / OUT
  quantity?: string | number | null
  free_quantity?: string | number | null
  reference_type?: string | null // purchase / sale / sale-reversal / adjustment
  reference_id?: number | null
  purchase_rate?: string | number | null
  mrp?: string | number | null
  created_at: string
}

/** One row of the expiry view (derived from a stock batch's expiry_date). */
export type StockExpiryRow = {
  id: number
  item_id: number
  item_name?: string | null
  batch_no?: string | null
  manufacture_date?: string | null
  expiry_date?: string | null
  quantity?: string | number | null
  mrp?: string | number | null
  sale_rate?: string | number | null
  days_to_expiry?: number | null // negative = expired
  status: string // expired / near / ok
}

/** Fields you may PATCH; decimals may be sent as numbers (API accepts both). */
export type StockMasterPatchFields = Omit<
  StockMaster,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'item_name'
  | 'mrp'
  | 'purchase_rate'
  | 'sale_rate'
  | 'quantity'
  | 'free_quantity'
> & {
  mrp?: number | string
  purchase_rate?: number | string
  sale_rate?: number | string
  quantity?: number | string
  free_quantity?: number | string
}

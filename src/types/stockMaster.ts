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

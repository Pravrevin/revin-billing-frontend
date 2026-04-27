export type ItemMaster = {
  id: number
  item_code: string
  item_name: string
  generic_name: string
  brand_name: string
  composition: string
  strength: string
  dosage_form: string
  category_id: number
  sub_category_id: number
  marketer_id: number
  packing_type: string
  pack_size: number
  unit_primary: string
  unit_secondary: string
  conversion_factor: string
  gst_percent: string
  cgst: string
  sgst: string
  igst: string
  cess_percent: string
  hsn_code: string
  tax_type: string
  min_discount: string
  max_discount: string
  is_discount_allowed: boolean
  pricing_type: string
  min_stock_level: number
  max_stock_level: number
  reorder_level: number
  is_batch_required: boolean
  is_expiry_required: boolean
  shelf_life_days: number
  lead_time_days: number
  schedule_type: string
  is_narcotic: boolean
  is_psychotropic: boolean
  prescription_required: boolean
  drug_license_required: boolean
  regulatory_category: string
  barcode: string | null
  qr_code: string | null
  sku_code: string | null
  external_code: string | null
  is_active: boolean
  extra_data: unknown
  created_at: string
  updated_at: string
}

/** Editable fields for PATCH (everything except server id/timestamps). `item_id` is added by the client. */
export type ItemMasterPatchFields = Omit<ItemMaster, 'id' | 'created_at' | 'updated_at'>

export type ItemMasterPatchBody = { item_id: number } & Partial<ItemMasterPatchFields>

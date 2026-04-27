export type PackagingMaster = {
  id: number
  packaging_code: string
  packaging_name: string
  packing_type: string | null
  unit_primary: string | null
  unit_secondary: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

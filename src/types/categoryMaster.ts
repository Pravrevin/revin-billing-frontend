export type CategoryMaster = {
  id: number
  category_code: string
  category_name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SubCategoryMaster = {
  id: number
  sub_category_code: string
  sub_category_name: string
  category_id: number
  category_name: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

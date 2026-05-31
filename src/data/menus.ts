export type ModalAction =
  | 'new-bill'
  | 'sales-return'
  | 'held-bills'
  | 'day-summary'
  | 'add-supplier'
  | 'supplier-list'
  | 'new-purchase'
  | 'add-customer'
  | 'customer-list'
  | 'customer-ledger'
  | 'stock-list'
  | 'stock-ledger'
  | 'expiry-all'
  | 'expiry-near'
  | 'expiry-expired'
  | 'supplier-ledger'
  | 'add-category'
  | 'category-list'
  | 'add-sub-category'
  | 'sub-category-list'
  | 'add-packaging'
  | 'packaging-list'
  | 'add-item'
  | 'item-list'
  | 'add-brand'
  | 'brand-list'
  | 'add-unit'
  | 'unit-list'

export type SubSubItem = {
  id: number
  icon: string
  label: string
  star?: boolean
  to?: string
  action?: ModalAction
}

export type SubItem = {
  id: number
  icon: string
  label: string
  star?: boolean
  to?: string
  action?: ModalAction
  subs?: SubSubItem[]
}

export type MenuItem = {
  id: number
  icon: string
  label: string
  color: string
  subs: SubItem[]
}

export const TILE_COLORS: Record<string, string> = {
  blue:    '#2563eb',
  green:   '#16a34a',
  orange:  '#ea580c',
  purple:  '#7c3aed',
  cyan:    '#0891b2',
  teal:    '#0d9488',
  indigo:  '#4338ca',
  rose:    '#e11d48',
  slate:   '#475569',
  dark:    '#1e293b',
  sky:     '#0369a1',
  violet:  '#6d28d9',
  emerald: '#059669',
  amber:   '#d97706',
  pink:    '#db2777',
}

export const MENUS: MenuItem[] = [
  {
    id: 1, icon: '🧾', label: 'Sales Billing', color: 'blue',
    subs: [
      { id: 1, icon: '➕', label: 'New Bill', action: 'new-bill' },
      { id: 2, icon: '✏️', label: 'Edit Bill' },
      { id: 3, icon: '↩️', label: 'Return / Refund', action: 'sales-return' },
      { id: 4, icon: '⏸️', label: 'Hold Bills', action: 'held-bills' },
      { id: 5, icon: '📅', label: 'Day Summary', action: 'day-summary' },
    ],
  },
  {
    id: 2, icon: '📥', label: 'Purchase Entry', color: 'green',
    subs: [
      { id: 1, icon: '➕', label: 'New Purchase', action: 'new-purchase' },
      { id: 2, icon: '↩️', label: 'Purchase Return' },
      { id: 3, icon: '💸', label: 'Supplier Payment' },
      { id: 4, icon: '📜', label: 'Purchase History' },
    ],
  },
  {
    id: 3, icon: '📦', label: 'Inventory / Stock', color: 'orange',
    subs: [
      { id: 1, icon: '📋', label: 'Stock List', action: 'stock-list' },
      { id: 2, icon: '📜', label: 'Stock Ledger', action: 'stock-ledger' },
      { id: 3, icon: '⚠️', label: 'Low Stock Alert', to: '/app/stock/low-stock' },
    ],
  },
  {
    id: 4, icon: '👥', label: 'Customers', color: 'purple',
    subs: [
      { id: 1, icon: '➕', label: 'Add Customer', action: 'add-customer' },
      { id: 2, icon: '👁️', label: 'View Customers', action: 'customer-list' },
      { id: 3, icon: '📒', label: 'Customer Ledger', action: 'customer-ledger' },
    ],
  },
  {
    id: 5, icon: '🏭', label: 'Suppliers', color: 'cyan',
    subs: [
      { id: 1, icon: '➕', label: 'Add Supplier', action: 'add-supplier' },
      { id: 2, icon: '📋', label: 'Supplier List', action: 'supplier-list' },
      { id: 3, icon: '📒', label: 'Supplier Ledger', action: 'supplier-ledger' },
      { id: 4, icon: '💰', label: 'Supplier Outstanding', action: 'supplier-ledger', star: true },
    ],
  },
  {
    id: 6, icon: '💳', label: 'Accounts / Payments', color: 'teal',
    subs: [
      { id: 0, icon: '📊', label: 'Accounts Overview', to: '/app/accounts/overview' },
      {
        id: 1, icon: '💸', label: 'Payment to Supplier',
        subs: [
          { id: 1, icon: '➕', label: 'New Payment',           to: '/app/accounts/payables' },
          { id: 2, icon: '📜', label: 'Payment History',       to: '/app/accounts/payments' },
          { id: 3, icon: '🏭', label: 'Supplier Wise Payment', to: '/app/accounts/supplier-wise' },
          { id: 4, icon: '🔗', label: 'Adjust Against Bill',   to: '/app/accounts/payables', star: true },
        ],
      },
      { id: 2, icon: '💵', label: 'Receive from Customer', to: '/app/accounts/receivables' },
      { id: 3, icon: '📝', label: 'Expense Entry',         to: '/app/accounts/expenses' },
      { id: 4, icon: '📖', label: 'Cash Book',             to: '/app/accounts/cash-book' },
      { id: 5, icon: '🏦', label: 'Bank Book',             to: '/app/accounts/bank-book' },
      { id: 6, icon: '📅', label: 'Day Book',              to: '/app/accounts/day-book' },
    ],
  },
  {
    id: 7, icon: '📊', label: 'Reports', color: 'indigo',
    subs: [
      { id: 1, icon: '💰', label: 'Sales Report',     to: '/app/reports/sales' },
      { id: 2, icon: '📥', label: 'Purchase Report',  to: '/app/reports/purchase' },
      { id: 3, icon: '📈', label: 'Profit Report',    to: '/app/reports/profit' },
      { id: 4, icon: '📅', label: 'Daily Report',     to: '/app/reports/daily' },
      { id: 5, icon: '🧾', label: 'GST Report',       to: '/app/reports/gst' },
      { id: 6, icon: '📦', label: 'Inventory Report', to: '/app/reports/inventory' },
    ],
  },
  {
    id: 8, icon: '⏰', label: 'Expiry Management', color: 'rose',
    subs: [
      { id: 1, icon: '💊', label: 'Expiry Medicines', action: 'expiry-all' },
      { id: 2, icon: '⚠️', label: 'Near Expiry (30 Days)', action: 'expiry-near' },
      { id: 3, icon: '🚫', label: 'Expired Stock', action: 'expiry-expired' },
    ],
  },
  {
    id: 9, icon: '⚙️', label: 'Settings', color: 'slate',
    subs: [
      { id: 1, icon: '👤', label: 'Add User' },
      { id: 2, icon: '🖨️', label: 'Printer Settings' },
      { id: 3, icon: '🧾', label: 'GST Settings' },
      { id: 4, icon: '💾', label: 'Backup Data' },
    ],
  },
  {
    id: 10, icon: '🗂️', label: 'Item Master', color: 'sky',
    subs: [
      { id: 1, icon: '➕', label: 'Add Item', action: 'add-item' },
      { id: 2, icon: '✏️', label: 'Update Item', to: '/app/item-master/update' },
      { id: 3, icon: '📋', label: 'See Items', action: 'item-list' },
      { id: 4, icon: '🕒', label: 'Items History', to: '/app/item-master/history' },
    ],
  },
  {
    id: 11, icon: '🏷️', label: 'Category Master', color: 'violet',
    subs: [
      { id: 1, icon: '➕', label: 'Add Category', action: 'add-category' },
      { id: 2, icon: '📋', label: 'See Categories', action: 'category-list' },
      { id: 3, icon: '✏️', label: 'Update Category', to: '/app/category-master/update' },
    ],
  },
  {
    id: 12, icon: '📂', label: 'Sub-Category Master', color: 'emerald',
    subs: [
      { id: 1, icon: '➕', label: 'Add Sub-Category', action: 'add-sub-category' },
      { id: 2, icon: '📋', label: 'See Sub-Categories', action: 'sub-category-list' },
      { id: 3, icon: '✏️', label: 'Update Sub-Category', to: '/app/sub-category-master/update' },
    ],
  },
  {
    id: 13, icon: '📦', label: 'Packaging Master', color: 'amber',
    subs: [
      { id: 1, icon: '➕', label: 'Create', action: 'add-packaging' },
      { id: 2, icon: '📋', label: 'View All Packaging', action: 'packaging-list' },
    ],
  },
  {
    id: 14, icon: '🧷', label: 'Brand Master', color: 'pink',
    subs: [
      { id: 1, icon: '➕', label: 'Add Brand', action: 'add-brand' },
      { id: 2, icon: '📋', label: 'See Brand', action: 'brand-list' },
    ],
  },
  {
    id: 15, icon: '📏', label: 'Unit Master', color: 'teal',
    subs: [
      { id: 1, icon: '➕', label: 'Add Unit', action: 'add-unit' },
      { id: 2, icon: '📋', label: 'See Units', action: 'unit-list' },
    ],
  },
]

export type SidebarSection = {
  label: string
  menuIds: number[]
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  { label: 'Transactions', menuIds: [1, 2, 6] },
  { label: 'Inventory',    menuIds: [3, 8] },
  { label: 'Parties',      menuIds: [4, 5] },
  { label: 'Masters',      menuIds: [10, 11, 12, 13, 14, 15] },
  { label: 'Insights',     menuIds: [7] },
  { label: 'System',       menuIds: [9] },
]

export function findMenuById(id: number): MenuItem | undefined {
  return MENUS.find((m) => m.id === id)
}

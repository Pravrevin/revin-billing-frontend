import type { ModalAction } from './menus'

/**
 * Marg-style keyboard shortcuts, mapped to the features this app actually has.
 *
 * Browser-safe choices: Marg uses keys the browser reserves (Ctrl+W closes the
 * tab, Ctrl+P prints, F5 reloads), so we use Alt+<letter> for quick access plus
 * F1 for help and Esc to close — same keyboard-first feel.
 *
 * `action` opens the matching popup via /app/dashboard?action=…
 * `to` navigates to a route.
 */
export type Shortcut = {
  /** Human label shown in the help overlay, e.g. "Alt + B". */
  keyLabel: string
  /** KeyboardEvent.code to match (e.g. "KeyB", "Digit0"). */
  code: string
  /** Requires the Alt modifier (default true for letter combos). */
  alt?: boolean
  label: string
  group: string
  action?: ModalAction
  to?: string
}

export const SHORTCUT_GROUPS = [
  'Sales',
  'Purchase',
  'Parties',
  'Inventory',
  'Reports & Accounts',
] as const

export const SHORTCUTS: Shortcut[] = [
  // ── Sales ──────────────────────────────────────────────
  { keyLabel: 'Alt + B', code: 'KeyB', label: 'New Sale Bill',        group: 'Sales', action: 'new-bill' },
  { keyLabel: 'Alt + R', code: 'KeyR', label: 'Sales Return / Refund', group: 'Sales', action: 'sales-return' },
  { keyLabel: 'Alt + H', code: 'KeyH', label: 'Hold Bills',           group: 'Sales', action: 'held-bills' },
  { keyLabel: 'Alt + D', code: 'KeyD', label: 'Day Summary',          group: 'Sales', action: 'day-summary' },

  // ── Purchase ───────────────────────────────────────────
  { keyLabel: 'Alt + P', code: 'KeyP', label: 'New Purchase',         group: 'Purchase', action: 'new-purchase' },
  { keyLabel: 'Alt + U', code: 'KeyU', label: 'Purchase History',     group: 'Purchase', action: 'purchase-history' },
  { keyLabel: 'Alt + Y', code: 'KeyY', label: 'Supplier Payment',     group: 'Purchase', action: 'supplier-payment' },

  // ── Parties ────────────────────────────────────────────
  { keyLabel: 'Alt + C', code: 'KeyC', label: 'Add Customer',         group: 'Parties', action: 'add-customer' },
  { keyLabel: 'Alt + G', code: 'KeyG', label: 'Customer Ledger',      group: 'Parties', action: 'customer-ledger' },
  { keyLabel: 'Alt + V', code: 'KeyV', label: 'Add Supplier',         group: 'Parties', action: 'add-supplier' },
  { keyLabel: 'Alt + J', code: 'KeyJ', label: 'Supplier Ledger',      group: 'Parties', action: 'supplier-ledger' },

  // ── Inventory ──────────────────────────────────────────
  { keyLabel: 'Alt + K', code: 'KeyK', label: 'Stock List',           group: 'Inventory', action: 'stock-list' },
  { keyLabel: 'Alt + L', code: 'KeyL', label: 'Low Stock Alert',      group: 'Inventory', to: '/app/stock/low-stock' },
  { keyLabel: 'Alt + E', code: 'KeyE', label: 'Near Expiry',          group: 'Inventory', action: 'expiry-near' },
  { keyLabel: 'Alt + I', code: 'KeyI', label: 'Add Item',             group: 'Inventory', action: 'add-item' },

  // ── Reports & Accounts ─────────────────────────────────
  { keyLabel: 'Alt + T', code: 'KeyT', label: 'Reports',              group: 'Reports & Accounts', to: '/app/reports/sales' },
  { keyLabel: 'Alt + A', code: 'KeyA', label: 'Accounts',             group: 'Reports & Accounts', to: '/app/accounts/overview' },
  { keyLabel: 'Alt + 0', code: 'Digit0', label: 'Dashboard',         group: 'Reports & Accounts', to: '/app/dashboard' },
]

const BY_ACTION: Record<string, string> = {}
const BY_ROUTE: Record<string, string> = {}
for (const s of SHORTCUTS) {
  if (s.action) BY_ACTION[s.action] = s.keyLabel
  if (s.to) BY_ROUTE[s.to] = s.keyLabel
}

/** Compact key hint (e.g. "Alt+B") for a menu leaf, or undefined if none. */
export function shortcutHint(item: { action?: string | null; to?: string | null }): string | undefined {
  const label =
    (item.action && BY_ACTION[item.action]) ||
    (item.to && BY_ROUTE[item.to]) ||
    undefined
  return label ? label.replace(/\s+/g, '') : undefined
}

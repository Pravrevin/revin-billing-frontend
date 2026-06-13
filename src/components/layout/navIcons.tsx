import type { ReactNode } from 'react'

/**
 * Line-art icons for the sidebar, keyed by menu id (see data/menus.ts).
 * Rendered inside an <svg viewBox="0 0 24 24"> with stroke="currentColor".
 */
export const NAV_ICONS: Record<number, ReactNode> = {
  // 1 — Sales Billing (receipt)
  1: (
    <>
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  // 2 — Purchase Entry (download into tray)
  2: (
    <>
      <path d="M3 14v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
      <path d="M12 3v11m0 0 4-4m-4 4-4-4" />
    </>
  ),
  // 3 — Inventory / Stock (layers)
  3: (
    <>
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="m2 12 10 5 10-5M2 17l10 5 10-5" />
    </>
  ),
  // 4 — Customers (users)
  4: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  // 5 — Suppliers (factory)
  5: (
    <>
      <path d="M2 21h20" />
      <path d="M4 21V10l5 3V10l5 3V10l5 3v8" />
      <path d="M4 10 5 4h2l1 6" />
    </>
  ),
  // 6 — Accounts / Payments (card)
  6: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" />
    </>
  ),
  // 7 — Reports (bar chart)
  7: (
    <>
      <path d="M3 3v18h18" />
      <path d="M8 16v-4M13 16V8M18 16v-6" />
    </>
  ),
  // 8 — Expiry Management (alarm)
  8: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2M5 3 2 6M22 6l-3-3" />
    </>
  ),
  // 9 — Settings (gear)
  9: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  // 10 — Item Master (tag)
  10: (
    <>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7" cy="7" r="1.4" />
    </>
  ),
  // 11 — Category Master (folder)
  11: (
    <path d="M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  ),
  // 12 — Sub-Category Master (folder +)
  12: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M12 11v5M9.5 13.5h5" />
    </>
  ),
  // 13 — Packaging Master (3D box)
  13: (
    <>
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </>
  ),
  // 14 — Brand Master (shield badge)
  14: (
    <>
      <path d="M12 2 4 6v6c0 5 8 10 8 10s8-5 8-10V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  // 15 — Unit Master (ruler)
  15: (
    <>
      <rect x="2" y="8" width="20" height="8" rx="1.5" />
      <path d="M6 8v3M10 8v4M14 8v3M18 8v4" />
    </>
  ),
}

// Dashboard (grid)
export const DASHBOARD_ICON: ReactNode = (
  <>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </>
)

export function NavGlyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SalesBillingModal } from '../components/sales/SalesBillingModal'
import { ReturnRefundModal } from '../components/sales/ReturnRefundModal'
import { HeldBillsModal } from '../components/sales/HeldBillsModal'
import { DaySummaryModal } from '../components/sales/DaySummaryModal'
import { AddSupplierModal } from '../components/party/AddSupplierModal'
import { SupplierListModal } from '../components/party/SupplierListModal'
import { PurchaseEntryModal } from '../components/purchase/PurchaseEntryModal'
import { PurchaseHistoryModal } from '../components/purchase/PurchaseHistoryModal'
import { SupplierPaymentModal } from '../components/purchase/SupplierPaymentModal'
import { AddCategoryModal } from '../components/category/AddCategoryModal'
import { CategoryListModal } from '../components/category/CategoryListModal'
import { AddSubCategoryModal } from '../components/category/AddSubCategoryModal'
import { SubCategoryListModal } from '../components/category/SubCategoryListModal'
import { AddPackagingModal } from '../components/packaging/AddPackagingModal'
import { PackagingListModal } from '../components/packaging/PackagingListModal'
import { CreateItemMasterModal } from '../components/itemMaster/CreateItemMasterModal'
import { ItemMasterListModal } from '../components/itemMaster/ItemMasterListModal'
import { AddBrandModal } from '../components/brand/AddBrandModal'
import { BrandListModal } from '../components/brand/BrandListModal'
import { AddUnitModal } from '../components/unit/AddUnitModal'
import { UnitListModal } from '../components/unit/UnitListModal'
import { StockListModal } from '../components/stockMaster/StockListModal'
import { StockLedgerModal } from '../components/stockMaster/StockLedgerModal'
import { ExpiryManagementModal, type ExpiryMode } from '../components/stockMaster/ExpiryManagementModal'
import { SupplierLedgerModal } from '../components/party/SupplierLedgerModal'
import { QuickAddCustomerModal } from '../components/party/QuickAddCustomerModal'
import { CustomerListModal } from '../components/party/CustomerListModal'
import { CustomerLedgerModal } from '../components/party/CustomerLedgerModal'
import {
  MENUS,
  SIDEBAR_SECTIONS,
  TILE_COLORS,
  findMenuById,
  type ModalAction,
  type SubItem,
} from '../data/menus'
import { NAV_ICONS, NavGlyph } from '../components/layout/navIcons'
import {
  fetchSalesReport,
  fetchPurchaseReport,
  fetchProfitReport,
  fetchInventoryReport,
} from '../services/reportsApi'
import { fetchAccountsOverview, fetchExpenses } from '../services/accountsApi'
import { fetchPartyMasters } from '../services/partyMasterApi'
import type { CSSProperties, ReactNode } from 'react'
import styles from './DashboardPage.module.css'

const inr = (n: number) => '₹' + Math.round(n || 0).toLocaleString('en-IN')

const SECTION_COLORS: Record<string, string> = {
  Transactions: '#0d9488',
  Inventory: '#ea580c',
  Parties: '#7c3aed',
  Masters: '#2563eb',
}

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this-month', label: 'This Month' },
  { key: 'last-month', label: 'Last Month' },
  { key: 'six-months', label: 'Last 6 Months' },
  { key: 'this-year', label: 'This Year' },
] as const
type PeriodKey = (typeof PERIODS)[number]['key']

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function rangeFor(p: PeriodKey): { from: string; to: string } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (p) {
    case 'yesterday': {
      const y = new Date(today); y.setDate(y.getDate() - 1)
      return { from: ymd(y), to: ymd(y) }
    }
    case 'this-month':
      return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: ymd(today) }
    case 'last-month': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: ymd(first), to: ymd(last) }
    }
    case 'six-months':
      return { from: ymd(new Date(now.getFullYear(), now.getMonth() - 5, 1)), to: ymd(today) }
    case 'this-year':
      return { from: ymd(new Date(now.getFullYear(), 0, 1)), to: ymd(today) }
    case 'today':
    default:
      return { from: ymd(today), to: ymd(today) }
  }
}

const KPI_ICONS: Record<string, ReactNode> = {
  sales: (<><path d="m3 17 6-6 4 4 8-8" /><path d="M21 7h-5M21 7v5" /></>),
  purchase: (<><path d="M3 14v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /><path d="M12 3v11m0 0 4-4m-4 4-4-4" /></>),
  gross: (<><path d="M3 3v18h18" /><path d="m7 14 3-3 3 3 4-6" /></>),
  net: (<><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" /><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /></>),
  customers: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>),
  suppliers: (<><path d="M2 21h20" /><path d="M4 21V10l5 3V10l5 3V10l5 3v8" /><path d="M4 10 5 4h2l1 6" /></>),
  receivable: (<><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H5a2 2 0 0 1-2-2z" /><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6H7" /><path d="M12 11v6m0 0 2.5-2.5M12 17l-2.5-2.5" /></>),
  payable: (<><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H5a2 2 0 0 1-2-2z" /><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6H7" /><path d="M12 17v-6m0 0 2.5 2.5M12 11l-2.5 2.5" /></>),
  inventory: (<><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" /></>),
  cashbank: (<><path d="M3 10 12 4l9 6" /><path d="M5 10v8M9 10v8M15 10v8M19 10v8" /><path d="M3 20h18" /></>),
}

type Kpi = {
  key: string
  tone: string
  icon: ReactNode
  label: string
  value: string
  sub: string
  ready: boolean
  onClick: () => void
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null)
  const [activeSubId,  setActiveSubId]  = useState<number | null>(null)
  const [showNewBill, setShowNewBill] = useState(false)
  const [showSalesReturn, setShowSalesReturn] = useState(false)
  const [showHeldBills, setShowHeldBills] = useState(false)
  const [showDaySummary, setShowDaySummary] = useState(false)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showSupplierList, setShowSupplierList] = useState(false)
  const [showNewPurchase, setShowNewPurchase] = useState(false)
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false)
  const [showSupplierPayment, setShowSupplierPayment] = useState(false)
  const [showStockList, setShowStockList] = useState(false)
  const [showStockLedger, setShowStockLedger] = useState(false)
  const [expiryMode, setExpiryMode] = useState<ExpiryMode | null>(null)
  const [showSupplierLedger, setShowSupplierLedger] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [showCustomerLedger, setShowCustomerLedger] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showCategoryList, setShowCategoryList] = useState(false)
  const [showAddSubCategory, setShowAddSubCategory] = useState(false)
  const [showSubCategoryList, setShowSubCategoryList] = useState(false)
  const [showAddPackaging, setShowAddPackaging] = useState(false)
  const [showPackagingList, setShowPackagingList] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showItemList, setShowItemList] = useState(false)
  const [showAddBrand, setShowAddBrand] = useState(false)
  const [showBrandList, setShowBrandList] = useState(false)
  const [showAddUnit, setShowAddUnit] = useState(false)
  const [showUnitList, setShowUnitList] = useState(false)

  const [period, setPeriod] = useState<PeriodKey>('today')
  // Period-scoped figures (sales, purchase, profit) — reload on period change.
  const [pstats, setPstats] = useState<{ sales: number; purchase: number; gross: number; net: number } | null>(null)
  // Current snapshot figures (counts, balances) — load once.
  const [snap, setSnap] = useState<{
    customers: number; suppliers: number
    receivable: number; payable: number
    inventory: number; cashBank: number
  } | null>(null)

  useEffect(() => {
    let alive = true
    Promise.allSettled([
      fetchPartyMasters('Customer'),
      fetchPartyMasters('Distributor'),
      fetchAccountsOverview(),
      fetchInventoryReport(),
    ]).then(([c, s, a, i]) => {
      if (!alive) return
      const cust = c.status === 'fulfilled' ? c.value : []
      const sup = s.status === 'fulfilled' ? s.value : []
      const acc = a.status === 'fulfilled' ? a.value : null
      const inv = i.status === 'fulfilled' ? i.value : null
      setSnap({
        customers: cust.length,
        suppliers: sup.length,
        receivable: acc?.receivables.outstanding ?? 0,
        payable: acc?.payables.outstanding ?? 0,
        inventory: inv?.summary.stock_value_cost ?? 0,
        cashBank: (acc?.balances.cash_in_hand ?? 0) + (acc?.balances.bank_balance ?? 0),
      })
    })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    let alive = true
    setPstats(null)
    const { from, to } = rangeFor(period)
    Promise.allSettled([
      fetchSalesReport(from, to),
      fetchPurchaseReport(from, to),
      fetchProfitReport(from, to),
      fetchExpenses({ date_from: from, date_to: to }),
    ]).then(([s, p, pr, e]) => {
      if (!alive) return
      const sales = s.status === 'fulfilled' ? s.value.summary.net_sales : 0
      const purchase = p.status === 'fulfilled' ? p.value.summary.net_purchase : 0
      const gross = pr.status === 'fulfilled' ? pr.value.summary.gross_profit : 0
      const exp = e.status === 'fulfilled'
        ? e.value.reduce((sum, x) => sum + Number(x.amount || 0), 0)
        : 0
      setPstats({ sales, purchase, gross, net: gross - exp })
    })
    return () => { alive = false }
  }, [period])

  const selectedMenu = MENUS.find((m) => m.id === activeMenuId) ?? null
  const selectedSub  = selectedMenu?.subs.find((s) => s.id === activeSubId) ?? null
  const inSubSub     = (selectedSub?.subs?.length ?? 0) > 0

  const accentColor  = selectedMenu ? (TILE_COLORS[selectedMenu.color] ?? '#0e7490') : '#0e7490'
  const modalOpen    = activeMenuId !== null

  const currentItems = inSubSub ? (selectedSub?.subs ?? []) : (selectedMenu?.subs ?? [])
  const modalIcon    = inSubSub ? selectedSub?.icon  : selectedMenu?.icon
  const modalTitle   = inSubSub ? selectedSub?.label : selectedMenu?.label

  function closeAll() {
    setActiveMenuId(null)
    setActiveSubId(null)
  }

  function runAction(action: ModalAction) {
    switch (action) {
      case 'new-bill':          setShowNewBill(true); break
      case 'sales-return':      setShowSalesReturn(true); break
      case 'held-bills':        setShowHeldBills(true); break
      case 'day-summary':       setShowDaySummary(true); break
      case 'new-purchase':      setShowNewPurchase(true); break
      case 'purchase-history':  setShowPurchaseHistory(true); break
      case 'supplier-payment':  setShowSupplierPayment(true); break
      case 'stock-list':        setShowStockList(true); break
      case 'stock-ledger':      setShowStockLedger(true); break
      case 'expiry-all':        setExpiryMode('all'); break
      case 'expiry-near':       setExpiryMode('near'); break
      case 'expiry-expired':    setExpiryMode('expired'); break
      case 'supplier-ledger':   setShowSupplierLedger(true); break
      case 'add-customer':      setShowAddCustomer(true); break
      case 'customer-list':     setShowCustomerList(true); break
      case 'customer-ledger':   setShowCustomerLedger(true); break
      case 'add-supplier':      setShowAddSupplier(true); break
      case 'supplier-list':     setShowSupplierList(true); break
      case 'add-item':          setShowAddItem(true); break
      case 'item-list':         setShowItemList(true); break
      case 'add-category':      setShowAddCategory(true); break
      case 'category-list':     setShowCategoryList(true); break
      case 'add-sub-category':  setShowAddSubCategory(true); break
      case 'sub-category-list': setShowSubCategoryList(true); break
      case 'add-packaging':     setShowAddPackaging(true); break
      case 'packaging-list':    setShowPackagingList(true); break
      case 'add-brand':         setShowAddBrand(true); break
      case 'brand-list':        setShowBrandList(true); break
      case 'add-unit':          setShowAddUnit(true); break
      case 'unit-list':         setShowUnitList(true); break
    }
  }

  function handleSubItem(sub: SubItem) {
    if (sub.subs?.length) {
      setActiveSubId(sub.id)
      return
    }
    if (sub.action) {
      closeAll()
      runAction(sub.action)
      return
    }
    if (sub.to) {
      closeAll()
      navigate(sub.to)
      return
    }
  }

  function handleBack() {
    setActiveSubId(null)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeAll()
    }
    if (modalOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  useEffect(() => {
    const action = searchParams.get('action') as ModalAction | null
    if (!action) return
    runAction(action)
    const next = new URLSearchParams(searchParams)
    next.delete('action')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? ''
  const g = (name: string) => <NavGlyph>{KPI_ICONS[name]}</NavGlyph>

  const kpis: Kpi[] = [
    { key: 'sales', tone: 'teal', label: 'Total Sales', ready: !!pstats,
      value: pstats ? inr(pstats.sales) : '—', sub: periodLabel,
      onClick: () => navigate('/app/reports/sales'), icon: g('sales') },
    { key: 'purchase', tone: 'blue', label: 'Total Purchase', ready: !!pstats,
      value: pstats ? inr(pstats.purchase) : '—', sub: periodLabel,
      onClick: () => navigate('/app/reports/purchase'), icon: g('purchase') },
    { key: 'gross', tone: 'green', label: 'Gross Profit', ready: !!pstats,
      value: pstats ? inr(pstats.gross) : '—', sub: periodLabel,
      onClick: () => navigate('/app/reports/profit'), icon: g('gross') },
    { key: 'net', tone: 'violet', label: 'Net Profit', ready: !!pstats,
      value: pstats ? inr(pstats.net) : '—', sub: 'after expenses',
      onClick: () => navigate('/app/reports/profit'), icon: g('net') },
    { key: 'customers', tone: 'sky', label: 'Total Customers', ready: !!snap,
      value: snap ? snap.customers.toLocaleString('en-IN') : '—', sub: 'registered',
      onClick: () => navigate('/app/parties/customers'), icon: g('customers') },
    { key: 'suppliers', tone: 'cyan', label: 'Total Suppliers', ready: !!snap,
      value: snap ? snap.suppliers.toLocaleString('en-IN') : '—', sub: 'registered',
      onClick: () => navigate('/app/parties/distributors'), icon: g('suppliers') },
    { key: 'recv', tone: 'amber', label: 'Receivables', ready: !!snap,
      value: snap ? inr(snap.receivable) : '—', sub: 'as of now',
      onClick: () => navigate('/app/accounts/receivables'), icon: g('receivable') },
    { key: 'pay', tone: 'orange', label: 'Payables', ready: !!snap,
      value: snap ? inr(snap.payable) : '—', sub: 'as of now',
      onClick: () => navigate('/app/accounts/payables'), icon: g('payable') },
    { key: 'inv', tone: 'rose', label: 'Inventory Value', ready: !!snap,
      value: snap ? inr(snap.inventory) : '—', sub: 'at cost',
      onClick: () => navigate('/app/reports/inventory'), icon: g('inventory') },
    { key: 'cash', tone: 'indigo', label: 'Cash & Bank Balance', ready: !!snap,
      value: snap ? inr(snap.cashBank) : '—', sub: 'current',
      onClick: () => navigate('/app/accounts/cash-book'), icon: g('cashbank') },
  ]

  return (
    <div className={styles.page}>

      <div className={styles.posHeader}>
        <span className={styles.posBadge} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9 4.5 4h15L21 9" />
            <path d="M3 9h18v1.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9z" />
            <path d="M4.5 11v10h15V11" />
            <path d="M12 14v4M10 16h4" />
          </svg>
        </span>
        <div className={styles.posHeadText}>
          <h1 className={styles.posTitle}>Medical Store Management</h1>
          <p className={styles.posSub}>Point of sale &amp; daily operations</p>
        </div>
        <span className={styles.posDate}>
          <span className={styles.posDot} aria-hidden />
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      <div className={styles.kpiBar}>
        <span className={styles.kpiBarTitle}>Business Overview</span>
        <label className={styles.periodWrap}>
          <span className={styles.periodLabel}>Showing</span>
          <select
            className={styles.periodSelect}
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodKey)}
          >
            {PERIODS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.kpiRow}>
        {kpis.map((k) => (
          <button
            key={k.key}
            type="button"
            className={`${styles.kpiCard} ${styles[`kpi_${k.tone}`]} ${k.ready ? '' : styles.kpiLoading}`}
            onClick={k.onClick}
          >
            <span className={styles.kpiIcon}>{k.icon}</span>
            <span className={styles.kpiText}>
              <span className={styles.kpiValue}>{k.value}</span>
              <span className={styles.kpiLabel}>{k.label}</span>
            </span>
          </button>
        ))}
      </div>

      {SIDEBAR_SECTIONS.map((section) => {
        const menus = section.menuIds.map(findMenuById).filter(Boolean) as typeof MENUS
        if (menus.length === 0) return null
        return (
          <div key={section.label} className={styles.menuSection}>
            <p
              className={styles.menuSectionHead}
              style={{ '--sc': SECTION_COLORS[section.label] ?? '#0d9488' } as CSSProperties}
            >
              {section.label}
            </p>
            <div className={styles.sectionGrid}>
              {menus.map((menu) => {
                const color    = TILE_COLORS[menu.color] ?? '#475569'
                const isActive = activeMenuId === menu.id
                return (
                  <button
                    key={menu.id}
                    type="button"
                    className={`${styles.menuTile} ${isActive ? styles.tileActive : ''}`}
                    style={{ '--c': color } as CSSProperties}
                    onClick={() => {
                      setActiveMenuId(menu.id)
                      setActiveSubId(null)
                    }}
                  >
                    <span className={styles.tileIcon}>
                      <NavGlyph>{NAV_ICONS[menu.id]}</NavGlyph>
                    </span>
                    <span className={styles.tileLabel}>{menu.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {modalOpen && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close menu"
            onClick={closeAll}
          />

          <div
            className={styles.modal}
            style={{ borderTopColor: accentColor, '--c': accentColor } as CSSProperties}
          >
            <div className={styles.modalHeader}>
              {inSubSub && (
                <button type="button" className={styles.backBtn} onClick={handleBack}>
                  ‹ Back
                </button>
              )}
              <span className={styles.modalHeadIcon}>
                {!inSubSub && selectedMenu ? (
                  <NavGlyph>{NAV_ICONS[selectedMenu.id]}</NavGlyph>
                ) : (
                  modalIcon
                )}
              </span>
              <h2 className={styles.modalTitle}>{modalTitle}</h2>
              <button type="button" className={styles.closeBtn} onClick={closeAll}>
                ✕
              </button>
            </div>

            <div className={styles.modalGrid}>
              {currentItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={[
                    styles.modalItem,
                    item.star  ? styles.modalItemStar  : '',
                    (item as SubItem).subs ? styles.modalItemDrill : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleSubItem(item as SubItem)}
                >
                  {item.star && <span className={styles.itemStarDot} />}
                  <span className={styles.itemIcon}>{item.icon}</span>
                  <span className={styles.itemLabel}>{item.label}</span>
                  {(item as SubItem).subs && (
                    <span className={styles.itemChev} style={{ color: accentColor }}>›</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {showNewBill && (
        <SalesBillingModal
          onClose={() => setShowNewBill(false)}
          onCreated={() => {}}
        />
      )}
      {showSalesReturn && (
        <ReturnRefundModal onClose={() => setShowSalesReturn(false)} />
      )}
      {showHeldBills && (
        <HeldBillsModal onClose={() => setShowHeldBills(false)} />
      )}
      {showDaySummary && (
        <DaySummaryModal onClose={() => setShowDaySummary(false)} />
      )}
      {showAddSupplier && (
        <AddSupplierModal
          onClose={() => setShowAddSupplier(false)}
          onCreated={() => {}}
        />
      )}
      {showSupplierList && (
        <SupplierListModal onClose={() => setShowSupplierList(false)} />
      )}
      {showNewPurchase && (
        <PurchaseEntryModal
          onClose={() => setShowNewPurchase(false)}
          onCreated={() => {}}
        />
      )}
      {showPurchaseHistory && (
        <PurchaseHistoryModal onClose={() => setShowPurchaseHistory(false)} />
      )}
      {showSupplierPayment && (
        <SupplierPaymentModal onClose={() => setShowSupplierPayment(false)} />
      )}
      {showStockList && (
        <StockListModal onClose={() => setShowStockList(false)} />
      )}
      {showStockLedger && (
        <StockLedgerModal onClose={() => setShowStockLedger(false)} />
      )}
      {expiryMode && (
        <ExpiryManagementModal mode={expiryMode} onClose={() => setExpiryMode(null)} />
      )}
      {showSupplierLedger && (
        <SupplierLedgerModal onClose={() => setShowSupplierLedger(false)} />
      )}
      {showAddCustomer && (
        <QuickAddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onCreated={() => setShowAddCustomer(false)}
        />
      )}
      {showCustomerList && (
        <CustomerListModal onClose={() => setShowCustomerList(false)} />
      )}
      {showCustomerLedger && (
        <CustomerLedgerModal onClose={() => setShowCustomerLedger(false)} />
      )}
      {showAddCategory && (
        <AddCategoryModal
          onClose={() => setShowAddCategory(false)}
          onCreated={() => {}}
        />
      )}
      {showCategoryList && (
        <CategoryListModal onClose={() => setShowCategoryList(false)} />
      )}
      {showAddSubCategory && (
        <AddSubCategoryModal
          onClose={() => setShowAddSubCategory(false)}
          onCreated={() => {}}
        />
      )}
      {showSubCategoryList && (
        <SubCategoryListModal onClose={() => setShowSubCategoryList(false)} />
      )}
      {showAddPackaging && (
        <AddPackagingModal
          onClose={() => setShowAddPackaging(false)}
          onCreated={() => {}}
        />
      )}
      {showPackagingList && (
        <PackagingListModal onClose={() => setShowPackagingList(false)} />
      )}
      {showAddItem && (
        <CreateItemMasterModal
          onClose={() => setShowAddItem(false)}
          onCreated={() => {}}
        />
      )}
      {showItemList && (
        <ItemMasterListModal onClose={() => setShowItemList(false)} />
      )}
      {showAddBrand && (
        <AddBrandModal
          onClose={() => setShowAddBrand(false)}
          onCreated={() => {}}
        />
      )}
      {showBrandList && (
        <BrandListModal onClose={() => setShowBrandList(false)} />
      )}
      {showAddUnit && (
        <AddUnitModal
          onClose={() => setShowAddUnit(false)}
          onCreated={() => {}}
        />
      )}
      {showUnitList && (
        <UnitListModal onClose={() => setShowUnitList(false)} />
      )}
    </div>
  )
}

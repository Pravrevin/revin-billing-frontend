import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AddSupplierModal } from '../components/party/AddSupplierModal'
import { SupplierListModal } from '../components/party/SupplierListModal'
import { PurchaseEntryModal } from '../components/purchase/PurchaseEntryModal'
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
import styles from './DashboardPage.module.css'

type SubSubItem = { id: number; icon: string; label: string; star?: boolean }
type SubItem    = { id: number; icon: string; label: string; star?: boolean; subs?: SubSubItem[] }
type MenuItem   = { id: number; icon: string; label: string; color: string; subs: SubItem[] }

const TILE_COLORS: Record<string, string> = {
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

const MENUS: MenuItem[] = [
  {
    id: 1, icon: '🧾', label: 'Sales Billing', color: 'blue',
    subs: [
      { id: 1, icon: '➕', label: 'New Bill' },
      { id: 2, icon: '✏️', label: 'Edit Bill' },
      { id: 3, icon: '↩️', label: 'Return / Refund' },
      { id: 4, icon: '⏸️', label: 'Held Bills' },
      { id: 5, icon: '📅', label: 'Day Summary' },
    ],
  },
  {
    id: 2, icon: '📥', label: 'Purchase Entry', color: 'green',
    subs: [
      { id: 1, icon: '➕', label: 'New Purchase' },
      { id: 2, icon: '↩️', label: 'Purchase Return' },
      { id: 3, icon: '💸', label: 'Supplier Payment' },
      { id: 4, icon: '📜', label: 'Purchase History' },
    ],
  },
  {
    id: 3, icon: '📦', label: 'Inventory / Stock', color: 'orange',
    subs: [
      { id: 1, icon: '➕', label: 'Add New Medicine' },
      { id: 2, icon: '✏️', label: 'Update Medicine' },
      { id: 3, icon: '📋', label: 'Stock List' },
      { id: 4, icon: '🔖', label: 'Batch Details' },
      { id: 5, icon: '⚠️', label: 'Low Stock Alert' },
    ],
  },
  {
    id: 4, icon: '👥', label: 'Customers', color: 'purple',
    subs: [
      { id: 1, icon: '➕', label: 'Add Customer' },
      { id: 2, icon: '👁️', label: 'View Customers' },
      { id: 3, icon: '📒', label: 'Customer Ledger' },
    ],
  },
  {
    id: 5, icon: '🏭', label: 'Suppliers', color: 'cyan',
    subs: [
      { id: 1, icon: '➕', label: 'Add Supplier' },
      { id: 2, icon: '📋', label: 'Supplier List' },
      { id: 3, icon: '📒', label: 'Supplier Ledger' },
      { id: 4, icon: '💰', label: 'Supplier Outstanding', star: true },
    ],
  },
  {
    id: 6, icon: '💳', label: 'Accounts / Payments', color: 'teal',
    subs: [
      {
        id: 1, icon: '💸', label: 'Payment to Supplier',
        subs: [
          { id: 1, icon: '➕', label: 'New Payment' },
          { id: 2, icon: '📜', label: 'Payment History' },
          { id: 3, icon: '🏭', label: 'Supplier Wise Payment' },
          { id: 4, icon: '🔗', label: 'Adjust Against Bill', star: true },
        ],
      },
      { id: 2, icon: '💵', label: 'Receive from Customer' },
      { id: 3, icon: '📝', label: 'Expense Entry' },
      { id: 4, icon: '📖', label: 'Cash Book' },
      { id: 5, icon: '🏦', label: 'Bank Book' },
      { id: 6, icon: '📅', label: 'Day Book' },
    ],
  },
  {
    id: 7, icon: '📊', label: 'Reports', color: 'indigo',
    subs: [
      { id: 1, icon: '💰', label: 'Sales Report' },
      { id: 2, icon: '📥', label: 'Purchase Report' },
      { id: 3, icon: '📈', label: 'Profit Report' },
      { id: 4, icon: '📅', label: 'Daily Report' },
      { id: 5, icon: '🧾', label: 'GST Report' },
      { id: 6, icon: '📦', label: 'Inventory Report' },
    ],
  },
  {
    id: 8, icon: '⏰', label: 'Expiry Management', color: 'rose',
    subs: [
      { id: 1, icon: '💊', label: 'Expiry Medicines' },
      { id: 2, icon: '⚠️', label: 'Near Expiry (30 Days)' },
      { id: 3, icon: '🚫', label: 'Expired Stock' },
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
      { id: 1, icon: '➕', label: 'Add Item' },
      { id: 2, icon: '✏️', label: 'Update Item' },
      { id: 3, icon: '📋', label: 'See Items' },
      { id: 4, icon: '🕒', label: 'Items History' },
    ],
  },
  {
    id: 11, icon: '🏷️', label: 'Category Master', color: 'violet',
    subs: [
      { id: 1, icon: '➕', label: 'Add Category' },
      { id: 2, icon: '📋', label: 'See Categories' },
      { id: 3, icon: '✏️', label: 'Update Category' },
    ],
  },
  {
    id: 12, icon: '📂', label: 'Sub-Category Master', color: 'emerald',
    subs: [
      { id: 1, icon: '➕', label: 'Add Sub-Category' },
      { id: 2, icon: '📋', label: 'See Sub-Categories' },
      { id: 3, icon: '✏️', label: 'Update Sub-Category' },
    ],
  },
  {
    id: 13, icon: '📦', label: 'Packaging Master', color: 'amber',
    subs: [
      { id: 1, icon: '➕', label: 'Create' },
      { id: 2, icon: '📋', label: 'View All Packaging' },
    ],
  },
  {
    id: 14, icon: '🧷', label: 'Brand Master', color: 'pink',
    subs: [
      { id: 1, icon: '➕', label: 'Add Brand' },
      { id: 2, icon: '📋', label: 'See Brand' },
    ],
  },
]

const STATS = [
  { label: "Today's Sales", value: '₹ 48,920', delta: '+12% vs yesterday', tone: 'up' },
  { label: 'Stock Alerts',  value: '7 SKUs',   delta: 'Needs review',       tone: 'warn' },
  { label: 'Pending POs',   value: '3',         delta: '2 due today',        tone: 'neutral' },
  { label: 'Active Parties',value: '186',        delta: '14 new this week',   tone: 'neutral' },
] as const

export function DashboardPage() {
  const navigate = useNavigate()
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null)
  const [activeSubId,  setActiveSubId]  = useState<number | null>(null)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showSupplierList, setShowSupplierList] = useState(false)
  const [showNewPurchase, setShowNewPurchase] = useState(false)
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

  function handleSubItem(sub: SubItem) {
    if (sub.subs?.length) {
      setActiveSubId(sub.id)
      return
    }
    // Purchase Entry → New Purchase
    if (activeMenuId === 2 && sub.id === 1) {
      closeAll()
      setShowNewPurchase(true)
      return
    }
    // Suppliers → Add Supplier
    if (activeMenuId === 5 && sub.id === 1) {
      closeAll()
      setShowAddSupplier(true)
      return
    }
    // Suppliers → Supplier List
    if (activeMenuId === 5 && sub.id === 2) {
      closeAll()
      setShowSupplierList(true)
      return
    }
    // Item Master navigation
    if (activeMenuId === 10) {
      closeAll()
      if (sub.id === 1) setShowAddItem(true)
      else if (sub.id === 2) navigate('/app/item-master/update')
      else if (sub.id === 3) setShowItemList(true)
      else if (sub.id === 4) navigate('/app/item-master/history')
      return
    }
    // Category Master navigation
    if (activeMenuId === 11) {
      closeAll()
      if (sub.id === 1) setShowAddCategory(true)
      else if (sub.id === 2) setShowCategoryList(true)
      else if (sub.id === 3) navigate('/app/category-master/update')
      return
    }
    // Sub-Category Master navigation
    if (activeMenuId === 12) {
      closeAll()
      if (sub.id === 1) setShowAddSubCategory(true)
      else if (sub.id === 2) setShowSubCategoryList(true)
      else if (sub.id === 3) navigate('/app/sub-category-master/update')
      return
    }
    // Packaging Master navigation
    if (activeMenuId === 13) {
      closeAll()
      if (sub.id === 1) setShowAddPackaging(true)
      else if (sub.id === 2) setShowPackagingList(true)
      return
    }
    // Brand Master navigation
    if (activeMenuId === 14) {
      closeAll()
      if (sub.id === 1) setShowAddBrand(true)
      else if (sub.id === 2) setShowBrandList(true)
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

  return (
    <div className={styles.page}>

      <div className={styles.posHeader}>
        <span className={styles.posSymbol}>✚</span>
        <h1 className={styles.posTitle}>MEDICAL STORE MANAGEMENT</h1>
        <span className={styles.posDate}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      <div className={styles.statsRow}>
        {STATS.map((s) => (
          <div
            key={s.label}
            className={`${styles.statCard} ${styles[`card_${s.tone}` as keyof typeof styles]}`}
          >
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statValue}>{s.value}</p>
            <p className={`${styles.statDelta} ${styles[`delta_${s.tone}` as keyof typeof styles]}`}>
              {s.delta}
            </p>
          </div>
        ))}
      </div>

      <div className={styles.menuGrid}>
        {MENUS.map((menu) => {
          const color    = TILE_COLORS[menu.color] ?? '#475569'
          const isActive = activeMenuId === menu.id
          return (
            <button
              key={menu.id}
              type="button"
              className={`${styles.menuTile} ${isActive ? styles.tileActive : ''}`}
              style={isActive ? { background: color, borderColor: color } : undefined}
              onClick={() => {
                setActiveMenuId(menu.id)
                setActiveSubId(null)
              }}
            >
              <span
                className={styles.tileIcon}
                style={{ background: isActive ? 'rgba(255,255,255,0.18)' : color }}
              >
                {menu.icon}
              </span>
              <span className={styles.tileLabel}>{menu.label}</span>
            </button>
          )
        })}
        <button type="button" className={`${styles.menuTile} ${styles.exitTile}`}>
          <span className={styles.tileIcon} style={{ background: TILE_COLORS.dark }}>🚪</span>
          <span className={styles.tileLabel}>Exit</span>
        </button>
      </div>

      {modalOpen && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close menu"
            onClick={closeAll}
          />

          <div className={styles.modal} style={{ borderTopColor: accentColor }}>
            <div className={styles.modalHeader} style={{ borderBottomColor: `${accentColor}22` }}>
              {inSubSub && (
                <button type="button" className={styles.backBtn} onClick={handleBack}>
                  ‹ Back
                </button>
              )}
              <span className={styles.modalHeadIcon}>{modalIcon}</span>
              <h2 className={styles.modalTitle} style={{ color: accentColor }}>
                {modalTitle}
              </h2>
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
    </div>
  )
}

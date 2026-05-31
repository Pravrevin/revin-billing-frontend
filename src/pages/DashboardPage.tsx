import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SalesBillingModal } from '../components/sales/SalesBillingModal'
import { ReturnRefundModal } from '../components/sales/ReturnRefundModal'
import { HeldBillsModal } from '../components/sales/HeldBillsModal'
import { DaySummaryModal } from '../components/sales/DaySummaryModal'
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
import styles from './DashboardPage.module.css'

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

  return (
    <div className={styles.page}>

      <div className={styles.posHeader}>
        <span className={styles.posSymbol}>✚</span>
        <h1 className={styles.posTitle}>MEDICAL STORE MANAGEMENT</h1>
        <span className={styles.posDate}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {SIDEBAR_SECTIONS.map((section) => {
        const menus = section.menuIds.map(findMenuById).filter(Boolean) as typeof MENUS
        if (menus.length === 0) return null
        return (
          <div key={section.label} className={styles.menuSection}>
            <p className={styles.menuSectionHead}>{section.label}</p>
            <div className={styles.sectionGrid}>
              {menus.map((menu) => {
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

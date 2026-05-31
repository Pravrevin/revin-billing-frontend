import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { AccountsPage } from './pages/AccountsPage'
import { CategoryMasterPage } from './pages/CategoryMasterPage'
import { CustomerMasterPage } from './pages/CustomerMasterPage'
import { DashboardPage } from './pages/DashboardPage'
import { DistributorMasterPage } from './pages/DistributorMasterPage'
import { ItemMasterAddPage } from './pages/ItemMasterAddPage'
import { ItemMasterHistoryPage } from './pages/ItemMasterHistoryPage'
import { ItemMasterPage } from './pages/ItemMasterPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { LowStockAlertPage } from './pages/LowStockAlertPage'
import { ProductMasterPage } from './pages/ProductMasterPage'
import { PurchaseMasterPage } from './pages/PurchaseMasterPage'
import { ReportsPage } from './pages/ReportsPage'
import { SalesMasterPage } from './pages/SalesMasterPage'
import { StockMasterPage } from './pages/StockMasterPage'
import { SubCategoryMasterPage } from './pages/SubCategoryMasterPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductMasterPage />} />
          <Route path="stock" element={<StockMasterPage />} />
          <Route path="stock/low-stock" element={<LowStockAlertPage />} />
          <Route path="parties/customers" element={<CustomerMasterPage />} />
          <Route path="parties/distributors" element={<DistributorMasterPage />} />
          <Route path="sales" element={<SalesMasterPage />} />
          <Route path="purchases" element={<PurchaseMasterPage />} />
          <Route path="reports" element={<Navigate to="/app/reports/sales" replace />} />
          <Route path="reports/:type" element={<ReportsPage />} />
          <Route path="accounts" element={<Navigate to="/app/accounts/overview" replace />} />
          <Route path="accounts/:type" element={<AccountsPage />} />
          <Route path="item-master" element={<ItemMasterPage />} />
          <Route path="item-master/add" element={<ItemMasterAddPage />} />
          <Route path="item-master/update" element={<ItemMasterPage />} />
          <Route path="item-master/history" element={<ItemMasterHistoryPage />} />
          <Route path="category-master" element={<CategoryMasterPage />} />
          <Route path="category-master/add" element={<CategoryMasterPage />} />
          <Route path="category-master/update" element={<CategoryMasterPage />} />
          <Route path="sub-category-master" element={<SubCategoryMasterPage />} />
          <Route path="sub-category-master/add" element={<SubCategoryMasterPage />} />
          <Route path="sub-category-master/update" element={<SubCategoryMasterPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

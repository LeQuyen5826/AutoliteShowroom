import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MainLayout from '@/components/layout/MainLayout'
import AdminLayout from '@/components/layout/AdminLayout'

// ── Sprint 1 ──────────────────────────────────────────────────────────────────
import HomePage from '@/pages/HomePage'
import CarsPage from '@/pages/CarsPage'
import CarDetailPage from '@/pages/CarDetailPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'

// ── Sprint 2 ──────────────────────────────────────────────────────────────────
import OrderPage from '@/pages/OrderPage'
import MyOrdersPage from '@/pages/MyOrdersPage'
import TestDrivePage from '@/pages/TestDrivePage'
import NewCarsPage from '@/pages/NewCarsPage'
import UsedCarsPage from '@/pages/UsedCarsPage'
import ServicesPage from '@/pages/ServicesPage'
import ContactPage from '@/pages/ContactPage'

// ── Admin pages ───────────────────────────────────────────────────────────────
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminInventory from '@/pages/admin/AdminInventory'
import AdminOrders from '@/pages/admin/AdminOrders'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminTestDrives from '@/pages/admin/AdminTestDrives'
import AdminMaintenance from '@/pages/admin/AdminMaintenance'
import AdminCarImages from '@/pages/admin/AdminCarImages'

import { useAuthStore } from '@/store/auth.store'
import { useInitAuth } from '@/hooks/useInitAuth'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

// ─── Route guards ─────────────────────────────────────────────────────────────

/** Chuyển về /login nếu chưa đăng nhập */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

/**
 * Bảo vệ khu vực /admin.
 * - Chưa đăng nhập → /login
 * - Role customer → về trang chủ
 * - staff & admin → được vào
 */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'customer') return <Navigate to="/" replace />
  return <>{children}</>
}

/**
 * Bảo vệ các route chỉ dành cho admin.
 * staff cố vào → redirect về /admin (trang đầu tiên staff có quyền)
 */
function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/admin/inventory" replace />
  return <>{children}</>
}

/** Khách chưa đăng nhập mới vào được trang login/register */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

// ─── App ──────────────────────────────────────────────────────────────────────

function AppInner() {
  useInitAuth()
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
      <BrowserRouter>
        <Routes>
          {/* ── Chỉ khách chưa đăng nhập ── */}
          <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* ── Giao diện khách hàng ── */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />

            {/* Danh sách xe */}
            <Route path="/cars"       element={<CarsPage />} />
            <Route path="/cars/new"   element={<NewCarsPage />} />
            <Route path="/cars/used"  element={<UsedCarsPage />} />
            <Route path="/cars/:id"   element={<CarDetailPage />} />

            {/* Thông tin chung */}
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact"  element={<ContactPage />} />
            <Route path="/about"    element={
              <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <h1 className="font-display font-bold text-3xl text-neutral-900 mb-4">Về chúng tôi</h1>
                <p className="text-neutral-500 text-lg">AutoElite Showroom — Hệ thống quản lý và bán xe thông minh.</p>
              </div>
            } />

            {/* Chỉ người đã đăng nhập (mọi role) */}
            <Route path="/order/:carId"       element={<PrivateRoute><OrderPage /></PrivateRoute>} />
            <Route path="/orders"             element={<PrivateRoute><MyOrdersPage /></PrivateRoute>} />
            <Route path="/test-drive/:carId"  element={<PrivateRoute><TestDrivePage /></PrivateRoute>} />

            {/* 404 */}
            <Route path="*" element={
              <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                <p className="font-display font-bold text-6xl text-neutral-200 mb-4">404</p>
                <p className="text-neutral-500 mb-6">Trang bạn tìm không tồn tại.</p>
                <a href="/" className="btn-primary">Về trang chủ</a>
              </div>
            } />
          </Route>

          {/* ── Khu vực quản trị (staff + admin) ── */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            {/*
              Dashboard — CHỈ admin xem được.
              Staff vào /admin sẽ bị redirect sang /admin/inventory (xem AdminOnlyRoute).
              Nếu admin vào /admin → trang tổng quan.
            */}
            <Route index element={<AdminOnlyRoute><AdminDashboard /></AdminOnlyRoute>} />

            {/* Staff + Admin */}
            <Route path="inventory"   element={<AdminInventory />} />
            <Route path="orders"      element={<AdminOrders />} />
            <Route path="test-drives" element={<AdminTestDrives />} />
            <Route path="maintenance" element={<AdminMaintenance />} />
            <Route path="car-images"  element={<AdminCarImages />} />

            {/* Chỉ Admin */}
            <Route path="users" element={<AdminOnlyRoute><AdminUsers /></AdminOnlyRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
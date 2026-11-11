import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAdmin, RequireUser } from './components/Guards'
import { AdminLayout } from './layouts/AdminLayout'
import { MainLayout } from './layouts/MainLayout'
import { AdminLoginPage } from './admin/pages/AdminLoginPage'
import { AdminPaymentsPage } from './admin/pages/AdminPaymentsPage'
import {
  AdminAnalyticsPage,
  AdminDashboardPage,
  AdminOrdersPage,
  AdminProductsPage,
  AdminSettingsPage,
  AdminUsersPage,
} from './admin/pages/AdminPages'
import { AboutPage } from './pages/AboutPage'
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignupPage } from './pages/AuthPages'
import { CartPage } from './pages/CartPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage, PrivacyPage, TermsPage } from './pages/LegalPages'
import { OrderSuccessPage } from './pages/OrderSuccessPage'
import { OrderDetailPage, OrdersPage } from './pages/OrdersPages'
import { PaymentPage } from './pages/PaymentPage'
import { ProductDetailsPage } from './pages/ProductDetailsPage'
import { ProfilePage } from './pages/ProfilePage'
import { ShopPage } from './pages/ShopPage'
import { WishlistPage } from './pages/WishlistPage'

function Storefront({ children }) {
  return <MainLayout>{children}</MainLayout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Storefront><HomePage /></Storefront>} />
        <Route path="/products" element={<Storefront><ShopPage /></Storefront>} />
        <Route path="/products/:slug" element={<Storefront><ProductDetailsPage /></Storefront>} />
        <Route path="/categories" element={<Storefront><CategoriesPage /></Storefront>} />
        <Route path="/cart" element={<Storefront><CartPage /></Storefront>} />
        <Route path="/checkout" element={<Storefront><CheckoutPage /></Storefront>} />
        <Route path="/payment" element={<Storefront><PaymentPage /></Storefront>} />
        <Route path="/order-success" element={<Storefront><OrderSuccessPage /></Storefront>} />
        <Route path="/login" element={<Storefront><LoginPage /></Storefront>} />
        <Route path="/signup" element={<Storefront><SignupPage /></Storefront>} />
        <Route path="/forgot-password" element={<Storefront><ForgotPasswordPage /></Storefront>} />
        <Route path="/reset-password" element={<Storefront><ResetPasswordPage /></Storefront>} />
        <Route path="/verify-phone" element={<Navigate to="/profile" replace />} />
        <Route path="/wishlist" element={<Storefront><WishlistPage /></Storefront>} />
        <Route
          path="/profile"
          element={
            <Storefront>
              <RequireUser>
                <ProfilePage />
              </RequireUser>
            </Storefront>
          }
        />
        <Route path="/orders" element={<Storefront><OrdersPage /></Storefront>} />
        <Route path="/orders/:id" element={<Storefront><OrderDetailPage /></Storefront>} />
        <Route path="/about" element={<Storefront><AboutPage /></Storefront>} />
        <Route path="/contact" element={<Storefront><ContactPage /></Storefront>} />
        <Route path="/privacy" element={<Storefront><PrivacyPage /></Storefront>} />
        <Route path="/terms" element={<Storefront><TermsPage /></Storefront>} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="customers" element={<Navigate to="/admin/users" replace />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Storefront><NotFoundPage /></Storefront>} />
      </Routes>
    </BrowserRouter>
  )
}

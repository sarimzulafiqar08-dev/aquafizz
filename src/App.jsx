import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Spinner } from './components/Feedback'
import { RequireAdmin, RequireUser } from './components/Guards'
import { HomePage } from './pages/HomePage'
import { AdminLayout } from './layouts/AdminLayout'
import { MainLayout } from './layouts/MainLayout'
// Pages load on demand, so the first visit only downloads the page being opened.
const page = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })))
const admin = () => import('./admin/pages/AdminPages')
const auth = () => import('./pages/AuthPages')
const legal = () => import('./pages/LegalPages')
const orders = () => import('./pages/OrdersPages')

const AdminLoginPage = page(() => import('./admin/pages/AdminLoginPage'), 'AdminLoginPage')
const AdminMessagesPage = page(() => import('./admin/pages/AdminMessagesPage'), 'AdminMessagesPage')
const AdminPaymentsPage = page(() => import('./admin/pages/AdminPaymentsPage'), 'AdminPaymentsPage')
const AdminAnalyticsPage = page(admin, 'AdminAnalyticsPage')
const AdminDashboardPage = page(admin, 'AdminDashboardPage')
const AdminOrdersPage = page(admin, 'AdminOrdersPage')
const AdminProductsPage = page(admin, 'AdminProductsPage')
const AdminSettingsPage = page(admin, 'AdminSettingsPage')
const AdminUsersPage = page(admin, 'AdminUsersPage')
const AboutPage = page(() => import('./pages/AboutPage'), 'AboutPage')
const ForgotPasswordPage = page(auth, 'ForgotPasswordPage')
const LoginPage = page(auth, 'LoginPage')
const ResetPasswordPage = page(auth, 'ResetPasswordPage')
const SignupPage = page(auth, 'SignupPage')
const CartPage = page(() => import('./pages/CartPage'), 'CartPage')
const CategoriesPage = page(() => import('./pages/CategoriesPage'), 'CategoriesPage')
const CheckoutPage = page(() => import('./pages/CheckoutPage'), 'CheckoutPage')
const ContactPage = page(() => import('./pages/ContactPage'), 'ContactPage')
const NotFoundPage = page(legal, 'NotFoundPage')
const PrivacyPage = page(legal, 'PrivacyPage')
const TermsPage = page(legal, 'TermsPage')
const OrderSuccessPage = page(() => import('./pages/OrderSuccessPage'), 'OrderSuccessPage')
const OrderDetailPage = page(orders, 'OrderDetailPage')
const OrdersPage = page(orders, 'OrdersPage')
const PaymentPage = page(() => import('./pages/PaymentPage'), 'PaymentPage')
const ProductDetailsPage = page(() => import('./pages/ProductDetailsPage'), 'ProductDetailsPage')
const ProfilePage = page(() => import('./pages/ProfilePage'), 'ProfilePage')
const ShopPage = page(() => import('./pages/ShopPage'), 'ShopPage')
const WishlistPage = page(() => import('./pages/WishlistPage'), 'WishlistPage')

function PageLoading() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-primary" role="status" aria-label="Loading page">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

function Storefront({ children }) {
  return (
    <MainLayout>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </MainLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
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
          <Route path="messages" element={<AdminMessagesPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Storefront><NotFoundPage /></Storefront>} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

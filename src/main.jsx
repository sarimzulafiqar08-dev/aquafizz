import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import { BackendMissing } from './components/BackendMissing.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { CheckoutProvider } from './context/CheckoutContext.jsx'
import { ConfirmProvider } from './context/ConfirmContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import './index.css'
import { isSupabaseConfigured } from './services/supabaseClient.js'

registerSW({ immediate: true })

const root = createRoot(document.getElementById('root'))

// Demo mode (browser storage) is for local development only.
if (import.meta.env.MODE === 'production' && !isSupabaseConfigured) {
  root.render(<BackendMissing />)
} else root.render(
  <StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <CheckoutProvider>
                <App />
              </CheckoutProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  </StrictMode>,
)

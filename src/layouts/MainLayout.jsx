import { useLocation } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { MobileBottomNav } from '../components/MobileBottomNav'

export function MainLayout({ children }) {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-nav">
        {pathname === '/' ? null : <BackButton className="-mt-3 mb-3 -ml-2" />}
        {children}
      </main>
      <div className="pb-nav md:pb-0">
        <Footer />
      </div>
      <MobileBottomNav />
    </div>
  )
}

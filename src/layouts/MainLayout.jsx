import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { MobileBottomNav } from '../components/MobileBottomNav'

export function MainLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-nav">{children}</main>
      <div className="pb-nav md:pb-0">
        <Footer />
      </div>
      <MobileBottomNav />
    </div>
  )
}

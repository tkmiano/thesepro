import type { ReactNode } from 'react'
import Header from '@/components/shared/header'
import Footer from '@/components/shared/footer'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

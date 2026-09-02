import { Suspense } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import ScrollMemory from '@/components/ScrollMemory'
import NotificationBell from '@/components/NotificationBell'
import SignOutButton from '@/components/SignOutButton'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="dash-dark h-16 border-b px-6 flex items-center justify-end shrink-0 gap-3">
          <NotificationBell />
          <SignOutButton />
        </header>
        {/* The scrolling element is this <main>, not the document, so it needs
            its own scroll restoration — see ScrollMemory. */}
        <main id="admin-scroll" className="flex-1 overflow-y-auto">
          <Suspense fallback={null}>
            <ScrollMemory targetId="admin-scroll" />
          </Suspense>
          {children}
        </main>
      </div>
    </div>
  )
}

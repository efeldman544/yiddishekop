import AdminSidebar from '@/components/AdminSidebar'
import NotificationBell from '@/components/NotificationBell'
import SignOutButton from '@/components/SignOutButton'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="dash-dark h-14 border-b px-6 flex items-center justify-end shrink-0 gap-3">
          <a href="/" className="dash-link-dim text-xs transition-colors hidden sm:block">← Main site</a>
          <NotificationBell />
          <SignOutButton />
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

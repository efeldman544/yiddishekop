import AdminSidebar from '@/components/AdminSidebar'
import NotificationBell from '@/components/NotificationBell'
import SignOutButton from '@/components/SignOutButton'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center justify-end shrink-0 gap-3">
          <NotificationBell />
          <SignOutButton />
        </header>
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

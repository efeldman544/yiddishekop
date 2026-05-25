import EmployerNav from '@/components/EmployerNav'

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <EmployerNav />
      {children}
    </div>
  )
}

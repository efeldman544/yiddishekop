import EmployerNav from '@/components/EmployerNav'

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <EmployerNav />
      {children}
    </div>
  )
}

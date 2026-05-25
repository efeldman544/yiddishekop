import CandidateNav from '@/components/CandidateNav'

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <CandidateNav />
      {children}
    </div>
  )
}

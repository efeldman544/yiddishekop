import CandidateNav from '@/components/CandidateNav'

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <CandidateNav />
      {children}
    </div>
  )
}

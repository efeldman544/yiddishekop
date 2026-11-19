// Placeholders shown the instant a page is clicked, shaped like the page that
// is coming, so a click visibly did something and the content doesn't jump
// when it arrives. Used by each admin route's loading.tsx.

function Bar({ className = '' }: { className?: string }) {
  return <div className={`bg-muted rounded-lg animate-pulse ${className}`} />
}

function Header({ actions = 1 }: { actions?: number }) {
  return (
    <div className="flex items-center justify-between">
      <Bar className="h-8 w-44" />
      <div className="flex gap-2">
        {Array.from({ length: actions }, (_, i) => <Bar key={i} className="h-9 w-28" />)}
      </div>
    </div>
  )
}

/** Just the rows of the candidate list — also shown inside the page on first load. */
export function CandidateRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <Bar className="h-4 w-48" />
            <Bar className="h-3 w-72 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** The Candidates page: title, search, filters, rows. */
export function CandidateListSkeleton() {
  return (
    <main className="dash-page">
      <Header actions={2} />
      <Bar className="h-10 w-full" />
      <div className="flex gap-3">
        <Bar className="h-6 w-64" />
        <Bar className="h-6 w-48" />
        <Bar className="h-6 w-40" />
      </div>
      <CandidateRowsSkeleton />
    </main>
  )
}

/** A list page: title, optional tabs, a stack of cards. */
export function ListPageSkeleton({ tabs = false, rows = 5 }: { tabs?: boolean; rows?: number }) {
  return (
    <main className="dash-page">
      <Header />
      {tabs && (
        <div className="flex gap-2">
          <Bar className="h-9 w-32" />
          <Bar className="h-9 w-32" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => <Bar key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    </main>
  )
}

/** A two-column page: a list on the left, the selected item on the right. */
export function SplitPageSkeleton() {
  return (
    <main className="dash-page">
      <Header />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => <Bar key={i} className="h-14 w-full rounded-xl" />)}
        </div>
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 4 }, (_, i) => <Bar key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      </div>
    </main>
  )
}

/** A single person's page: header card, details on the left, controls on the right. */
export function DetailPageSkeleton() {
  return (
    <main className="dash-page">
      <Bar className="h-5 w-36" />
      <Bar className="h-28 w-full rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Bar className="h-36 w-full rounded-xl" />
          <Bar className="h-56 w-full rounded-xl" />
          <Bar className="h-20 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Bar className="h-36 w-full rounded-xl" />
          <Bar className="h-72 w-full rounded-xl" />
        </div>
      </div>
    </main>
  )
}

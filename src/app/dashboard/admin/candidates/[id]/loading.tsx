export default function Loading() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="rounded-xl bg-muted animate-pulse h-28" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl bg-muted animate-pulse h-36" />
          <div className="rounded-xl bg-muted animate-pulse h-56" />
          <div className="rounded-xl bg-muted animate-pulse h-20" />
          <div className="rounded-xl bg-muted animate-pulse" style={{ paddingBottom: '56.25%' }} />
        </div>
        <div className="space-y-6">
          <div className="rounded-xl bg-muted animate-pulse h-36" />
          <div className="rounded-xl bg-muted animate-pulse h-72" />
          <div className="rounded-xl bg-muted animate-pulse h-10" />
          <div className="rounded-xl bg-muted animate-pulse h-48" />
        </div>
      </div>
    </main>
  )
}

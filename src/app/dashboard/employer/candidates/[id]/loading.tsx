export default function Loading() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="max-w-3xl space-y-5">
        <div className="rounded-xl bg-muted animate-pulse h-28" />
        <div className="rounded-xl bg-muted animate-pulse h-52" />
        <div className="rounded-xl bg-muted animate-pulse" style={{ paddingBottom: '56.25%' }} />
        <div className="rounded-xl bg-muted animate-pulse h-32" />
      </div>
    </main>
  )
}

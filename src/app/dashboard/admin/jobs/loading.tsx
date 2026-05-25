export default function Loading() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-9 w-36 bg-muted rounded-lg animate-pulse" />
        <div className="h-9 w-24 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="rounded-xl bg-muted animate-pulse h-64" />
    </main>
  )
}

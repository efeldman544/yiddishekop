/**
 * One way of showing an error, for the whole dashboard.
 *
 * There were five: two sizes of rounded-md box, two of rounded-lg, and a
 * couple of browser alerts. Each carried whatever the database happened to
 * say. Together they made failure look like a bug rather than something the
 * site had accounted for.
 *
 * Pair it with humanError() — this decides how it looks, that decides what it
 * says.
 *
 * The auth pages keep their own .auth-error, which is built for a dark panel
 * and would be unreadable in these colours.
 */
export default function ErrorNote({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  if (!children) return null
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm leading-snug text-red-800 ${className}`}
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-12a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0v-4A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      </svg>
      <span className="min-w-0">{children}</span>
    </div>
  )
}

import Link from 'next/link'

/**
 * One line of the getting-started checklist.
 *
 * Its own file so both states can be rendered side by side and looked at:
 * with a button when booking is open, and without one when an admin has
 * closed it, where the button would lead to a page that refuses.
 */
export default function StepItem({
  number, title, description, done, locked, href, linkLabel,
}: {
  number: number; title: string; description: string
  done: boolean; locked: boolean
  /** Omitted when there is nothing for the candidate to do yet — booking
      turned off, for one, where a button would lead to a page that refuses. */
  href?: string; linkLabel?: string
}) {
  return (
    <div className={`flex items-center gap-4 px-4 py-3.5 rounded-lg border transition-colors ${
      done ? 'bg-emerald-50/60 border-emerald-200' : locked ? 'bg-muted/50 border-border opacity-50' : 'bg-white border-gray-200'
    }`}>
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
        done ? 'bg-emerald-500 text-white' : locked ? 'bg-muted text-muted-foreground' : 'bg-indigo-600 text-white'
      }`}>
        {done ? '✓' : number}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold ${done ? 'text-emerald-800' : 'text-foreground'}`}>{title}</p>
        <p className={`text-[12px] mt-0.5 ${done ? 'text-emerald-600' : 'text-muted-foreground'}`}>
          {done ? 'Completed' : description}
        </p>
      </div>
      {!locked && !done && href && (
        <Link href={href} className="shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

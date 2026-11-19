'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BackButton from '@/components/BackButton'
import { useToast } from '@/components/Toaster'
import { humanError } from '@/lib/errorMessage'
import { resumeHref } from '@/lib/resumeUrl'
import { candidateHref, noteOpened, parseSequence, readSequenceRaw, type SequenceItem } from '@/lib/candidateSequence'

// The top of a candidate's page, pinned while you scroll: who they are, the
// things you do to a candidate, and Previous / Next through the list you
// opened them from (← → on the keyboard too).
//
// Previous and Next replace this page in the history rather than adding to
// it, so Back still goes straight to the list, which then picks out whoever
// you looked at last.

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-gray-50 text-gray-500 border-gray-200',
  placed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

const noSubscribe = () => () => {}

export default function CandidateTopBar({
  candidateId,
  source = 'profile',
  name,
  subtitle,
  status: initialStatus = 'active',
  interviewed: initialInterviewed = false,
  hasResume = false,
  children,
}: {
  candidateId: string
  /** A video-interview candidate has no account, status or résumé — only the
      name, Previous / Next and whatever actions are passed in. */
  source?: 'profile' | 'video'
  name: string | null
  subtitle: string
  status?: string
  interviewed?: boolean
  hasResume?: boolean
  /** The Edit profile button, which brings its own panel. */
  children?: React.ReactNode
}) {
  const router = useRouter()
  const toast = useToast()
  const [status, setStatus] = useState(initialStatus)
  const [interviewed, setInterviewed] = useState(initialInterviewed)
  const [busy, setBusy] = useState<'approve' | 'interviewed' | null>(null)

  // Read from sessionStorage in a way that renders the same on the server
  // (nothing) as on first paint, then fills in.
  const raw = useSyncExternalStore(noSubscribe, readSequenceRaw, () => null)
  const sequence = useMemo(() => parseSequence(raw), [raw])
  const index = sequence.findIndex(item => item.id === candidateId)
  const prev = index > 0 ? sequence[index - 1] : null
  const next = index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : null

  function go(item: SequenceItem | null) {
    if (!item) return
    noteOpened(item.id)
    router.replace(candidateHref(item))
  }

  // Have the neighbours ready, so Previous / Next feel immediate.
  const prevHref = prev ? candidateHref(prev) : null
  const nextHref = next ? candidateHref(next) : null
  useEffect(() => {
    if (prevHref) router.prefetch(prevHref)
    if (nextHref) router.prefetch(nextHref)
  }, [prevHref, nextHref, router])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      // Not while a panel is open over the page.
      if (document.querySelector('[data-modal]')) return
      if (e.key === 'ArrowLeft' && prev) { e.preventDefault(); go(prev) }
      if (e.key === 'ArrowRight' && next) { e.preventDefault(); go(next) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // re-bound each render so it always sees the current neighbours

  async function approve() {
    setBusy('approve')
    const { error } = await createClient().from('candidate_profiles').update({ status: 'active' }).eq('id', candidateId)
    setBusy(null)
    if (error) { toast.show(humanError(error, 'Couldn’t approve this candidate.'), 'error'); return }
    setStatus('active')
    toast.show('Approved — employers can now see them')
    router.refresh()
  }

  async function toggleInterviewed() {
    const value = !interviewed
    setBusy('interviewed')
    const { error } = await createClient().from('candidate_profiles').update({
      interviewed: value,
      interviewed_at: value ? new Date().toISOString() : null,
    }).eq('id', candidateId)
    setBusy(null)
    if (error) { toast.show(humanError(error, 'Couldn’t update this candidate.'), 'error'); return }
    setInterviewed(value)
    toast.show(value ? 'Marked as interviewed' : 'No longer marked as interviewed')
  }

  function showAssign() {
    const el = document.getElementById('assign')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    el?.classList.add('ring-2', 'ring-indigo-200')
    setTimeout(() => el?.classList.remove('ring-2', 'ring-indigo-200'), 1800)
  }

  return (
    <div className="sticky top-0 z-20 -mx-8 px-8 pt-5 pb-4 bg-background border-b border-gray-100">
      <div className="flex items-center justify-between gap-4">
        <BackButton fallback="/dashboard/admin" label="Back" />
        {index >= 0 && sequence.length > 1 && (
          <div className="flex items-center gap-1 text-sm">
            <Button variant="ghost" size="sm" disabled={!prev} onClick={() => go(prev)} title="Previous (←)">
              ‹ Previous
            </Button>
            <span className="text-xs text-gray-400 tabular-nums px-1">{index + 1} of {sequence.length}</span>
            <Button variant="ghost" size="sm" disabled={!next} onClick={() => go(next)} title="Next (→)">
              Next ›
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="page-title truncate">{name ?? 'Unnamed'}</h2>
            {source === 'video'
              ? <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">Video interview only</Badge>
              : <Badge variant="outline" className={`capitalize ${STATUS_STYLE[status] ?? ''}`}>{status}</Badge>}
          </div>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {source === 'profile' && status === 'pending' && (
            <Button size="sm" onClick={approve} disabled={busy !== null}>
              {busy === 'approve' ? 'Approving…' : 'Approve for browse'}
            </Button>
          )}
          {source === 'profile' && (
            <Button variant="outline" size="sm" onClick={toggleInterviewed} disabled={busy !== null}
              className={interviewed ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : ''}>
              {interviewed ? 'Interviewed ✓' : 'Mark interviewed'}
            </Button>
          )}
          {source === 'profile' && hasResume && (
            <a href={resumeHref(candidateId, name)} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 text-[0.8rem] font-medium hover:bg-muted">
              Résumé
            </a>
          )}
          {source === 'profile' && <Button variant="outline" size="sm" onClick={showAssign}>Assign</Button>}
          {children}
        </div>
      </div>
    </div>
  )
}

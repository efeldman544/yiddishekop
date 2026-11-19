'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

// Small messages at the bottom of the screen: "Saved", "Deleted · Undo".
//
// Deleting used to go through the browser's own "Are you sure?" box — grey,
// unstyled, and a speed bump on every delete. Now a delete happens on screen
// at once and is only carried out a few seconds later, with an Undo in the
// meantime. A mistake costs one click instead of the record.

type Tone = 'default' | 'error'
type Toast = { id: number; message: string; tone: Tone; action?: { label: string; onClick: () => void } }

type Undoable = {
  /** What happened, e.g. "Job deleted". */
  message: string
  /** Do it for real. Throw to report a failure. */
  commit: () => Promise<void>
  /** Put things back on screen — both on Undo and when commit fails. */
  restore: () => void
  /** What to say if commit fails. */
  failure?: string
}

type ToastApi = {
  show: (message: string, tone?: Tone) => void
  /** Already hidden on screen by the caller; carried out unless undone. */
  undoable: (u: Undoable) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const SHOW_MS = 3000
const UNDO_MS = 5000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)
  // Deletes waiting out their Undo window, so leaving the page carries them out
  // rather than silently dropping them.
  const pending = useRef(new Map<number, { timer: ReturnType<typeof setTimeout>; run: () => void }>())

  const dismiss = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  const push = useCallback((toast: Omit<Toast, 'id'>, ms: number) => {
    const id = nextId.current++
    setToasts(prev => [...prev.slice(-2), { ...toast, id }])
    setTimeout(() => dismiss(id), ms)
    return id
  }, [dismiss])

  const show = useCallback((message: string, tone: Tone = 'default') => {
    push({ message, tone }, tone === 'error' ? SHOW_MS * 2 : SHOW_MS)
  }, [push])

  const undoable = useCallback(({ message, commit, restore, failure }: Undoable) => {
    const run = () => {
      pending.current.delete(id)
      commit().catch(err => {
        console.error('undoable action failed:', err)
        restore()
        show(failure ?? 'That didn’t go through, so it has been put back.', 'error')
      })
    }
    const id = push({
      message,
      tone: 'default',
      action: {
        label: 'Undo',
        onClick: () => {
          const entry = pending.current.get(id)
          if (!entry) return
          clearTimeout(entry.timer)
          pending.current.delete(id)
          restore()
          dismiss(id)
        },
      },
    }, UNDO_MS)
    pending.current.set(id, { timer: setTimeout(run, UNDO_MS), run })
  }, [push, dismiss, show])

  // Closing or reloading the tab inside the Undo window still carries the
  // delete out.
  useEffect(() => {
    const flush = () => {
      for (const { timer, run } of [...pending.current.values()]) { clearTimeout(timer); run() }
    }
    window.addEventListener('pagehide', flush)
    return () => { window.removeEventListener('pagehide', flush); flush() }
  }, [])

  const api = useMemo(() => ({ show, undoable }), [show, undoable])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} role="status"
            className={`pointer-events-auto flex items-center gap-4 rounded-xl px-4 py-2.5 text-sm shadow-lg ${
              t.tone === 'error' ? 'bg-red-700 text-white' : 'bg-gray-900 text-white'
            }`}>
            <span>{t.message}</span>
            {t.action && (
              <button type="button" onClick={t.action.onClick}
                className="font-semibold text-indigo-300 hover:text-indigo-200">
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast must be used inside <ToastProvider>')
  return api
}

/**
 * Remove rows from a list with an Undo: the row disappears at once, and the
 * delete runs after the Undo window. Filter your list with `hidden`.
 */
export function useUndoableRemove() {
  const { undoable } = useToast()
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set())

  const remove = useCallback((id: string, opts: {
    message: string
    commit: () => Promise<void>
    /** Called once it's really gone, to drop it from your own state. */
    onRemoved?: () => void
    failure?: string
  }) => {
    const unhide = () => setHidden(prev => { const next = new Set(prev); next.delete(id); return next })
    setHidden(prev => new Set(prev).add(id))
    undoable({
      message: opts.message,
      failure: opts.failure,
      commit: async () => { await opts.commit(); opts.onRemoved?.(); unhide() },
      restore: unhide,
    })
  }, [undoable])

  return { hidden, remove }
}

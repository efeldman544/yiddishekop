'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { noteNavigation } from '@/lib/navHistory'

// The admin shell scrolls an inner <main>, not the document. Browsers and the
// Next router both restore the *document* scroller, so nothing restored this
// one: opening a candidate from halfway down a long list and coming back
// dropped you at the top every time.
//
// Positions are remembered per URL, so a Back that returns to a filtered list
// lands exactly where it left, and each tab keeps its own place.

const KEY = 'scroll-positions'
// Enough for a session's worth of tabs and lists without growing forever.
const MAX_ENTRIES = 40
// Lists load their rows client-side, so the container is short for a moment
// after arriving. Keep trying until it's tall enough to honour the position.
const RESTORE_TIMEOUT_MS = 3000

function read(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Record<string, number>
  } catch {
    return {}
  }
}

function write(positions: Record<string, number>) {
  try {
    const keys = Object.keys(positions)
    if (keys.length > MAX_ENTRIES) {
      for (const k of keys.slice(0, keys.length - MAX_ENTRIES)) delete positions[k]
    }
    sessionStorage.setItem(KEY, JSON.stringify(positions))
  } catch {
    // Storage unavailable — scrolling still works, it just isn't remembered.
  }
}

export default function ScrollMemory({ targetId }: { targetId: string }) {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const url = search ? `${pathname}?${search}` : pathname

  useEffect(() => {
    noteNavigation()

    const el = document.getElementById(targetId)
    if (!el) return

    // ── Remember ──────────────────────────────────────────────────────
    // Record as they scroll rather than on the way out: by the time a route
    // change runs, shorter content has already clamped scrollTop to 0, so
    // reading it then would save the wrong number.
    let saveTimer: ReturnType<typeof setTimeout> | undefined
    const remember = () => {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        const positions = read()
        positions[url] = el.scrollTop
        write(positions)
      }, 100)
    }
    // Flush immediately on a click too, so a link followed straight after a
    // scroll doesn't beat the debounce.
    const flush = () => {
      clearTimeout(saveTimer)
      const positions = read()
      positions[url] = el.scrollTop
      write(positions)
    }

    el.addEventListener('scroll', remember, { passive: true })
    el.addEventListener('click', flush, { capture: true })

    // ── Restore ───────────────────────────────────────────────────────
    const target = read()[url]

    if (!target) {
      // Somewhere new. The container keeps its old offset otherwise, which
      // would open a profile already scrolled down.
      el.scrollTop = 0
      return () => {
        clearTimeout(saveTimer)
        el.removeEventListener('scroll', remember)
        el.removeEventListener('click', flush, { capture: true })
      }
    }

    let settled = false
    let frame = 0
    const deadline = Date.now() + RESTORE_TIMEOUT_MS

    // If they scroll while we're still trying, they've taken over — stop.
    const yieldToUser = () => { settled = true }
    el.addEventListener('wheel', yieldToUser, { passive: true, once: true })
    el.addEventListener('touchstart', yieldToUser, { passive: true, once: true })

    const attempt = () => {
      if (settled) return
      const max = el.scrollHeight - el.clientHeight
      if (max >= target) {
        el.scrollTop = target
        settled = true
        return
      }
      // Not tall enough yet — sit as close as we can and wait for the rest.
      el.scrollTop = max
      if (Date.now() < deadline) frame = requestAnimationFrame(attempt)
    }
    attempt()

    return () => {
      settled = true
      cancelAnimationFrame(frame)
      clearTimeout(saveTimer)
      el.removeEventListener('scroll', remember)
      el.removeEventListener('click', flush, { capture: true })
      el.removeEventListener('wheel', yieldToUser)
      el.removeEventListener('touchstart', yieldToUser)
    }
  }, [url, targetId])

  return null
}

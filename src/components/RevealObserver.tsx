'use client'

import { useEffect } from 'react'

// Runs the IntersectionObserver that adds the `.in` class to `.reveal` elements
// as they scroll into view. Renders nothing — purely a side-effect component so
// the main landing page can be a server component and export metadata.
export default function RevealObserver() {
  useEffect(() => {
    // Only hide things once we know we can bring them back. The CSS keys the
    // hidden state off this class, so a page whose JavaScript never ran — a
    // crawler, a failed bundle — shows its content instead of eight blank
    // blocks.
    document.documentElement.classList.add('js-reveal')

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
        })
      },
      { threshold: 0.12 }
    )
    document.querySelectorAll('.lp .reveal').forEach(el => io.observe(el))
    return () => {
      io.disconnect()
      document.documentElement.classList.remove('js-reveal')
    }
  }, [])
  return null
}

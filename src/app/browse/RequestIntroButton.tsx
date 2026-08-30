'use client'

import { useState } from 'react'

export default function RequestIntroButton({
  candidateId,
  candidateRef,
}: {
  candidateId: string
  candidateRef: string
}) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function request() {
    setState('sending'); setMessage(null)
    try {
      const res = await fetch('/api/browse/request-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId, candidate_ref: candidateRef }),
      })
      if (!res.ok) {
        setMessage(await res.text().catch(() => '') || 'Could not send that request.')
        setState('error')
        return
      }
      setState('sent')
    } catch {
      setMessage('Network error — please try again.')
      setState('error')
    }
  }

  if (state === 'sent') {
    return <span className="browse-card-sent">Requested — we&apos;ll be in touch</span>
  }

  return (
    <>
      <button type="button" onClick={request} disabled={state === 'sending'} className="browse-card-cta">
        {state === 'sending' ? 'Sending…' : 'Request introduction'}
      </button>
      {message && <span className="browse-card-error">{message}</span>}
    </>
  )
}

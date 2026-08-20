'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { resumeHref } from '@/lib/resumeUrl'

export default function ResumeSection({
  candidateId,
  candidateName,
  resumeUrl,
}: {
  candidateId: string
  candidateName: string | null
  resumeUrl: string | null
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  async function handleUpload(file: File) {
    setBusy('upload'); setError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch(`/api/admin/candidates/${candidateId}/resume`, { method: 'POST', body })
      if (!res.ok) {
        setError(await res.text().catch(() => '') || `Upload failed (${res.status})`)
        return
      }
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleRemove() {
    setBusy('remove'); setError(null)
    try {
      const res = await fetch(`/api/admin/candidates/${candidateId}/resume`, { method: 'DELETE' })
      if (!res.ok) {
        setError(await res.text().catch(() => '') || `Remove failed (${res.status})`)
        return
      }
      setConfirmRemove(false)
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Resume</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} disabled={busy !== null}>
            {busy === 'upload' ? 'Uploading…' : resumeUrl ? 'Replace' : 'Upload resume'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
        />

        {resumeUrl ? (
          <div className="flex items-center gap-4">
            <a href={resumeHref(candidateId, candidateName)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-4 font-medium">
              View resume →
            </a>
            {confirmRemove ? (
              <span className="flex items-center gap-2">
                <Button variant="destructive" size="sm" onClick={handleRemove} disabled={busy !== null}>
                  {busy === 'remove' ? 'Removing…' : 'Confirm remove'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)} disabled={busy !== null}>
                  Cancel
                </Button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmRemove(true)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                Remove
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No resume on file. Upload a PDF, Word document, or photo — contact details are redacted automatically
            before employers see it.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

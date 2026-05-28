'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'

const FIELDS = ['Accounting', 'Admin', 'Customer Support', 'Design', 'Education', 'Healthcare', 'Marketing', 'Sales', 'Tech/Software', 'Other']
const EMP_TYPES = ['Full Time', 'Part Time']

type VideoCandidate = {
  id: string
  name: string
  location: string | null
  current_job_title: string | null
  fields_worked_in: string[]
  employment_type: string[]
  mux_playback_id: string | null
  created_at: string
}

export default function VideoUploadForm({ onAdded }: { onAdded: (c: VideoCandidate) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [fields, setFields] = useState<string[]>([])
  const [empType, setEmpType] = useState<string[]>([])
  const [transcript, setTranscript] = useState('')
  const [notes, setNotes] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function toggleArr(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  function reset() {
    setName(''); setLocation(''); setJobTitle(''); setFields([]); setEmpType([])
    setTranscript(''); setNotes(''); setVideoFile(null); setUploadProgress(null)
    setError(null); setOpen(false)
  }

  async function uploadToMux(file: File): Promise<{ assetId: string; playbackId: string }> {
    setUploadProgress('Requesting upload URL…')
    const res = await fetch('/api/mux/upload-url', { method: 'POST' })
    const { uploadId, url } = await res.json()

    setUploadProgress('Uploading video…')
    await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })

    setUploadProgress('Processing video…')
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000))
      const poll = await fetch(`/api/mux/asset/${uploadId}`)
      const data = await poll.json()
      if (data.status === 'ready') return { assetId: data.assetId, playbackId: data.playbackId }
      if (data.status === 'errored') throw new Error('Mux processing failed')
    }
    throw new Error('Timed out waiting for video')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    setSaving(true); setError(null)

    let muxAssetId: string | null = null
    let muxPlaybackId: string | null = null

    try {
      if (videoFile) {
        const mux = await uploadToMux(videoFile)
        muxAssetId = mux.assetId
        muxPlaybackId = mux.playbackId
      }

      setUploadProgress('Saving…')
      const supabase = createClient()
      const { data, error: dbErr } = await supabase
        .from('video_candidates')
        .insert({
          name: name.trim(),
          location: location.trim() || null,
          current_job_title: jobTitle.trim() || null,
          fields_worked_in: fields,
          employment_type: empType,
          mux_asset_id: muxAssetId,
          mux_playback_id: muxPlaybackId,
          transcript: transcript.trim() || null,
          notes: notes.trim() || null,
        })
        .select()
        .single()

      if (dbErr) throw new Error(dbErr.message)
      onAdded(data as VideoCandidate)
      reset()
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setSaving(false)
      setUploadProgress(null)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>+ Add video candidate</Button>
    )
  }

  return (
    <Card className="border-indigo-100">
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">New video candidate</h3>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Current job title</Label>
              <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Staff Accountant" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Fields worked in</Label>
            <div className="grid grid-cols-3 gap-2">
              {FIELDS.map(f => (
                <div key={f} className="flex items-center gap-2">
                  <Checkbox id={`f-${f}`} checked={fields.includes(f)} onCheckedChange={() => toggleArr(fields, setFields, f)} />
                  <Label htmlFor={`f-${f}`} className="font-normal cursor-pointer text-xs">{f}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Employment type</Label>
            <div className="flex gap-6">
              {EMP_TYPES.map(t => (
                <div key={t} className="flex items-center gap-2">
                  <Checkbox id={`e-${t}`} checked={empType.includes(t)} onCheckedChange={() => toggleArr(empType, setEmpType, t)} />
                  <Label htmlFor={`e-${t}`} className="font-normal cursor-pointer text-sm">{t}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Video interview</Label>
            {videoFile ? (
              <p className="text-sm text-muted-foreground">
                {videoFile.name}{' '}
                <button type="button" onClick={() => setVideoFile(null)} className="text-destructive underline underline-offset-4 text-xs">Remove</button>
              </p>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg px-6 py-6 text-center cursor-pointer hover:border-ring transition-colors"
              >
                <p className="text-sm font-medium">Click to select video file</p>
                <p className="text-xs text-muted-foreground mt-1">MP4, MOV, or WebM</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
          </div>

          <div className="space-y-1.5">
            <Label>Transcript</Label>
            <Textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Paste interview transcript here…" rows={6} />
          </div>

          <div className="space-y-1.5">
            <Label>Admin notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes about this candidate…" rows={2} />
          </div>

          {uploadProgress && (
            <p className="text-xs text-indigo-600 animate-pulse">{uploadProgress}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save candidate'}</Button>
            <Button type="button" variant="outline" onClick={reset} disabled={saving}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

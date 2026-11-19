import { randomUUID } from 'node:crypto'
import { refuseUnlessAdmin } from '@/lib/requireAdmin'
import { serviceClient, STAGING_PREFIX } from '@/lib/assistant/storage'

export const maxDuration = 60

// A file attached in the assistant chat — usually a résumé to make a new
// candidate from. It is kept in the résumés bucket under a holding folder
// until an action moves it onto a candidate. Admin only.

const MAX_BYTES = 10 * 1024 * 1024

export async function POST(req: Request) {
  const refused = await refuseUnlessAdmin()
  if (refused) return refused

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return new Response('No file was attached.', { status: 400 })
  if (file.size === 0) return new Response('That file is empty.', { status: 400 })
  if (file.size > MAX_BYTES) return new Response('Attach a file under 10 MB.', { status: 400 })

  const safeName = (file.name || 'file').replace(/[^\w.\-]+/g, '_').slice(-100)
  const path = `${STAGING_PREFIX}${randomUUID()}/${safeName}`
  const { error } = await serviceClient().storage.from('resumes').upload(path, await file.arrayBuffer(), {
    contentType: file.type || 'application/octet-stream',
  })
  if (error) {
    console.error('assistant upload failed:', error.message)
    return new Response('Couldn’t store that file. Try again.', { status: 500 })
  }
  return Response.json({ file_id: path, name: file.name || safeName })
}

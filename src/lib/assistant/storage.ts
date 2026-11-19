import { createClient } from '@supabase/supabase-js'

// SERVER ONLY.
//
// Files attached in the assistant chat wait in the résumés bucket under this
// folder until an action moves one onto a candidate.

export const STAGING_PREFIX = 'assistant-uploads/'

/** A database client with the service role: for creating accounts and moving files. */
export function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/** A file id the chat was given, checked: only files in the holding folder, no path tricks. */
export function stagedPath(fileId: unknown): string | null {
  if (typeof fileId !== 'string') return null
  // Exactly the shape the upload route makes: holding folder, a random id,
  // a cleaned file name.
  return /^assistant-uploads\/[0-9a-f-]{36}\/[\w.\-]{1,100}$/.test(fileId) ? fileId : null
}

/** The public address of a file in the résumés bucket, the form resume_url stores. */
export function resumesUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/${path}`
}

/** Whether an attached file is still waiting in the holding folder. */
export async function stagedExists(path: string): Promise<boolean> {
  const { data, error } = await serviceClient().storage.from('resumes').download(path)
  return !error && !!data && data.size > 0
}

import type { SupabaseClient } from '@supabase/supabase-js'

// SERVER ONLY — call with a service-role client.
//
// Every notification insert in the app used to be a bare `await ... .insert()`
// with no error check. supabase-js resolves with an `error` rather than
// throwing, so a failed insert looked exactly like a delivered notification
// and the route still returned OK. That is why notifications could stop
// arriving with nothing anywhere saying so.
//
// Two things go wrong in practice and both are handled here:
//
//  1. The whole insert fails — most often because supabase/notifications.sql
//     hasn't been run, so the table isn't there. Now it's logged loudly and
//     reported back to the caller.
//
//  2. One recipient is bad. notifications.user_id is a foreign key to
//     auth.users, and a candidate row created outside the signup flow has no
//     auth user. In a single multi-row insert that one bad row aborts the
//     whole statement, so the employer and the admins silently lose their
//     notification because of somebody else's row. Falling back to per-row
//     inserts means one bad recipient costs only that recipient.

export type NotificationRow = {
  user_id: string
  type: string
  message: string
  candidate_id?: string | null
}

export type NotifyResult = {
  /** True only if every intended recipient got one. */
  ok: boolean
  delivered: number
  failed: number
  /** First failure, for surfacing to the caller. */
  error?: string
}

export async function notify(
  db: SupabaseClient,
  rows: NotificationRow[],
): Promise<NotifyResult> {
  const wanted = rows.filter(r => r.user_id)
  if (wanted.length === 0) return { ok: true, delivered: 0, failed: 0 }

  const payload = wanted.map(r => ({
    user_id: r.user_id,
    type: r.type,
    message: r.message,
    candidate_id: r.candidate_id ?? null,
    read: false,
  }))

  const { error } = await db.from('notifications').insert(payload)
  if (!error) return { ok: true, delivered: payload.length, failed: 0 }

  // Retry one at a time so a single unusable recipient doesn't cost everyone.
  let delivered = 0
  let firstError = error.message
  for (const row of payload) {
    const { error: rowError } = await db.from('notifications').insert(row)
    if (rowError) {
      console.error(`notification failed for ${row.user_id} (${row.type}):`, rowError.message)
    } else {
      delivered++
    }
  }

  const failed = payload.length - delivered
  if (failed === payload.length) {
    console.error(`ALL notifications failed (${payload.length} recipients):`, firstError)
    if (/does not exist|schema cache/i.test(firstError)) {
      firstError = 'The notifications table is missing — run supabase/notifications.sql in the Supabase SQL editor.'
      console.error(firstError)
    }
  }

  return { ok: failed === 0, delivered, failed, error: failed > 0 ? firstError : undefined }
}

/** The admins who should hear about incoming requests. */
export async function adminIds(db: SupabaseClient): Promise<string[]> {
  const { data, error } = await db.from('profiles').select('id').eq('role', 'admin')
  if (error) {
    console.error('could not look up admins to notify:', error.message)
    return []
  }
  const ids = (data ?? []).map((a: { id: string }) => a.id)
  // An empty result means nobody is flagged as an admin, so every "notify the
  // admins" call below is silently doing nothing. Worth saying out loud.
  if (ids.length === 0) console.error('no profiles with role=admin — nobody will be notified')
  return ids
}

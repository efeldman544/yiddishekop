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

  // A schema-level failure hits every row identically, so retrying per row
  // just makes the same round trip N times.
  if (isSchemaFailure(error.message)) {
    console.error(`ALL notifications failed (${payload.length} recipients):`, error.message)
    return { ok: false, delivered: 0, failed: payload.length, error: explain(error.message) }
  }

  // Otherwise it's likely one bad row — retry individually so a single
  // unusable recipient doesn't cost everyone.
  let delivered = 0
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
    console.error(`ALL notifications failed (${payload.length} recipients):`, error.message)
  }

  return { ok: failed === 0, delivered, failed, error: failed > 0 ? explain(error.message) : undefined }
}

function isSchemaFailure(message: string): boolean {
  return /schema cache|does not exist/i.test(message)
}

/**
 * Turn a database error into something that names the actual next step.
 *
 * PostgREST reports a missing table and a stale schema cache with the *same*
 * message, so "the table is missing" is a guess — and a costly one, because it
 * sends you to re-run SQL you have already run. Say which possibilities the
 * message actually allows, and always keep the original text: it is the only
 * thing that distinguishes them once you look.
 */
function explain(message: string): string {
  const column = message.match(/Could not find the '([^']+)' column/i)
  if (column) {
    return `The notifications table has no '${column[1]}' column — re-run supabase/notifications.sql, `
      + `which creates the table with the columns the app writes. (${message})`
  }
  if (isSchemaFailure(message)) {
    return 'The notifications table is either missing or not yet visible to the API. '
      + 'Run supabase/notifications.sql in the Supabase SQL editor — it creates the table '
      + 'and reloads the schema cache, which fixes both cases. '
      + `(${message})`
  }
  return message
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

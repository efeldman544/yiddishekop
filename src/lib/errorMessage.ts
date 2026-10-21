// Turning whatever the database or the auth layer threw into one short
// sentence a person can act on.
//
// Errors used to go on screen exactly as they arrived, so assigning a
// candidate twice produced
//
//   Couldn't save assignment: duplicate key value violates unique constraint
//   "candidate_job_assignments_candidate_id_job_id_key"
//
// which says, at length, something that takes four words: they are already
// assigned. The raw text still goes to the console, where it belongs — this
// is only what the screen says.

// `unknown`, because most callers pass whatever `catch` handed them.
function textOf(err: unknown): string {
  if (!err) return ''
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  if (typeof err === 'object') {
    const e = err as { message?: unknown; details?: unknown; hint?: unknown }
    return [e.message, e.details, e.hint].filter(v => typeof v === 'string').join(' ')
  }
  return ''
}

/** Rules in order; the first whose pattern matches wins. */
const RULES: { when: RegExp; say: string }[] = [
  // ── Postgres constraints ───────────────────────────────────────────
  { when: /duplicate key value|unique constraint|already exists/i,
    say: 'That’s already been added.' },
  { when: /violates foreign key constraint/i,
    say: 'Something this refers to no longer exists. Refresh and try again.' },
  { when: /violates check constraint.*full_name_not_spam/i,
    say: 'That name can’t contain a web address.' },
  { when: /violates check constraint/i,
    say: 'One of those values isn’t allowed.' },
  { when: /violates not-null constraint/i,
    say: 'Something required is missing.' },
  { when: /violates row-level security|permission denied|not authorized|forbidden/i,
    say: 'You don’t have access to do that.' },
  { when: /value too long/i,
    say: 'That’s too long to save.' },
  { when: /invalid input syntax/i,
    say: 'One of those values is in the wrong format.' },

  // ── PostgREST schema ───────────────────────────────────────────────
  // Worth naming precisely: it means SQL hasn't been run, and nothing the
  // person types will fix it.
  { when: /schema cache|could not find the .* (column|table)/i,
    say: 'The database is missing something this needs — the SQL in supabase/ hasn’t been run yet.' },

  // ── Auth ───────────────────────────────────────────────────────────
  { when: /invalid login credentials/i,
    say: 'That email and password don’t match.' },
  { when: /email not confirmed/i,
    say: 'Confirm your email first — check your inbox for the link.' },
  { when: /user already registered|already been registered/i,
    say: 'There’s already an account with that email.' },
  { when: /password should be at least/i,
    say: 'Use a longer password — at least 8 characters.' },
  { when: /rate limit|too many requests|you can only request this after|for security purposes/i,
    say: 'Too many tries. Wait a minute and try again.' },
  // Before the one below: a bare /expired/ swallowed "JWT expired" and told
  // people to ask for a new link when what they needed was to sign in again.
  { when: /jwt|refresh token|session (has )?expired/i,
    say: 'Your session has expired. Sign in again.' },
  { when: /token has expired|invalid token|otp[^.]*expired|link (has )?expired/i,
    say: 'That link has expired. Ask for a new one.' },

  // ── Network ────────────────────────────────────────────────────────
  { when: /fetch failed|network|timeout|timed out|ECONNRESET|aborted/i,
    say: 'Couldn’t reach the server. Check your connection and try again.' },
]

/**
 * One short sentence for the screen.
 *
 * `fallback` is what to say when the error isn't one we recognise — make it
 * specific to the action, e.g. "Couldn't save the profile." A recognised
 * error replaces it entirely rather than being appended, so nothing reads
 * "Couldn't save the profile: that's already been added."
 */
export function humanError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const raw = textOf(err).trim()
  if (!raw) return fallback

  for (const rule of RULES) {
    if (rule.when.test(raw)) return rule.say
  }

  // An unrecognised message with no database vocabulary in it was probably
  // written for a person — our own API routes return sentences like "This
  // resume is hosted on an external site that blocked our server. Ask the
  // candidate to re-upload it through their profile." — and saying that beats
  // any fallback. The snake_case test is what catches a raw error, since
  // Postgres names a table, a column or a constraint in almost all of them.
  //
  // The length limit is generous for the same reason: those written messages
  // run to a couple of sentences, and the point of this function is to stop
  // database noise reaching the screen, not to cut useful instructions short.
  const looksWritten = raw.length <= 300
    && !/constraint|relation |column |pgrst|postgres|syntax|null value|[a-z]+_[a-z]+/i.test(raw)
  return looksWritten ? raw : fallback
}

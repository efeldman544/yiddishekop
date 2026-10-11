// The name field on signup is free text that lands in an admin's notification
// bell, so it is where link spam arrives. One account signed up as a bit.ly
// link to a gambling site; the whole URL turned up in the bell as somebody's
// name.
//
// The same rule is a check constraint on profiles.full_name (see
// supabase/signup_and_review.sql) — that is what actually enforces it, since
// this runs in the browser where nobody has to honour it. This exists so a
// real person who trips it gets a sentence they can act on rather than a
// database error.
//
// Kept deliberately narrow. A looser rule starts rejecting real people, and
// there is no version of a human name that contains "http://".
const SPAM = /(https?:\/\/|www\.|bit\.ly|t\.me|tinyurl|<[a-z/])/i

/** What's wrong with this as somebody's name, or null if nothing is. */
export function nameProblem(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < 2) return 'Please enter your name.'
  if (trimmed.length > 100) return 'That name is too long — please use the name you go by.'
  if (SPAM.test(trimmed)) return 'Please enter your name, without a web address in it.'
  return null
}

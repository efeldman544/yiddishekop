/**
 * Whether a candidate has put enough in their profile to make a browse card
 * that says something.
 *
 * A card is built from the job title, the roles they're seeking and the
 * industries they picked — displayTitle() and cardIndustries() in browse.ts
 * read exactly these three — so any one of them is enough. Location alone is
 * not: "Lakewood, NJ" and nothing else is not a candidate anyone can act on.
 *
 * The database applies the same rule on every write (see
 * supabase/auto_approve.sql), which is what actually decides whether somebody
 * is listed. This exists so the admin list labels a row the same way the
 * database treats it, rather than the two drifting apart.
 */
export function isProfileFilledIn(p: {
  current_job_title?: string | null
  roles_seeking?: string | null
  fields_worked_in?: string[] | null
}): boolean {
  return !!(
    p.current_job_title?.trim()
    || p.roles_seeking?.trim()
    || (p.fields_worked_in?.length ?? 0) > 0
  )
}

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Whether candidates may book a screening call right now.
 *
 * Reads the one row in site_settings. Two things are deliberate:
 *
 * It defaults to true. The app deploys the moment it merges and the SQL that
 * creates the table is run by hand afterwards, so between the two this has to
 * behave exactly as the site did before there was a switch — offering the
 * booking step — rather than hiding it from every candidate until somebody
 * remembers to run a migration.
 *
 * supabase-js resolves with an `error` rather than throwing, so the error is
 * checked rather than the data being trusted. Without that a failed read
 * looks identical to "booking is off".
 */
export async function screeningBookingEnabled(db: SupabaseClient): Promise<boolean> {
  const { data, error } = await db
    .from('site_settings')
    .select('screening_booking_enabled')
    .eq('id', true)
    .maybeSingle<{ screening_booking_enabled: boolean }>()

  if (error) {
    console.error('could not read site_settings, leaving booking on:', error.message)
    return true
  }
  // No row yet means the table was created but never seeded — same reasoning.
  return data?.screening_booking_enabled ?? true
}

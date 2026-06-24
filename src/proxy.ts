import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // Exclude framework-generated metadata routes (icon, OG image, sitemap,
    // robots) so the auth proxy never redirects them to /login — otherwise a
    // logged-out browser requesting the favicon gets a login redirect instead
    // of the PNG, and crawlers hitting /sitemap.xml or /robots.txt get bounced.
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|twitter-image|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

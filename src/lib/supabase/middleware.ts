import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — always accessible, skip Supabase entirely
  const publicPaths = ['/', '/login', '/signup', '/start-hiring', '/privacy-policy', '/auth/callback', '/api/webhooks', '/api/start-hiring']
  if (publicPaths.some((p) => pathname === p || (p !== '/' && pathname.startsWith(p)))) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirects must carry over any cookies getUser() set while refreshing the
  // session — otherwise the browser keeps a stale (already-rotated) refresh
  // token and every subsequent request bounces back to /login in a loop
  function redirectWithCookies(to: string) {
    const response = NextResponse.redirect(new URL(to, request.url))
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    return response
  }

  // Not logged in → redirect to login
  if (!user) {
    return redirectWithCookies('/login')
  }

  // Role-based route guards for /dashboard/[role]
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? user.user_metadata?.role

  if (pathname.startsWith('/dashboard/candidate') && role !== 'candidate') {
    return redirectWithCookies('/dashboard')
  }

  if (pathname.startsWith('/dashboard/employer') && role !== 'employer') {
    return redirectWithCookies('/dashboard')
  }

  if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
    return redirectWithCookies('/dashboard')
  }

  return supabaseResponse
}

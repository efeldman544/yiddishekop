import Link from 'next/link'
import LpHeader from '@/components/LpHeader'

// The auth pages used to be their own world: a 320px pale side panel that
// appears nowhere else on the site, no site header, and their own font stack.
// Landing on one felt like leaving.
//
// Same header, same background, same type as every other page — the form is
// simply the content of a site page now.

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="lp auth-page">
      <LpHeader />
      <main className="auth-main">
        <div className="auth-box">
          {children}
          {/* Directly under the form. Pinned to the bottom of the viewport it
              was marooned a long way from anything it relates to. */}
          <p className="auth-foot"><Link href="/">← Back to the site</Link></p>
        </div>
      </main>
    </div>
  )
}

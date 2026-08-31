import Link from 'next/link'

// One footer for every public page — the same markup was previously copied
// into each one, so a copy change had to be made in four places.
export default function LpFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="lp-foot-grid">
          <div>
            <div className="lp-logo">Yiddishe<span>Kop</span></div>
            <p className="lp-foot-tag">
              Pre-screened remote staff for frum businesses. Vetted, interviewed,
              and worth your time.
            </p>
          </div>
          <div className="lp-foot-cols">
            <div className="lp-foot-col">
              <h4>Hire</h4>
              <Link href="/browse">Browse candidates</Link>
              <Link href="/how-it-works">How it works</Link>
              <Link href="/start-hiring">Request a role</Link>
            </div>
            <div className="lp-foot-col">
              <h4>Work with us</h4>
              <Link href="/for-candidates">For candidates</Link>
              <Link href="/signup?role=candidate">Create a profile</Link>
              <Link href="/login">Log in</Link>
            </div>
            <div className="lp-foot-col">
              <h4>Contact</h4>
              <a href="tel:6314943567">631 494 3567</a>
              <a href="mailto:info@yiddishekop.app">info@yiddishekop.app</a>
              <Link href="/why-us">Why us</Link>
            </div>
          </div>
        </div>
        <div className="lp-foot-bottom">
          <span>© 2026 YiddisheKop. All rights reserved.</span>
          <Link href="/privacy-policy" style={{ color: 'inherit' }}>Privacy Policy</Link>
        </div>
      </div>
    </footer>
  )
}

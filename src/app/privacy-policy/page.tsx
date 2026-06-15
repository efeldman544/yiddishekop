import Link from 'next/link'
import LpAuthButton from '@/components/LpAuthButton'

export const metadata = {
  title: 'Privacy Policy — YiddisheKop',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="lp">
      <header>
        <div className="wrap lp-nav">
          <Link href="/" className="lp-logo">Yiddishe<span>Kop</span></Link>
          <div className="lp-nav-right">
            <LpAuthButton style={{ fontSize: 14 }} />
          </div>
        </div>
      </header>

      <section style={{ padding: '72px 0 100px' }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <div className="lp-sec-eyebrow" style={{ marginBottom: 16 }}>Legal</div>
          <h1 style={{ fontFamily: 'var(--font-fraunces), Fraunces, serif', fontWeight: 600, fontSize: 'clamp(30px,4vw,46px)', letterSpacing: '-0.02em', lineHeight: 1.05, color: 'var(--lp-cream)', marginBottom: 12 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: 'var(--lp-cream-dim)', marginBottom: 48 }}>Last updated: June 2026</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 36, fontSize: 16, lineHeight: 1.75, color: 'var(--lp-cream-dim)' }}>
            {[
              {
                title: '1. Information we collect',
                body: 'We collect information you provide directly — including your name, email address, phone number, resume, and any other information you submit through our platform or contact forms. We also collect information about how you use the site (pages visited, browser type, IP address) through standard server logs and analytics tools.',
              },
              {
                title: '2. How we use your information',
                body: 'We use the information we collect to operate and improve the platform, match candidates with employers, communicate with you about your account or application, and contact employers who submit a hiring inquiry. We do not sell your personal information to third parties.',
              },
              {
                title: '3. Sharing of information',
                body: 'Candidate information is shared with employers only as part of the placement process, and only to the extent necessary to evaluate a potential match. Employer inquiries are handled by our internal team. We may share information with service providers who assist in operating the platform (e.g., cloud hosting, video infrastructure) under appropriate data processing agreements.',
              },
              {
                title: '4. Data retention',
                body: 'We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us.',
              },
              {
                title: '5. Security',
                body: 'We implement reasonable technical and organizational measures to protect your personal information. No method of transmission or storage is completely secure, but we take the protection of your data seriously.',
              },
              {
                title: '6. Your rights',
                body: 'You have the right to access, correct, or delete the personal information we hold about you. To exercise these rights, contact us at the information below.',
              },
              {
                title: '7. Cookies',
                body: 'We use cookies and similar technologies to keep you logged in and to understand how the site is used. You can control cookies through your browser settings, though disabling them may affect functionality.',
              },
              {
                title: '8. Changes to this policy',
                body: 'We may update this policy from time to time. We will notify registered users of material changes. Continued use of the platform after changes take effect constitutes acceptance of the updated policy.',
              },
              {
                title: '9. Contact',
                body: 'For questions about this policy or your data, contact us at: YiddisheKop · 631 494 3567 · yiddishekop.net',
              },
            ].map(({ title, body }) => (
              <div key={title}>
                <h2 style={{ fontFamily: 'var(--font-fraunces), Fraunces, serif', fontSize: 21, fontWeight: 600, color: 'var(--lp-cream)', marginBottom: 10, lineHeight: 1.2 }}>{title}</h2>
                <p>{body}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid var(--lp-line)' }}>
            <Link href="/" style={{ fontSize: 14, color: 'var(--lp-cream-dim)' }}>← Back to home</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

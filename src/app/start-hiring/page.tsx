import type { Metadata } from 'next'
import StartHiringForm from './StartHiringForm'

export const metadata: Metadata = {
  title: 'Request a Role | YiddisheKop',
  description: 'Can\'t find the right person in the pool? Tell us the role and we\'ll source, screen and video-interview candidates specifically for your opening.',
  openGraph: {
    title: 'Request a Role | YiddisheKop',
    description: 'Tell us the role and we\'ll source, screen and video-interview candidates specifically for your opening.',
    url: 'https://yiddishekop.app/start-hiring',
    siteName: 'YiddisheKop',
    type: 'website',
  },
}

export default function StartHiringPage() {
  return <StartHiringForm />
}

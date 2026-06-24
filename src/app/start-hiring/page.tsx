import type { Metadata } from 'next'
import StartHiringForm from './StartHiringForm'

export const metadata: Metadata = {
  title: 'Start Hiring | YiddisheKop',
  description: 'Tell us your open role. We\'ll screen, vet, and video-interview candidates from the frum community and send you a shortlist of the strongest people — ready to hire.',
  openGraph: {
    title: 'Start Hiring | YiddisheKop',
    description: 'Tell us your open role and we\'ll send you a shortlist of pre-screened, video-interviewed candidates worth your time.',
    url: 'https://yiddishekop.app/start-hiring',
    siteName: 'YiddisheKop',
    type: 'website',
  },
}

export default function StartHiringPage() {
  return <StartHiringForm />
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up | YiddisheKop',
  description: 'Create your YiddisheKop account to find pre-screened remote staff or search for remote opportunities.',
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

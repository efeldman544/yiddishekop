import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log In | YiddisheKop',
  description: 'Log in to your YiddisheKop account.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

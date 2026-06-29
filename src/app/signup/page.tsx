import type { Role } from '@/types'
import SignupForm from './SignupForm'

type Props = {
  searchParams: Promise<{ email?: string; name?: string; role?: string }>
}

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams
  const defaultRole = (params.role === 'employer' || params.role === 'candidate') ? params.role as Role : ''

  return (
    <SignupForm
      defaultEmail={params.email ?? ''}
      defaultName={params.name ?? ''}
      defaultRole={defaultRole}
    />
  )
}

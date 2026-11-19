import { redirect } from 'next/navigation'

// Employers live on the Jobs page, under their own tab. Old notifications link
// here; land them on that tab rather than on Jobs.
export default function AdminEmployersPage() {
  redirect('/dashboard/admin/jobs?tab=employers')
}

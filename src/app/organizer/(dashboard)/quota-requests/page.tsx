import { redirect } from 'next/navigation'
import { getUserRole } from '@/app/actions/auth'
import QuotaRequestsPage from '@/app/admin/(dashboard)/quota-requests/page'

export default async function OrganizerQuotaRequestsPage() {
  const role = await getUserRole()
  if (role !== 'ORGANIZER') {
    redirect(role === 'ADMIN' ? '/admin' : '/login')
  }

  return <QuotaRequestsPage isOrganizer />
}

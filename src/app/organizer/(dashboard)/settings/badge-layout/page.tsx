import { BadgeLayoutEditor } from '@/components/settings/badge-layout-editor'
import { requireServerAuthContext } from '@/lib/server-auth'
import { redirect } from 'next/navigation'

export default async function BadgeLayoutPage() {
  const auth = await requireServerAuthContext()
  if (auth.userRole !== 'ADMIN') redirect('/organizer')
  if (!auth.projectUuid)
    return (
      <p className="p-8">Sign in to your project to edit its badge layout.</p>
    )
  return (
    <BadgeLayoutEditor key={auth.projectUuid} projectUuid={auth.projectUuid} />
  )
}

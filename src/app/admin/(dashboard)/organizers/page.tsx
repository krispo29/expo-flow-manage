import { getOrganizers } from '@/app/actions/organizer'
import { OrganizerList } from '@/components/organizer-list'

export default async function OrganizersPage() {
  const { data: organizers } = await getOrganizers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizer Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts for event organizers.
        </p>
      </div>
      
      <OrganizerList organizers={organizers || []} />
    </div>
  )
}

import { getParticipants } from '@/app/actions/participant'
import { ParticipantList } from '@/components/participant-list'
import { cookies } from 'next/headers'

export default async function OrganizerParticipantsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ projectId?: string }>;
}>) {
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const projectId = resolvedSearchParams.projectId || cookieStore.get('project_uuid')?.value || '';

  // Fetch all participants (filtering handled client-side)
  const result = await getParticipants(projectId);
  const participants = result.data || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Participant Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your attendees and conference reservations.
          </p>
        </div>
      </div>

      <div className="w-full">
        <ParticipantList 
          participants={participants} 
          projectId={projectId}
        />
      </div>
    </div>
  )
}

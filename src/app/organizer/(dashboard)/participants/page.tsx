import { getAllAttendeeTypes, getParticipants } from '@/app/actions/participant'
import { getEvents } from '@/app/actions/settings'
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

  // Fetch all participants and attendee type metadata for client-side filtering/printing.
  const [participantsResult, attendeeTypesResult, eventsResult] = await Promise.all([
    getParticipants(projectId),
    getAllAttendeeTypes(projectId),
    getEvents(projectId),
  ]);
  const participants = participantsResult.data || [];
  const attendeeTypes = attendeeTypesResult.data || [];
  const events = eventsResult.events || [];

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
          attendeeTypes={attendeeTypes}
          events={events}
        />
      </div>
    </div>
  )
}

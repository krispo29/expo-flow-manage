import { getParticipants } from '@/app/actions/participant'
import { ParticipantList } from '@/components/participant-list'
import { AttendanceLogs } from '@/components/attendance-logs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { cookies } from 'next/headers'
 
export default async function ParticipantsPage() {
  const cookieStore = await cookies()
  const projectId = cookieStore.get('project_uuid')?.value || 'horti-agri'

  // Fetch all participants (filtering handled client-side)
  const result = await getParticipants(projectId)
  const participants = result.data || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Participant Management</h1>
          <p className="text-muted-foreground">
            Manage all attendees, VIPs, and groups.
          </p>
        </div>
      </div>

      {/* Scanner Import Section */}
      {/* <ScannerImport projectId={projectId} /> */}

      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="participants">Participant List</TabsTrigger>
          <TabsTrigger value="attendance-logs">Attendance Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="participants">
          <ParticipantList 
            participants={participants} 
            projectId={projectId}
          />
        </TabsContent>
        <TabsContent value="attendance-logs">
          <AttendanceLogs projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { getParticipants } from '@/app/actions/participant'
import { ParticipantList } from '@/components/participant-list'
import { RemindEmail } from '@/components/remind-email'
import { AttendanceLogs } from '@/components/attendance-logs'
import { PrintLogs } from '@/components/print-logs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cookies } from 'next/headers'

export default async function ParticipantsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ projectId?: string }>;
}>) {
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const projectId = resolvedSearchParams.projectId || cookieStore.get('project_uuid')?.value || '67597e81-db17-4ff0-8479-56f737d9482a';

  // Fetch all participants (filtering handled client-side)
  const result = await getParticipants(projectId);
  const participants = result.data || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Participant Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all attendees, VIPs, and groups with live intelligence.
          </p>
        </div>
      </div>

      <Tabs defaultValue="participants" className="w-full space-y-6">
        <div className="w-full overflow-x-auto scrollbar-hide">
          <TabsList className="glass p-1 h-auto inline-flex flex-nowrap rounded-2xl border-white/10 min-w-full sm:min-w-0 justify-between sm:justify-start">
            <TabsTrigger 
              value="participants" 
              className="rounded-xl px-3 py-2 text-xs sm:px-6 sm:py-2.5 sm:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 text-foreground/70 hover:text-foreground whitespace-nowrap"
            >
              <span className="hidden sm:inline">Participant List</span>
              <span className="sm:hidden">List</span>
            </TabsTrigger>
            <TabsTrigger 
              value="attendance-logs" 
              className="rounded-xl px-3 py-2 text-xs sm:px-6 sm:py-2.5 sm:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 text-foreground/70 hover:text-foreground whitespace-nowrap"
            >
              <span className="hidden sm:inline">Import Scanner</span>
              <span className="sm:hidden">Import</span>
            </TabsTrigger>
            <TabsTrigger 
              value="print-logs" 
              className="rounded-xl px-3 py-2 text-xs sm:px-6 sm:py-2.5 sm:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 text-foreground/70 hover:text-foreground whitespace-nowrap"
            >
              <span className="hidden sm:inline">Print Logs</span>
              <span className="sm:hidden">Print</span>
            </TabsTrigger>
            <TabsTrigger
              value="missing-activity"
              className="rounded-xl px-3 py-2 text-xs sm:px-6 sm:py-2.5 sm:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 text-foreground/70 hover:text-foreground whitespace-nowrap"
            >
              <span className="hidden sm:inline">Missing Activity</span>
              <span className="sm:hidden">Missing</span>
            </TabsTrigger>
            <TabsTrigger
              value="remind-email" 
              className="rounded-xl px-3 py-2 text-xs sm:px-6 sm:py-2.5 sm:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 text-foreground/70 hover:text-foreground whitespace-nowrap"
            >
              <span className="hidden sm:inline">Remind email</span>
              <span className="sm:hidden">Email</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="participants" className="outline-none">
          <ParticipantList 
            participants={participants} 
            projectId={projectId}
          />
        </TabsContent>
        <TabsContent value="attendance-logs" className="outline-none">
          <AttendanceLogs projectId={projectId} />
        </TabsContent>
        <TabsContent value="print-logs" className="outline-none">
          <PrintLogs projectId={projectId} mode="print-logs" />
        </TabsContent>
        <TabsContent value="missing-activity" className="outline-none">
          <PrintLogs projectId={projectId} mode="missing-activity" />
        </TabsContent>
        <TabsContent value="remind-email" className="outline-none">
          <RemindEmail projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

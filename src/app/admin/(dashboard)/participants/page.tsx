import { getParticipants } from '@/app/actions/participant'
import { ParticipantList } from '@/components/participant-list'
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
        <TabsList className="glass p-1 h-auto inline-flex rounded-2xl border-white/10">
          <TabsTrigger 
            value="participants" 
            className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 text-foreground/70 hover:text-foreground"
          >
            Participant List
          </TabsTrigger>
          <TabsTrigger 
            value="attendance-logs" 
            className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 text-foreground/70 hover:text-foreground"
          >
            Import Scanner
          </TabsTrigger>
          <TabsTrigger 
            value="print-logs" 
            className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 text-foreground/70 hover:text-foreground"
          >
            Print Logs
          </TabsTrigger>
        </TabsList>
        
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
          <PrintLogs projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

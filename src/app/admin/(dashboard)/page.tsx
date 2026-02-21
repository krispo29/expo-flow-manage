import { 
  Users, 
  Contact, 
  Calendar, 
  LayoutDashboard, 
  ArrowUpRight,
  Activity,
  AlertCircle
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getExhibitors } from "@/app/actions/exhibitor"
import { getParticipants } from "@/app/actions/participant"
import { getConferences } from "@/app/actions/conference"
import { getRooms } from "@/app/actions/settings"
import { formatDistanceToNow } from "date-fns"

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page(props: Props) {
  const searchParams = await props.searchParams
  const projectId = searchParams?.projectId as string | undefined
  
  if (!projectId) {
    return null
  }

  // Fetch all data in parallel
  const [
    exhibitorsResult,
    participantsResult,
    conferencesResult,
    roomsResult
  ] = await Promise.allSettled([
    getExhibitors(projectId),
    getParticipants(projectId),
    getConferences(projectId),
    getRooms(projectId)
  ])

  // Process Exhibitors
  let totalExhibitors = '-'
  if (exhibitorsResult.status === 'fulfilled' && exhibitorsResult.value.success) {
    totalExhibitors = (exhibitorsResult.value.exhibitors?.length || 0).toString()
  }

  // Process Participants
  let totalParticipants = '-'
  let recentParticipants: any[] = []
  if (participantsResult.status === 'fulfilled' && participantsResult.value.success) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const participants: any[] = participantsResult.value.data || []
    totalParticipants = participants.length.toString()
    // Simulated sorting for recent
    recentParticipants = [...participants].reverse().slice(0, 5)
  }

  // Process Conferences
  let totalConferences = '-'
  let upcomingConferences: any[] = []
  if (conferencesResult.status === 'fulfilled' && conferencesResult.value.success) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conferences: any[] = conferencesResult.value.data || []
    totalConferences = conferences.length.toString()
    upcomingConferences = conferences.slice(0, 3)
  }

  // Process Rooms (Fallback for Active Scanners)
  let totalRooms = '-'
  if (roomsResult.status === 'fulfilled' && roomsResult.value.success) {
    totalRooms = (roomsResult.value.rooms?.length || 0).toString()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome back. Here is what is happening with your project.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Exhibitors */}
        <Card className="relative overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exhibitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {totalExhibitors === '-' ? (
              <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4" /> <span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <div className="text-2xl font-bold">{totalExhibitors}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Active exhibitors
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Users className="h-12 w-12" />
          </div>
        </Card>

        {/* Total Participants */}
        <Card className="relative overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Contact className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {totalParticipants === '-' ? (
              <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4" /> <span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <div className="text-2xl font-bold">{totalParticipants}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Registered users
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Contact className="h-12 w-12" />
          </div>
        </Card>

        {/* Conferences */}
        <Card className="relative overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conferences</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {totalConferences === '-' ? (
               <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4" /> <span className="text-sm font-medium">Unavailable</span></div>
            ) : (
               <div className="text-2xl font-bold">{totalConferences}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Scheduled sessions
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Calendar className="h-12 w-12" />
          </div>
        </Card>

        {/* Event Rooms */}
        <Card className="relative overflow-hidden bg-primary/5 border-primary/20 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Rooms</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {totalRooms === '-' ? (
               <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4 text-primary" /> <span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <div className="text-2xl font-bold text-primary">{totalRooms}</div>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Available spaces</span>
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-10 text-primary pointer-events-none">
            <Activity className="h-12 w-12" />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
            <CardDescription>Latest participants joining the event.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {participantsResult.status === 'rejected' || totalParticipants === '-' ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">Connection Unavailable</h3>
                  <p className="text-sm text-muted-foreground">Failed to load recent registrations.</p>
                </div>
              ) : recentParticipants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Contact className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">No registrations yet</h3>
                  <p className="text-sm text-muted-foreground">Participants who register for your event will appear here.</p>
                </div>
              ) : (
                recentParticipants.map((p, i) => (
                  <div key={p.id || i} className="flex items-center">
                    <div className="flex flex-col items-center mr-4">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {i < recentParticipants.length - 1 && <div className="h-full w-px bg-muted mt-2" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{p.firstName} {p.lastName}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[250px]">{p.company || 'Independent'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded-full whitespace-nowrap">
                        {p.type || 'Participant'}
                      </div>
                      <div className="text-xs text-muted-foreground w-20 text-right">
                        {p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }) : 'Recently'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Conferences Overview</CardTitle>
            <CardDescription>A glimpse of the upcoming schedule.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conferencesResult.status === 'rejected' || totalConferences === '-' ? (
                 <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                    <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">Connection Unavailable</h3>
                    <p className="text-sm text-muted-foreground">Failed to load conference schedule.</p>
                 </div>
              ) : upcomingConferences.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">No upcoming sessions</h3>
                    <p className="text-sm text-muted-foreground">Schedule your first conference to see it here.</p>
                 </div>
              ) : (
                upcomingConferences.map((session, i) => (
                  <div key={session.id || i} className="flex flex-col p-3 rounded-lg border bg-muted/30">
                    <div className="font-semibold text-sm line-clamp-1">{session.topic}</div>
                    <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 line-clamp-1"><LayoutDashboard className="h-3 w-3" /> {session.room || 'General Room'}</div>
                      <div className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"><Calendar className="h-3 w-3" /> {session.startTime} - {session.endTime}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {totalConferences !== '-' && totalConferences !== '0' && (
              <div className="mt-6">
                <a href="/admin/events" className="w-full text-xs text-primary font-medium flex items-center justify-center gap-1 hover:underline">
                  View All Conferences <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import {
  Users,
  Contact,
  Calendar,
  ArrowUpRight,
  AlertCircle,
  Mail,
  Building2,
  Activity,
  MapPin,
  Clock,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getDashboard } from "@/app/actions/dashboard"
import type { DashboardConference } from "@/app/actions/dashboard"
import { formatDistanceToNow } from "date-fns"
import { AttendeeTypeChart } from "@/components/dashboard/attendee-type-chart"

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page(props: Props) {
  const searchParams = await props.searchParams
  const projectId = searchParams?.projectId as string | undefined

  if (!projectId) {
    return null
  }

  // Single API call for all dashboard data
  const result = await getDashboard(projectId)
  const failed = !result.success || !result.data

  const summary = result.data?.summary
  const recentParticipants = result.data?.recent_participants || []
  const conferences = result.data?.conferences || []

  // Deduplicate conferences by conference_uuid (API may return duplicates per show_date)
  const uniqueConferences: DashboardConference[] = []
  const seenUuids = new Set<string>()
  for (const c of conferences) {
    if (!seenUuids.has(c.conference_uuid)) {
      seenUuids.add(c.conference_uuid)
      uniqueConferences.push(c)
    }
  }

  // Map attendee_types for chart
  const attendeeTypeData = (summary?.attendee_types || []).map(t => ({
    name: t.type_name,
    count: t.count,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome back. Here is what is happening with your project.</p>
      </div>

      {/* ======================================================= */}
      {/* ROW 1 – Key Metric Cards                               */}
      {/* ======================================================= */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Exhibitors */}
        <Card className="relative overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exhibitors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {failed ? (
              <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <div className="text-2xl font-bold">{summary?.total_exhibitors ?? 0}</div>
            )}
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Building2 className="h-12 w-12" /></div>
        </Card>

        {/* Total Participants */}
        <Card className="relative overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Contact className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {failed ? (
              <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <div className="text-2xl font-bold">{(summary?.total_participants ?? 0).toLocaleString()}</div>
            )}
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Contact className="h-12 w-12" /></div>
        </Card>

        {/* Conferences */}
        <Card className="relative overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conferences</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {failed ? (
              <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <div className="text-2xl font-bold">{summary?.total_conferences ?? 0}</div>
            )}
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Calendar className="h-12 w-12" /></div>
        </Card>

        {/* Event Rooms */}
        <Card className="relative overflow-hidden bg-primary/5 border-primary/20 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Rooms</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {failed ? (
              <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <>
                <div className="text-2xl font-bold text-primary">{summary?.total_rooms ?? 0}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Available spaces
                </p>
              </>
            )}
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-10 text-primary pointer-events-none"><Activity className="h-12 w-12" /></div>
        </Card>
      </div>

      {/* ======================================================= */}
      {/* ROW 2 – Attendee Type Chart + Upcoming Conferences      */}
      {/* ======================================================= */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Attendee Type Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" /> Attendee Types</CardTitle>
            <CardDescription>Breakdown of all participant categories</CardDescription>
          </CardHeader>
          <CardContent>
            {attendeeTypeData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No attendee data</p>
              </div>
            ) : (
              <AttendeeTypeChart data={attendeeTypeData} />
            )}
          </CardContent>
        </Card>

        {/* Upcoming Conferences */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-primary" /> Conferences</CardTitle>
                <CardDescription>Conference schedule overview</CardDescription>
              </div>
              {uniqueConferences.length > 3 && (
                <a href={`/admin/conferences?projectId=${projectId}`} className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline flex-shrink-0">
                  View All <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {uniqueConferences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                <Calendar className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No conferences yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {uniqueConferences.slice(0, 5).map((conf, i) => (
                  <div key={conf.conference_uuid || i} className="rounded-lg border bg-muted/30 p-3">
                    <p className="font-semibold text-sm line-clamp-1">{conf.title || 'Untitled Session'}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{conf.location || 'TBD'}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{conf.start_time?.slice(0, 5)} – {conf.end_time?.slice(0, 5)}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{conf.show_date}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">{conf.reserved_count} reserved</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ======================================================= */}
      {/* ROW 3 – Recent Registrations                            */}
      {/* ======================================================= */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Contact className="h-4 w-4 text-primary" /> Recent Registrations</CardTitle>
              <CardDescription>Latest participants joining the event</CardDescription>
            </div>
            {(summary?.total_participants ?? 0) > 5 && (
              <a href={`/admin/participants?projectId=${projectId}`} className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline flex-shrink-0">
                View All <ArrowUpRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {failed ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                <AlertCircle className="h-6 w-6 text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">Failed to load registrations</p>
              </div>
            ) : recentParticipants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                <Contact className="h-6 w-6 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No registrations yet</p>
              </div>
            ) : (
              recentParticipants.map((p, i) => (
                <div key={p.registration_uuid || i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {(p.first_name?.[0] || '?').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{p.company_name || 'Independent'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-xs capitalize">{p.attendee_type_code || 'General'}</Badge>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {p.registered_at ? formatDistanceToNow(new Date(p.registered_at), { addSuffix: true }) : 'Recently'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

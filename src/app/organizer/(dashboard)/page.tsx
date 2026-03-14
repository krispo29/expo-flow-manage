import {
  Users,
  Contact,
  Calendar,
  ArrowUpRight,
  AlertCircle,
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
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground font-medium">Welcome back. Here is what is happening with your project.</p>
      </div>

      {/* ======================================================= */}
      {/* ROW 1 – Key Metric Cards                               */}
      {/* ======================================================= */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Exhibitors */}
        <Card className="relative overflow-hidden border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent border-none px-6 pt-6">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Exhibitors</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {failed ? (
              <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <div className="text-3xl font-bold tracking-tight">{summary?.total_exhibitors ?? 0}</div>
            )}
          </CardContent>
          <div className="absolute -bottom-2 -right-2 p-4 opacity-[0.03] text-blue-900 dark:text-blue-100 pointer-events-none transform rotate-12"><Building2 className="h-24 w-24" /></div>
        </Card>

        {/* Total Participants */}
        <Card className="relative overflow-hidden border-t-4 border-t-indigo-500 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent border-none px-6 pt-6">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Participants</CardTitle>
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Contact className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {failed ? (
              <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <div className="text-3xl font-bold tracking-tight">{(summary?.total_participants ?? 0).toLocaleString()}</div>
            )}
          </CardContent>
          <div className="absolute -bottom-2 -right-2 p-4 opacity-[0.03] text-indigo-900 dark:text-indigo-100 pointer-events-none transform rotate-12"><Contact className="h-24 w-24" /></div>
        </Card>

        {/* Conferences */}
        <Card className="relative overflow-hidden border-t-4 border-t-amber-500 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent border-none px-6 pt-6">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conferences</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {failed ? (
              <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <div className="text-3xl font-bold tracking-tight">{summary?.total_conferences ?? 0}</div>
            )}
          </CardContent>
          <div className="absolute -bottom-2 -right-2 p-4 opacity-[0.03] text-amber-900 dark:text-amber-100 pointer-events-none transform rotate-12"><Calendar className="h-24 w-24" /></div>
        </Card>

        {/* Event Rooms */}
        <Card className="relative overflow-hidden border-t-4 border-t-emerald-500 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent border-none px-6 pt-6">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Event Rooms</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {failed ? (
              <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4 text-emerald-500" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <>
                <div className="text-3xl font-bold tracking-tight text-foreground">{summary?.total_rooms ?? 0}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" /> Available spaces
                </p>
              </>
            )}
          </CardContent>
          <div className="absolute -bottom-2 -right-2 p-4 opacity-[0.03] text-emerald-900 dark:text-emerald-100 pointer-events-none transform rotate-12"><Activity className="h-24 w-24" /></div>
        </Card>
      </div>

      {/* ======================================================= */}
      {/* ROW 2 – Attendee Type Chart + Upcoming Conferences      */}
      {/* ======================================================= */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Attendee Type Chart */}
        <Card className="lg:col-span-3 shadow-sm border-none ring-1 ring-border/50 overflow-hidden">
          <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Attendee Types</CardTitle>
                <CardDescription className="text-xs">Breakdown of all participant categories</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
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
        <Card className="lg:col-span-4 shadow-sm border-none ring-1 ring-border/50 overflow-hidden">
          <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Conferences</CardTitle>
                  <CardDescription className="text-xs">Upcoming schedule overview</CardDescription>
                </div>
              </div>
              {uniqueConferences.length > 3 && (
                <a href={projectId ? `/organizer/conferences?projectId=${projectId}` : `/organizer/conferences`} className="text-xs font-bold text-primary px-3 py-1.5 bg-primary/5 hover:bg-primary/10 rounded-full transition-colors flex items-center gap-1">
                  View All <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {uniqueConferences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                <Calendar className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No conferences yet</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {uniqueConferences.slice(0, 4).map((conf, i) => (
                  <div key={conf.conference_uuid || i} className="group relative rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-300">
                    <p className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{conf.title || 'Untitled Session'}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-2 font-medium">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary/60" />{conf.location || 'TBD'}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-primary/60" />{conf.start_time?.slice(0, 5)} – {conf.end_time?.slice(0, 5)}</span>
                      <span className="flex items-center gap-1 text-[10px] bg-muted px-1.5 py-0.5 rounded leading-none">{conf.show_date}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-foreground">{conf.reserved_count}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">reserved</span>
                      </div>
                      <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/40 rounded-full" style={{ width: `${Math.min((conf.reserved_count / 100) * 100, 100)}%` }} />
                      </div>
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
      <Card className="shadow-sm border-none ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Contact className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Recent Registrations</CardTitle>
                <CardDescription className="text-xs">Latest participants joining the event</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {failed ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted-foreground/10 rounded-2xl bg-muted/5">
                <AlertCircle className="h-8 w-8 text-destructive/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Failed to load registrations</p>
              </div>
            ) : recentParticipants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted-foreground/10 rounded-2xl bg-muted/5">
                <Contact className="h-8 w-8 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No registrations yet</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentParticipants.map((p, i) => (
                  <div key={p.registration_uuid || i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/50 transition-colors border border-transparent hover:border-border/40">
                    <div className="h-11 w-11 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-sm font-extrabold text-primary">
                        {(p.first_name?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate leading-snug">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-[11px] font-medium text-muted-foreground truncate uppercase tracking-tight">{p.company_name || 'Independent'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 leading-none h-5 font-bold uppercase tracking-tighter rounded-md bg-secondary/40">{p.attendee_type_code || 'General'}</Badge>
                      <span className="text-[10px] font-bold text-muted-foreground/60 whitespace-nowrap">
                        {p.registered_at ? formatDistanceToNow(new Date(p.registered_at), { addSuffix: true }) : 'Recently'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

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
  TrendingUp,
  Sparkles,
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
import { cn } from "@/lib/utils"

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page(props: Props) {
  const searchParams = await props.searchParams
  const projectId = searchParams?.projectId as string | undefined

  if (!projectId) {
    return null
  }

  const result = await getDashboard(projectId)
  const failed = !result.success || !result.data

  const summary = result.data?.summary
  const recentParticipants = result.data?.recent_participants || []
  const conferences = result.data?.conferences || []

  const uniqueConferences: DashboardConference[] = []
  const seenUuids = new Set<string>()
  for (const c of conferences) {
    if (!seenUuids.has(c.conference_uuid)) {
      seenUuids.add(c.conference_uuid)
      uniqueConferences.push(c)
    }
  }

  const attendeeTypeData = (summary?.attendee_types || []).map(t => ({
    name: t.type_name,
    count: t.count,
  }))

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Live Analytics</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight font-display">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Redefining event management with real-time insights.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="glass py-1.5 px-3 border-primary/20 text-primary font-bold">
             <TrendingUp className="size-3 mr-1.5" />
             Project ID: {projectId.slice(0, 8)}
           </Badge>
        </div>
      </div>

      {/* ======================================================= */}
      {/* ROW 1 – Key Metric Cards                               */}
      {/* ======================================================= */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Exhibitors */}
        <Card className="relative overflow-hidden group/card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-none bg-transparent">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Total Exhibitors</CardTitle>
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover/card:scale-110">
              <Building2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {failed ? (
              <div className="text-muted-foreground flex items-center gap-2"><AlertCircle className="size-4" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <div className="text-3xl font-extrabold tracking-tighter">{summary?.total_exhibitors ?? 0}</div>
            )}
          </CardContent>
          <Building2 className="absolute -right-4 -bottom-4 size-24 opacity-[0.03] text-primary rotate-12 transition-transform group-hover/card:scale-110 group-hover/card:rotate-0" />
        </Card>

        {/* Total Participants */}
        <Card className="relative overflow-hidden group/card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-none bg-transparent">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Total Participants</CardTitle>
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover/card:scale-110">
              <Contact className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {failed ? (
              <div className="text-muted-foreground flex items-center gap-2"><AlertCircle className="size-4" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <div className="text-3xl font-extrabold tracking-tighter">{(summary?.total_participants ?? 0).toLocaleString()}</div>
            )}
          </CardContent>
          <Contact className="absolute -right-4 -bottom-4 size-24 opacity-[0.03] text-primary rotate-12 transition-transform group-hover/card:scale-110 group-hover/card:rotate-0" />
        </Card>

        {/* Conferences */}
        <Card className="relative overflow-hidden group/card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-none bg-transparent">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Conferences</CardTitle>
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover/card:scale-110">
              <Calendar className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {failed ? (
              <div className="text-muted-foreground flex items-center gap-2"><AlertCircle className="size-4" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <div className="text-3xl font-extrabold tracking-tighter">{summary?.total_conferences ?? 0}</div>
            )}
            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-primary/60 uppercase">
              <Sparkles className="size-3" /> Scheduled sessions
            </div>
          </CardContent>
          <Calendar className="absolute -right-4 -bottom-4 size-24 opacity-[0.03] text-primary rotate-12 transition-transform group-hover/card:scale-110 group-hover/card:rotate-0" />
        </Card>

        {/* Event Rooms */}
        <Card className="relative overflow-hidden group/card border-none bg-aurora-gradient text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-none bg-transparent">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-white/60">Event Rooms</CardTitle>
            <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center text-white transition-transform group-hover/card:scale-110">
              <Activity className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {failed ? (
              <div className="text-white/60 flex items-center gap-2"><AlertCircle className="size-4" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <>
                <div className="text-3xl font-extrabold tracking-tighter text-white">{summary?.total_rooms ?? 0}</div>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-white uppercase">
                  <span className="size-1.5 rounded-full bg-white animate-pulse" /> Active monitoring
                </div>
              </>
            )}
          </CardContent>
          <Activity className="absolute -right-4 -bottom-4 size-24 opacity-20 text-white rotate-12 transition-transform group-hover/card:scale-110 group-hover/card:rotate-0" />
        </Card>
      </div>

      {/* ======================================================= */}
      {/* ROW 2 – Attendee Type Chart + Upcoming Conferences      */}
      {/* ======================================================= */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

        {/* Attendee Type Chart */}
        <Card className="lg:col-span-3 border-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
               <div className="size-6 rounded bg-primary/10 flex items-center justify-center"><Users className="size-3.5 text-primary" /></div>
               Attendee Types
            </CardTitle>
            <CardDescription>Breakdown of all participant categories</CardDescription>
          </CardHeader>
          <CardContent>
            {attendeeTypeData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                <Users className="size-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No attendee data available</p>
              </div>
            ) : (
              <AttendeeTypeChart data={attendeeTypeData} />
            )}
          </CardContent>
        </Card>

        {/* Upcoming Conferences */}
        <Card className="lg:col-span-4 border-none">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="size-6 rounded bg-primary/10 flex items-center justify-center"><Calendar className="size-3.5 text-primary" /></div>
                  Conferences
                </CardTitle>
                <CardDescription>Scheduled session overview</CardDescription>
              </div>
              {uniqueConferences.length > 3 && (
                <a href={`/admin/conferences?projectId=${projectId}`} className="group flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-all">
                  Full Schedule <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {uniqueConferences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                <Calendar className="size-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No sessions scheduled</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {uniqueConferences.slice(0, 4).map((conf, i) => (
                  <div key={conf.conference_uuid || i} className="group/item glass border-white/5 bg-white/5 p-4 rounded-xl transition-all hover:bg-white/10 hover:border-white/10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-sm leading-tight line-clamp-1">{conf.title || 'Untitled Session'}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-2">
                          <span className="flex items-center gap-1.5"><MapPin className="size-3 text-primary/40" />{conf.location || 'TBD'}</span>
                          <span className="flex items-center gap-1.5"><Clock className="size-3 text-primary/40" />{conf.start_time?.slice(0, 5)} – {conf.end_time?.slice(0, 5)}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold px-2.5 py-0.5 shrink-0">
                        {conf.reserved_count} RSVP
                      </Badge>
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
      <Card className="border-none">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="size-6 rounded bg-primary/10 flex items-center justify-center"><Contact className="size-3.5 text-primary" /></div>
                Recent Registrations
              </CardTitle>
              <CardDescription>Latest participants joining the ecosystem</CardDescription>
            </div>
            {(summary?.total_participants ?? 0) > 5 && (
              <a href={`/admin/participants?projectId=${projectId}`} className="group flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-all">
                Directory <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {failed ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                <AlertCircle className="size-10 text-destructive/40 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Failed to synchronize registration data</p>
              </div>
            ) : recentParticipants.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                <Contact className="size-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Awaiting first participant...</p>
              </div>
            ) : (
              recentParticipants.slice(0, 6).map((p, i) => (
                <div key={p.registration_uuid || i} className="flex items-center gap-4 glass bg-white/5 border-white/5 p-4 rounded-2xl group/user transition-all hover:bg-white/10 hover:border-white/10">
                  <div className="size-12 rounded-xl bg-aurora-gradient p-[1px] shadow-lg shadow-primary/10">
                    <div className="size-full rounded-[11px] bg-background flex items-center justify-center overflow-hidden">
                      <span className="text-sm font-black text-primary group-hover/user:scale-110 transition-transform">
                        {(p.first_name?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate tracking-tight">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 truncate mt-0.5">{p.company_name || 'Independent'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 bg-primary/5 text-primary py-0 px-1.5 h-4 tracking-tighter">
                        {p.attendee_type_code || 'Gen'}
                      </Badge>
                      <span className="text-[10px] font-medium text-muted-foreground/40 italic">
                        {p.registered_at ? formatDistanceToNow(new Date(p.registered_at), { addSuffix: true }) : 'Now'}
                      </span>
                    </div>
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

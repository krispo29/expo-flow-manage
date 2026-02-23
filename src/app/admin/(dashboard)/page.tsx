import {
  Users,
  Contact,
  Calendar,
  ArrowUpRight,
  Activity,
  AlertCircle,
  Mail,
  Building2,
  Globe,
  Trophy,
  TrendingUp,
  UserCheck,
  BarChart3,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getExhibitors } from "@/app/actions/exhibitor"
import { getParticipants } from "@/app/actions/participant"
import { getConferences } from "@/app/actions/conference"
import { getRooms } from "@/app/actions/settings"
import { formatDistanceToNow, format, subDays, parseISO, isValid } from "date-fns"
import { AttendeeTypeChart } from "@/components/dashboard/attendee-type-chart"
import { RegistrationTrendChart } from "@/components/dashboard/registration-trend-chart"
import { CountryBreakdown } from "@/components/dashboard/country-breakdown"

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

  // ============================================================
  // PROCESS EXHIBITORS
  // ============================================================
  let totalExhibitors = 0
  let activeExhibitors = 0
  let exhibitorQuotaItems: { name: string; used: number; total: number; pct: number }[] = []
  let overQuotaCount = 0

  if (exhibitorsResult.status === 'fulfilled' && exhibitorsResult.value.success) {
    const exhibitors = exhibitorsResult.value.exhibitors || []
    totalExhibitors = exhibitors.length
    activeExhibitors = exhibitors.filter((e: any) => e.isActive).length
    overQuotaCount = exhibitors.filter((e: any) => (e.overQuota ?? 0) > 0).length

    exhibitorQuotaItems = exhibitors
      .filter((e: any) => (e.quota ?? 0) > 0)
      .map((e: any) => ({
        name: e.companyName || 'Unknown',
        used: e.usedQuota ?? 0,
        total: e.quota ?? 1,
        pct: Math.round(((e.usedQuota ?? 0) / (e.quota ?? 1)) * 100),
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5)
  }

  // ============================================================
  // PROCESS PARTICIPANTS
  // ============================================================
  let totalParticipants = 0
  let recentParticipants: any[] = []
  let attendeeTypeData: { name: string; count: number }[] = []
  let countryData: { country: string; count: number }[] = []
  let registrationTrend: { date: string; count: number }[] = []
  let emailSentCount = 0
  let withConferenceCount = 0

  if (participantsResult.status === 'fulfilled' && participantsResult.value.success) {
    const participants: any[] = participantsResult.value.data || []
    totalParticipants = participants.length

    // Email sent rate
    emailSentCount = participants.filter((p: any) => p.isEmailSent).length

    // Conference registrations
    withConferenceCount = participants.filter((p: any) => (p.conferenceCount ?? 0) > 0).length

    // Recent participants (last 5 by registered_at or array order)
    const sorted = [...participants].sort((a, b) => {
      const da = a.registeredAt ? new Date(a.registeredAt).getTime() : 0
      const db = b.registeredAt ? new Date(b.registeredAt).getTime() : 0
      return db - da
    })
    recentParticipants = sorted.slice(0, 5)

    // Attendee type breakdown
    const typeCounts: Record<string, number> = {}
    for (const p of participants) {
      const type = p.attendeeTypeCode || p.type || 'General'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    }
    attendeeTypeData = Object.entries(typeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Country breakdown (top 7)
    const countryCounts: Record<string, number> = {}
    for (const p of participants) {
      const country = p.residenceCountry || p.nationality || p.companyCountry || 'Unknown'
      if (country && country !== 'Unknown') {
        countryCounts[country] = (countryCounts[country] || 0) + 1
      }
    }
    countryData = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7)

    // Registration trend (last 14 days)
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const d = subDays(new Date(), 13 - i)
      return { date: format(d, 'dd MMM'), key: format(d, 'yyyy-MM-dd'), count: 0 }
    })
    for (const p of participants) {
      const rawDate = p.registeredAt || p.createdAt
      if (rawDate) {
        try {
          const d = parseISO(rawDate)
          if (isValid(d)) {
            const key = format(d, 'yyyy-MM-dd')
            const found = last14.find(x => x.key === key)
            if (found) found.count++
          }
        } catch { /* ignore */ }
      }
    }
    registrationTrend = last14.map(({ date, count }) => ({ date, count }))
  }

  // ============================================================
  // PROCESS CONFERENCES
  // ============================================================
  let totalConferences = 0
  let topConferences: any[] = []
  let totalConferenceQuota = 0
  let totalReserved = 0

  if (conferencesResult.status === 'fulfilled' && conferencesResult.value.success) {
    const conferences: any[] = conferencesResult.value.data || []
    totalConferences = conferences.length
    totalConferenceQuota = conferences.reduce((sum: number, c: any) => sum + (c.quota ?? 0), 0)
    totalReserved = conferences.reduce((sum: number, c: any) => sum + (c.reservedCount ?? 0), 0)

    topConferences = [...conferences]
      .sort((a, b) => (b.reservedCount ?? 0) - (a.reservedCount ?? 0))
      .slice(0, 3)
  }

  // ============================================================
  // PROCESS ROOMS
  // ============================================================
  let totalRooms = 0
  if (roomsResult.status === 'fulfilled' && roomsResult.value.success) {
    totalRooms = roomsResult.value.rooms?.length || 0
  }

  const hasTrend = registrationTrend.some(d => d.count > 0)

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
            {exhibitorsResult.status === 'rejected' ? (
              <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalExhibitors}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-emerald-500 font-semibold">{activeExhibitors} active</span>
                  {overQuotaCount > 0 && <span className="text-amber-500 font-semibold ml-2">· {overQuotaCount} over quota</span>}
                </p>
              </>
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
            {participantsResult.status === 'rejected' ? (
              <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalParticipants.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-emerald-500 font-semibold">{emailSentCount} emails sent</span>
                  {withConferenceCount > 0 && <span className="text-indigo-500 font-semibold ml-2">· {withConferenceCount} in sessions</span>}
                </p>
              </>
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
            {conferencesResult.status === 'rejected' ? (
              <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalConferences}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalConferenceQuota > 0 && <span>{totalReserved.toLocaleString()} / {totalConferenceQuota.toLocaleString()} seats reserved</span>}
                </p>
              </>
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
            {roomsResult.status === 'rejected' ? (
              <div className="text-muted-foreground flex items-center gap-2 mt-1"><AlertCircle className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Unavailable</span></div>
            ) : (
              <>
                <div className="text-2xl font-bold text-primary">{totalRooms}</div>
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
      {/* ROW 2 – Registration Trend + Attendee Type Chart        */}
      {/* ======================================================= */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Registration Trend */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-primary" /> Registration Trend</CardTitle>
                <CardDescription>New participant registrations – last 14 days</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {participantsResult.status === 'rejected' || totalParticipants === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No data to display</p>
              </div>
            ) : !hasTrend ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Registrations exist but no date info available for trend</p>
              </div>
            ) : (
              <RegistrationTrendChart data={registrationTrend} />
            )}
          </CardContent>
        </Card>

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
      </div>

      {/* ======================================================= */}
      {/* ROW 3 – Country Breakdown + Conference Popularity       */}
      {/* ======================================================= */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Country Breakdown */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4 text-primary" /> Top Countries</CardTitle>
            <CardDescription>Participant origins by residence country</CardDescription>
          </CardHeader>
          <CardContent>
            {countryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                <Globe className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No country data available</p>
              </div>
            ) : (
              <CountryBreakdown data={countryData} total={totalParticipants} />
            )}
          </CardContent>
        </Card>

        {/* Conference Popularity */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4 text-amber-500" /> Top Sessions</CardTitle>
                <CardDescription>Conferences ranked by reservations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {topConferences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                <Calendar className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No conferences yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topConferences.map((session: any, i) => {
                  const reserved = session.reservedCount ?? 0
                  const quota = session.quota ?? 1
                  const pct = quota > 0 ? Math.min(Math.round((reserved / quota) * 100), 100) : 0
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <div key={session.conferenceUuid || i} className="rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-lg leading-none mt-0.5">{medals[i] || '•'}</span>
                        <p className="font-semibold text-sm line-clamp-1 flex-1">{session.title || 'Untitled Session'}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>{session.location || 'General Room'}</span>
                        <span className="font-medium text-foreground">{reserved} / {quota} seats</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className={`text-xs mt-1 text-right font-medium ${pct >= 90 ? 'text-rose-500' : pct >= 70 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {pct}% full
                      </p>
                    </div>
                  )
                })}
                {totalConferences > 3 && (
                  <a href={`/admin/events?projectId=${projectId}`} className="w-full text-xs text-primary font-medium flex items-center justify-center gap-1 hover:underline mt-2">
                    View All Conferences <ArrowUpRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ======================================================= */}
      {/* ROW 4 – Recent Registrations + Exhibitor Quota          */}
      {/* ======================================================= */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Recent Registrations */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><UserCheck className="h-4 w-4 text-primary" /> Recent Registrations</CardTitle>
                <CardDescription>Latest participants joining the event</CardDescription>
              </div>
              {totalParticipants > 5 && (
                <a href={`/admin/participants?projectId=${projectId}`} className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline flex-shrink-0">
                  View All <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {participantsResult.status === 'rejected' ? (
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
                recentParticipants.map((p: any, i: number) => (
                  <div key={p.registrationUuid || i} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {(p.firstName?.[0] || p.first_name?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {p.firstName || p.first_name} {p.lastName || p.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{p.company || p.companyName || 'Independent'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs capitalize">{p.attendeeTypeCode || p.type || 'General'}</Badge>
                      {p.isEmailSent && <span title="Email sent"><Mail className="h-3 w-3 text-emerald-500" /></span>}
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {p.registeredAt || p.createdAt ? formatDistanceToNow(new Date(p.registeredAt || p.createdAt), { addSuffix: true }) : 'Recently'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Exhibitor Quota Usage */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-primary" /> Quota Usage</CardTitle>
                <CardDescription>Top exhibitors by pass utilization</CardDescription>
              </div>
              {overQuotaCount > 0 && (
                <Badge variant="destructive" className="text-xs">{overQuotaCount} over limit</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {exhibitorsResult.status === 'rejected' ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                <AlertCircle className="h-6 w-6 text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">Failed to load exhibitor data</p>
              </div>
            ) : exhibitorQuotaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                <Building2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No quota data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exhibitorQuotaItems.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium truncate max-w-[160px]">{item.name}</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-xs font-semibold ${item.pct >= 100 ? 'text-rose-500' : item.pct >= 80 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                          {item.pct}%
                        </span>
                        <span className="text-xs text-muted-foreground">({item.used}/{item.total})</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.pct >= 100 ? 'bg-rose-500' : item.pct >= 80 ? 'bg-amber-400' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min(item.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <a href={`/admin/exhibitors?projectId=${projectId}`} className="w-full text-xs text-primary font-medium flex items-center justify-center gap-1 hover:underline mt-2">
                  View All Exhibitors <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

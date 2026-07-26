import { Building2, Calendar, Contact } from 'lucide-react'
import type { DashboardEventSummary } from '@/app/actions/dashboard'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type Props = {
  events: DashboardEventSummary[]
}

const metrics = [
  ['total_participants', 'Participants', Contact],
  ['total_exhibitors', 'Exhibitors', Building2],
  ['total_conferences', 'Conferences', Calendar],
] as const

export function EventSummaryCards({ events }: Props) {
  return (
    <section className="space-y-4" aria-labelledby="event-overview-title">
      <div>
        <h3 id="event-overview-title" className="text-lg font-bold">
          Event Overview
        </h3>
        <p className="text-sm text-muted-foreground">
          Participant, exhibitor, and conference totals by event
        </p>
      </div>

      {events.length === 0 ? (
        <Card className="border-none">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No events available
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {events.map((event) => (
            <Card key={event.event_uuid} className="border-none">
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">
                    {event.event_name}
                  </CardTitle>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {event.event_code}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    event.is_active
                      ? 'border-primary/20 bg-primary/10 text-primary'
                      : 'border-muted-foreground/20 text-muted-foreground'
                  }
                >
                  {event.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                {metrics.map(([field, label, Icon]) => (
                  <div
                    key={field}
                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
                      <Icon className="size-3" />
                      {label}
                    </div>
                    <div className="mt-2 text-2xl font-extrabold tracking-tight">
                      {event[field].toLocaleString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

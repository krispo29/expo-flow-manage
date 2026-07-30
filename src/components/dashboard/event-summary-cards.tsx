import { Building2, Calendar, Contact } from 'lucide-react'
import type { DashboardEventSummary } from '@/app/actions/dashboard'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Props = {
  events: DashboardEventSummary[]
  failed: boolean
}

const metrics = [
  ['total_participants', 'Participants', Contact],
  ['total_exhibitors', 'Exhibitors', Building2],
  ['total_conferences', 'Conferences', Calendar],
] as const

export function EventSummaryCards({ events, failed }: Props) {
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

      {failed ? (
        <Card className="border-none">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Event summaries unavailable
          </CardContent>
        </Card>
      ) : events.length === 0 ? (
        <Card className="border-none">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No events available
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2.5">
          {events.map((event) => (
            <Card
              key={event.event_uuid}
              className="border-none transition-colors hover:bg-accent/40"
            >
              <CardContent className="flex flex-col gap-3 p-3.5 sm:px-5 sm:py-3.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-semibold sm:text-base">
                      {event.event_name}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        event.is_active
                          ? 'h-5 border-primary/20 bg-primary/10 px-2 text-[10px] font-medium text-primary shrink-0'
                          : 'h-5 border-muted-foreground/20 px-2 text-[10px] font-medium text-muted-foreground shrink-0'
                      }
                    >
                      {event.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-4 border-t border-white/5 pt-2 sm:justify-end sm:gap-6 sm:border-t-0 sm:pt-0">
                    {metrics.map(([field, label, Icon]) => (
                      <div key={field} className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-muted-foreground">
                          <Icon className="size-3.5" />
                        </div>
                        <div>
                          <div className="text-sm font-extrabold leading-none tracking-tight sm:text-base">
                            {event[field].toLocaleString()}
                          </div>
                          <div className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                            {label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <details className="group">
                  <summary
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'xs',
                      className:
                        'cursor-pointer list-none [&::-webkit-details-marker]:hidden',
                    })}
                  >
                    <span className="group-open:hidden">Show attendance</span>
                    <span className="hidden group-open:inline">
                      Hide attendance
                    </span>
                  </summary>

                  <div className="mt-3">
                    <Table
                      aria-label={`Daily attendance for ${event.event_name}`}
                      className="text-xs"
                    >
                      <TableHeader>
                        <TableRow>
                          <TableHead className="h-9 px-3">Date</TableHead>
                          <TableHead className="h-9 px-3 text-right">
                            Local
                          </TableHead>
                          <TableHead className="h-9 px-3 text-right">
                            Oversea
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {event.daily_attendance?.length ? (
                          event.daily_attendance.map((attendance) => (
                            <TableRow key={attendance.date}>
                              <TableCell className="p-3">
                                {attendance.date}
                              </TableCell>
                              <TableCell className="p-3 text-right">
                                {attendance.local.toLocaleString()}
                              </TableCell>
                              <TableCell className="p-3 text-right">
                                {attendance.oversea.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="p-3 text-center text-muted-foreground"
                            >
                              No attendance data
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

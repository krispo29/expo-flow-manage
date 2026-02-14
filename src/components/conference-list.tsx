'use client'

import { format } from 'date-fns'
import Link from 'next/link'
import { Conference } from '@/lib/mock-service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Clock, MapPin, Users } from 'lucide-react'
import { deleteConference } from '@/app/actions/conference'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ConferenceListProps {
  conferences: Conference[]
}

export function ConferenceList({ conferences }: ConferenceListProps) {
  const router = useRouter()

  // Group conferences by date
  const groupedConferences = conferences.reduce((acc, conf) => {
    const dateKey = format(new Date(conf.date), 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(conf)
    return acc
  }, {} as Record<string, Conference[]>)

  // Sort dates
  const sortedDates = Object.keys(groupedConferences).sort()

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this conference?')) return

    const result = await deleteConference(id)
    if (result.success) {
      toast.success('Conference deleted')
      router.refresh()
    } else {
      toast.error('Failed to delete conference')
    }
  }

  if (conferences.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No conferences found. Click &quot;Add Conference&quot; to create one.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((dateKey) => (
        <div key={dateKey} className="space-y-4">
          <h2 className="text-xl font-semibold sticky top-0 bg-background py-2 z-10 border-b">
            {format(new Date(dateKey), 'EEEE, MMMM do, yyyy')}
          </h2>
          <div className="grid gap-4">
            {groupedConferences[dateKey].map((conference) => (
              <Card key={conference.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-48 h-32 md:h-auto bg-muted flex-shrink-0 relative">
                      {conference.photoUrl ? (
                         // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={conference.photoUrl} 
                          alt={conference.topic}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Photo
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{conference.topic}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {conference.startTime} - {conference.endTime}
                              </span>
                              {conference.room && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {conference.room}
                                </span>
                              )}
                              {conference.capacity && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {conference.capacity} seats
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {conference.isPublic && <Badge variant="secondary">Public</Badge>}
                            {conference.allowPreReg && <Badge variant="outline">Pre-Reg</Badge>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/conferences/${conference.id}`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(conference.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

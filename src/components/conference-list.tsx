'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Conference } from '@/lib/mock-service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, Clock, MapPin, Users, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { deleteConference } from '@/app/actions/conference'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ConferenceListProps {
  conferences: Conference[]
  projectId: string
}

export function ConferenceList({ conferences, projectId }: Readonly<ConferenceListProps>) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set())

  // Filter conferences by search query
  const filteredConferences = conferences.filter(conf => 
    conf.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conf.room?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conf.detail?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group conferences by date
  const groupedConferences = filteredConferences.reduce((acc, conf) => {
    const dateKey = format(new Date(conf.date), 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(conf)
    return acc
  }, {} as Record<string, Conference[]>)

  // Sort dates
  const sortedDates = Object.keys(groupedConferences).sort((a, b) => a.localeCompare(b))
  
  function toggleDetail(id: string) {
    setExpandedDetails(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

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
        ไม่พบ Conference คลิก &quot;เพิ่ม Conference&quot; เพื่อสร้างใหม่
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="ค้นหา Conference (หัวข้อ, ห้อง, รายละเอียด...)" 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredConferences.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          ไม่พบผลลัพธ์ที่ตรงกับการค้นหา
        </div>
      ) : (
        <div className="space-y-8">
        {sortedDates.map((dateKey) => (
          <div key={dateKey} className="space-y-4">
            <h2 className="text-xl font-semibold sticky top-0 bg-background py-2 z-10 border-b">
              {format(new Date(dateKey), 'EEEE, MMMM do, yyyy')}
            </h2>
            <div className="grid gap-4">
              {groupedConferences[dateKey].map((conference) => {
                const isExpanded = expandedDetails.has(conference.id)
                return (
                  <Card key={conference.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="p-3 w-full md:w-52 shrink-0">
                          <div className="h-32 md:h-40 bg-muted rounded-md overflow-hidden relative">
                            {conference.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={conference.photoUrl} 
                                alt={conference.topic}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                                ไม่มีรูปภาพ
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{conference.topic}</h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
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
                                      {conference.capacity} ที่นั่ง
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 justify-end">
                                {conference.isPublic ? (
                                  <Badge variant="secondary">Public</Badge>
                                ) : (
                                  <Badge variant="outline">Private</Badge>
                                )}
                                {conference.showOnReg && <Badge variant="default">แสดงในหน้าลงทะเบียน</Badge>}
                                {conference.allowPreReg && <Badge variant="outline">Pre-Registration</Badge>}
                              </div>
                            </div>

                            {(conference.detail || conference.speakerInfo) && (
                              <div className="pt-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => toggleDetail(conference.id)}
                                  className="text-xs"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-3 w-3 mr-1" />
                                      ซ่อนรายละเอียด
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3 mr-1" />
                                      แสดงรายละเอียด
                                    </>
                                  )}
                                </Button>
                                
                                {isExpanded && (
                                  <div className="mt-2 space-y-3 text-sm">
                                    {conference.detail && (
                                      <div>
                                        <p className="font-medium text-muted-foreground mb-1">รายละเอียด:</p>
                                        <p className="text-foreground whitespace-pre-wrap">{conference.detail}</p>
                                      </div>
                                    )}
                                    {conference.speakerInfo && (
                                      <div>
                                        <p className="font-medium text-muted-foreground mb-1">ข้อมูลวิทยากร:</p>
                                        <p className="text-foreground whitespace-pre-wrap">{conference.speakerInfo}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/conferences/${conference.id}?projectId=${projectId}`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                แก้ไข
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(conference.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              ลบ
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Conference, createConference, updateConference, getProjectShowDates, getRooms, uploadConferenceImage, Room, ShowDate } from '@/app/actions/conference'
import { createOrganizerConference, updateOrganizerConference, getOrganizerProjectShowDates, getOrganizerRooms, getOrganizerEvents } from '@/app/actions/organizer-conference'
import { getEvents, type Event } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Mic, CalendarDays, Clock, MapPin, Users, Globe, Lock, Plus, X, FileText } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

function addDurationToTime(timeStr: string, minutesToAdd: number) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

function TimeSelector({ value, onChange, name, id }: { value: string, onChange: (v: string) => void, name: string, id: string }) {
  const [h, m] = value ? value.split(':') : ['09', '00'];

  return (
    <div className="flex items-center gap-2">
      <Select value={h} onValueChange={(newH) => onChange(`${newH}:${m}`)}>
        <SelectTrigger id={`${id}-h`} className="h-12 w-[85px] text-lg font-medium shadow-sm bg-white">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-[250px] z-50">
          {HOURS.map((hour) => (
            <SelectItem key={hour} value={hour}>{hour}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xl font-bold text-slate-400 select-none pb-1">:</span>
      <Select value={m} onValueChange={(newM) => onChange(`${h}:${newM}`)}>
        <SelectTrigger id={`${id}-m`} className="h-12 w-[85px] text-lg font-medium shadow-sm bg-white">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="max-h-[250px] z-50">
          {MINUTES.map((minute) => (
            <SelectItem key={minute} value={minute}>{minute}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name={name} value={value} />
    </div>
  )
}

interface ConferenceFormProps {
  projectId: string
  conference?: Conference
  userRole?: string
}

export function ConferenceForm({ projectId, conference, userRole }: Readonly<ConferenceFormProps>) {
  const isOrganizer = userRole === 'ORGANIZER'
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [showDates, setShowDates] = useState<ShowDate[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isActive, setIsActive] = useState(conference?.is_active ?? true)
  const [startTime, setStartTime] = useState(conference?.start_time?.substring(0, 5) || '')
  const [endTime, setEndTime] = useState(conference?.end_time?.substring(0, 5) || '')

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart)
    if (newStart && !endTime) {
      setEndTime(addDurationToTime(newStart, 60))
    }
  }

  const setDuration = (minutes: number) => {
    if (startTime) {
      setEndTime(addDurationToTime(startTime, minutes))
    } else {
      toast.error('Please select a start time first')
    }
  }

  const [conferenceType, setConferenceType] = useState<'public' | 'private'>(conference?.conference_type ?? 'public')
  const [detail, setDetail] = useState(conference?.detail || '')
  
  const initialSpeakers = conference?.speakers && conference.speakers.length > 0
    ? conference.speakers.map(s => ({
        speaker_name: s.speaker_name,
        speaker_info: s.speaker_info || '',
        speaker_image: s.speaker_image || ''
      }))
    : [{ speaker_name: '', speaker_info: '', speaker_image: '' }]

  const [speakersList, setSpeakersList] = useState(initialSpeakers)
  const [speakerImageLoading, setSpeakerImageLoading] = useState<Record<number, boolean>>({})

  const addSpeaker = () => setSpeakersList([...speakersList, { speaker_name: '', speaker_info: '', speaker_image: '' }])
  const removeSpeaker = (index: number) => {
    if (speakersList.length > 1) {
      setSpeakersList(speakersList.filter((_, i) => i !== index))
    }
  }
  const updateSpeaker = (index: number, field: 'speaker_name' | 'speaker_info' | 'speaker_image', value: string) => {
    const newList = [...speakersList]
    newList[index][field] = value
    setSpeakersList(newList)
  }

  async function handleSpeakerImageChange(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setSpeakerImageLoading(prev => ({ ...prev, [index]: true }))

    try {
      const formData = new FormData()
      formData.append('image', file) // Component Action expects 'image', which then converts to 'file' for API

      const uploadResult = await uploadConferenceImage(formData)
      if (uploadResult.success && uploadResult.imageUrl) {
        updateSpeaker(index, 'speaker_image', uploadResult.imageUrl)
        toast.success('Speaker image uploaded')
      } else {
        toast.error(uploadResult.error || 'Failed to upload speaker image')
      }
    } catch (error) {
      console.error('Error uploading speaker image:', error)
      toast.error('Failed to upload speaker image')
    } finally {
      setSpeakerImageLoading(prev => ({ ...prev, [index]: false }))
      event.target.value = ''
    }
  }
  useEffect(() => {
    async function fetchData() {
      try {
        const [datesResult, roomsResult, eventsResult] = await Promise.all([
          isOrganizer ? getOrganizerProjectShowDates() : getProjectShowDates(),
          isOrganizer ? getOrganizerRooms() : getRooms(),
          isOrganizer ? getOrganizerEvents() : getEvents(projectId),
        ])

        if (roomsResult.success) {
          setRooms(roomsResult.data || [])
        }

        if (datesResult.success) {
          setShowDates(datesResult.data || [])
        }

        if (eventsResult.success) {
          if (isOrganizer) {
            setEvents(((eventsResult as { data?: Event[] }).data || []) as Event[])
          } else {
            setEvents(((eventsResult as { events?: Event[] }).events || []) as Event[])
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load rooms, dates, and events')
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [isOrganizer, projectId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (startTime && endTime && startTime >= endTime) {
      toast.error('End time must be after start time')
      return;
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)

      const result = conference
        ? (isOrganizer ? await updateOrganizerConference(conference.conference_uuid, formData) : await updateConference(conference.conference_uuid, formData))
        : (isOrganizer ? await createOrganizerConference(formData) : await createConference(formData))

      if (result.success) {
        toast.success(conference ? 'Conference updated' : 'Conference created')
        router.push(isOrganizer ? '/organizer/conferences' : `/admin/conferences?projectId=${projectId}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Something went wrong')
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-8 pb-20">
      <div className="mb-6">
        <Button variant="ghost" type="button" asChild className="mb-2 pl-0 hover:bg-transparent hover:text-primary">
          <Link href={isOrganizer ? '/organizer/conferences' : `/admin/conferences?projectId=${projectId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Conferences
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {conference ? 'Edit Conference' : 'New Conference'}
          </h1>
          <p className="text-muted-foreground">
            {conference ? 'Update the details of the existing conference session.' : 'Create a new conference session for the event.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="md:col-span-2 shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Mic className="size-4" />
              </div>
              <CardTitle className="text-lg">Session Information</CardTitle>
            </div>
            <CardDescription>Conference title, speaker, and media.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="event_uuid">Event *</Label>
                <select
                  id="event_uuid"
                  name="event_uuid"
                  defaultValue={conference?.event_uuid || ''}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select event</option>
                  {events.map((eventItem) => (
                    <option key={eventItem.event_uuid} value={eventItem.event_uuid}>
                      {eventItem.event_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" defaultValue={conference?.title} placeholder="e.g. Future of AgriTech 2024" className="h-11" required />
              </div>

              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <Label className="text-base">Speakers *</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Add details for each speaker presenting at this session.
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addSpeaker}
                    className="h-8 gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    <span className="text-xs">Add Speaker</span>
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {speakersList.map((speaker, index) => (
                    <Card key={index} className="shadow-sm border-slate-200 overflow-hidden relative">
                      {speakersList.length > 1 && (
                        <div className="absolute top-3 right-3 z-10">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeSpeaker(index)}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      )}
                      <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label>Speaker Name *</Label>
                          <Input
                            value={speaker.speaker_name}
                            onChange={(e) => updateSpeaker(index, 'speaker_name', e.target.value)}
                            placeholder={`e.g. John Doe`}
                            className="h-10"
                            required
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Speaker Information</Label>
                          <Textarea
                            value={speaker.speaker_info}
                            onChange={(e) => updateSpeaker(index, 'speaker_info', e.target.value)}
                            placeholder="Title, Company, Bio..."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Speaker Image</Label>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleSpeakerImageChange(index, e)} 
                                disabled={speakerImageLoading[index]} 
                                className="max-w-md" 
                              />
                              {speakerImageLoading[index] && <Loader2 className="h-4 w-4 animate-spin" />}
                            </div>
                            {speaker.speaker_image && (
                              <div className="mt-2 relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted shadow-sm">
                                <img src={speaker.speaker_image} alt="Speaker preview" className="object-cover w-full h-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {/* Hidden input to pass to formData */}
                <input type="hidden" name="speakers" value={JSON.stringify(speakersList.filter(s => s.speaker_name.trim() !== ''))} />
              </div>

              <div className="md:col-span-2 pt-2">
                <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-background">
                  <div className="space-y-0.5">
                    <Label className="text-base" htmlFor="is_active">Active Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Determine whether this conference is currently active and visible to attendees.
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="is_active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <Label htmlFor="is_active" className="text-sm font-medium w-12 cursor-pointer">
                      {isActive ? 'Active' : 'Inactive'}
                    </Label>
                    <input type="hidden" name="is_active" value={isActive ? 'true' : 'false'} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <CalendarDays className="size-4" />
              </div>
              <CardTitle className="text-lg">Schedule & Location</CardTitle>
            </div>
            <CardDescription>Date, time, and room assignment.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="show_date" className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-slate-400" />
                Show Date *
              </Label>
              <select id="show_date" name="show_date" defaultValue={conference?.show_date} className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                <option value="">Select date</option>
                {showDates.map((date) => (
                  <option key={date.value} value={date.value}>
                    {date.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-slate-400" />
                Room *
              </Label>
              <select id="location" name="location" defaultValue={conference?.location} className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                <option value="">Select room</option>
                {rooms.map((room) => (
                  <option key={room.room_uuid} value={room.room_uuid}>
                    {room.room_name} - {room.location_detail}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-xl border border-slate-200">
              <div className="space-y-3">
                <Label htmlFor="start_time-h" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Clock className="size-4 text-primary" />
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <TimeSelector
                    id="start_time"
                    name="start_time"
                    value={startTime}
                    onChange={handleStartTimeChange}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="end_time-h" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Clock className="size-4 text-primary" />
                  End Time <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <TimeSelector
                    id="end_time"
                    name="end_time"
                    value={endTime}
                    onChange={setEndTime}
                  />
                </div>
                {startTime && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setDuration(30)} className="h-7 text-[11px] px-2 rounded-full border-primary/20 hover:bg-primary/5 text-primary">
                      +30m
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDuration(60)} className="h-7 text-[11px] px-2 rounded-full border-primary/20 hover:bg-primary/5 text-primary">
                      +1h
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDuration(90)} className="h-7 text-[11px] px-2 rounded-full border-primary/20 hover:bg-primary/5 text-primary">
                      +1.5h
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDuration(120)} className="h-7 text-[11px] px-2 rounded-full border-primary/20 hover:bg-primary/5 text-primary">
                      +2h
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Users className="size-4" />
              </div>
              <CardTitle className="text-lg">Capacity & Type</CardTitle>
            </div>
            <CardDescription>Attendee limit and access type.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="quota">Quota *</Label>
              <Input id="quota" name="quota" type="number" min="1" className="h-11" defaultValue={conference?.quota} placeholder="e.g. 100" required />
              <p className="text-[11px] text-muted-foreground">Maximum number of attendees allowed.</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Conference Type</Label>
              <RadioGroup defaultValue={conferenceType} onValueChange={(value) => setConferenceType(value as 'public' | 'private')} className="grid grid-cols-2 gap-3">
                <Label htmlFor="public" className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${conferenceType === 'public' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
                  <RadioGroupItem value="public" id="public" />
                  <div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Globe className="size-3.5" />
                      Public
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Open to all attendees</p>
                  </div>
                </Label>
                <Label htmlFor="private" className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${conferenceType === 'private' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
                  <RadioGroupItem value="private" id="private" />
                  <div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Lock className="size-3.5" />
                      Private
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Invite only</p>
                  </div>
                </Label>
              </RadioGroup>
              <input type="hidden" name="conference_type" value={conferenceType} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <FileText className="size-4" />
              </div>
              <CardTitle className="text-lg">Description</CardTitle>
            </div>
            <CardDescription>Detailed information about the conference session.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="min-h-[250px] flex flex-col">
              <ReactQuill 
                theme="snow" 
                value={detail} 
                onChange={setDetail}
                className="flex-1"
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'clean']
                  ],
                }}
              />
              <input type="hidden" name="detail" value={detail} />
            </div>
            <style jsx global>{`
              .ql-container {
                min-height: 200px;
                font-size: 16px;
                border-bottom-left-radius: 0.5rem;
                border-bottom-right-radius: 0.5rem;
              }
              .ql-toolbar {
                border-top-left-radius: 0.5rem;
                border-top-right-radius: 0.5rem;
                background-color: #f8fafc;
              }
              .ql-editor {
                min-height: 200px;
              }
            `}</style>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" size="lg" className="min-w-[200px] h-12 shadow-md hover:shadow-lg transition-all" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {conference ? 'Save Changes' : 'Create Conference'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}



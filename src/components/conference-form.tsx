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
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Mic, CalendarDays, Clock, MapPin, Users, Globe, Lock } from 'lucide-react'
import Link from 'next/link'

interface ConferenceFormProps {
  projectId: string
  conference?: Conference
  userRole?: string
}

export function ConferenceForm({ projectId, conference, userRole }: Readonly<ConferenceFormProps>) {
  const isOrganizer = userRole === 'ORGANIZER'
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [showDates, setShowDates] = useState<ShowDate[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [imageUrl, setImageUrl] = useState(conference?.image_url || '')
  const [isActive, setIsActive] = useState(conference?.is_active ?? true)

  const [conferenceType, setConferenceType] = useState<'public' | 'private'>(conference?.conference_type ?? 'public')

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

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const uploadResult = await uploadConferenceImage(formData)
      if (uploadResult.success && uploadResult.imageUrl) {
        setImageUrl(uploadResult.imageUrl)
        toast.success('Image uploaded successfully')
      } else {
        toast.error(uploadResult.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploadingImage(false)
      event.target.value = ''
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
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

              <div className="space-y-2">
                <Label htmlFor="speaker_name">Speaker Name *</Label>
                <Input id="speaker_name" name="speaker_name" defaultValue={conference?.speaker_name} placeholder="e.g. John Doe" className="h-11" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speakers">Speakers</Label>
                <Textarea
                  id="speakers"
                  name="speakers"
                  defaultValue={conference?.speakers?.join('\n') || ''}
                  placeholder="One speaker per line"
                  rows={3}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="speaker_info">Speaker Information</Label>
                <Textarea id="speaker_info" name="speaker_info" defaultValue={conference?.speaker_info} placeholder="Title, Company, Bio..." rows={3} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="image_upload">Image</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Input id="image_upload" type="file" accept="image/*" onChange={handleImageChange} disabled={isUploadingImage} className="max-w-md" />
                    {isUploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                  {imageUrl ? <p className="text-xs text-muted-foreground break-all">{imageUrl}</p> : null}
                </div>
                <input type="hidden" name="image_url" value={imageUrl} />
              </div>

              <div className="space-y-2 md:col-span-2 flex items-center gap-2 pt-2">
                <input id="is_active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
                <Label htmlFor="is_active">Active</Label>
                <input type="hidden" name="is_active" value={isActive ? 'true' : 'false'} />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time" className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-slate-400" />
                  Start Time *
                </Label>
                <Input id="start_time" name="start_time" type="time" className="h-11" defaultValue={conference?.start_time?.substring(0, 5)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time" className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-slate-400" />
                  End Time *
                </Label>
                <Input id="end_time" name="end_time" type="time" className="h-11" defaultValue={conference?.end_time?.substring(0, 5)} required />
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
      </div>

      <Separator className="my-8" />

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" size="lg" className="min-w-[200px] h-12 shadow-md hover:shadow-lg transition-all" disabled={isSubmitting || isUploadingImage}>
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



'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Conference, createConference, updateConference, getProjectShowDates, getRooms, Room, ShowDate } from '@/app/actions/conference'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ConferenceFormProps {
  projectId: string
  conference?: Conference
}

export function ConferenceForm({ projectId, conference }: Readonly<ConferenceFormProps>) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [showDates, setShowDates] = useState<ShowDate[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [conferenceType, setConferenceType] = useState<'public' | 'private'>(conference?.conference_type ?? 'public')

  useEffect(() => {
    async function fetchData() {
      try {
        const [datesResult, roomsResult] = await Promise.all([
          getProjectShowDates(),
          getRooms()
        ])
        
        if (roomsResult.success) {
          setRooms(roomsResult.data || [])
        }
        if (datesResult.success) {
          setShowDates(datesResult.data || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load rooms and dates')
      } finally {
        setIsLoadingData(false)
      }
    }
    
    fetchData()
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      
      const result = conference 
        ? await updateConference(conference.conference_uuid, formData)
        : await createConference(formData)

      if (result.success) {
        toast.success(conference ? 'Conference updated' : 'Conference created')
        router.push(`/admin/conferences?projectId=${projectId}`)
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
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">

          <div className="mb-6">
            <Button variant="ghost" type="button" asChild className="mb-2 pl-0 hover:bg-transparent hover:text-primary">
              <Link href={`/admin/conferences?projectId=${projectId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Conferences
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {conference ? 'Edit Conference' : 'New Conference'}
            </h1>
            <p className="text-muted-foreground">
              {conference 
                ? 'Update the details of the existing conference session.' 
                : 'Create a new conference session for the event.'}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Conference Details</CardTitle>
              <CardDescription>
                Fill in the information below. Fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input 
                  id="title" 
                  name="title" 
                  defaultValue={conference?.title} 
                  placeholder="e.g. Future of AgriTech 2024" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speaker_name">Speaker Name *</Label>
                <Input 
                  id="speaker_name" 
                  name="speaker_name" 
                  defaultValue={conference?.speaker_name} 
                  placeholder="e.g. John Doe" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speaker_info">Speaker Information</Label>
                <Textarea 
                  id="speaker_info" 
                  name="speaker_info" 
                  defaultValue={conference?.speaker_info} 
                  placeholder="Title, Company, Bio..." 
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="show_date">Show Date *</Label>
                  <select 
                    id="show_date" 
                    name="show_date" 
                    defaultValue={conference?.show_date}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select date</option>
                    {showDates.map((date) => (
                      <option key={date.value} value={date.value}>
                        {date.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Room *</Label>
                  <select 
                    id="location" 
                    name="location" 
                    defaultValue={conference?.location}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select room</option>
                    {rooms.map((room) => (
                      <option key={room.room_uuid} value={room.room_uuid}>
                        {room.room_name} - {room.location_detail}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input 
                    id="start_time" 
                    name="start_time" 
                    type="time" 
                    defaultValue={conference?.start_time?.substring(0, 5)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input 
                    id="end_time" 
                    name="end_time" 
                    type="time" 
                    defaultValue={conference?.end_time?.substring(0, 5)} 
                    required 
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="quota">Quota *</Label>
                  <Input 
                    id="quota" 
                    name="quota" 
                    type="number" 
                    min="1"
                    defaultValue={conference?.quota} 
                    placeholder="e.g. 100" 
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground">Conference Type</h3>
                
                <div className="space-y-3">
                  <Label>Type</Label>
                  <RadioGroup 
                    defaultValue={conferenceType} 
                    onValueChange={(value) => setConferenceType(value as 'public' | 'private')}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public" className="font-normal cursor-pointer">Public</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private" className="font-normal cursor-pointer">Private</Label>
                    </div>
                  </RadioGroup>
                  <input type="hidden" name="conference_type" value={conferenceType} />
                </div>
              </div>

            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Conference
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
  )
}

'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Conference } from '@/lib/mock-service'
import { createConference, updateConference } from '@/app/actions/conference'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ConferenceFormProps {
  projectId: string
  // If provided, we are in "Edit" mode
  conference?: Conference
}

export function ConferenceForm({ projectId, conference }: Readonly<ConferenceFormProps>) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize checkbox states based on conference data or defaults
  const [isPublic, setIsPublic] = useState(conference?.isPublic ?? true)
  const [showOnReg, setShowOnReg] = useState(conference?.showOnReg ?? true)
  const [allowPreReg, setAllowPreReg] = useState(conference?.allowPreReg ?? true)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      
      // Manually append checkbox values since we're using controlled components 
      // referencing hidden inputs or just ignoring the UI component state in FormData 
      // if not wired up with hidden input. 
      // We will add hidden inputs for these to make it work seamlessly with FormData.
      
      // Let's ensure the FormData has everything we need.
      // Since we'll use hidden inputs for the checkboxes, formData will pick them up.
      
      const result = conference 
        ? await updateConference(conference.id, formData)
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

  return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          {/* Hidden field for projectId is required for create */}
          <input type="hidden" name="projectId" value={projectId} />

          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-2 pl-0 hover:bg-transparent hover:text-primary">
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
                <Label htmlFor="topic">Topic *</Label>
                <Input 
                  id="topic" 
                  name="topic" 
                  defaultValue={conference?.topic} 
                  placeholder="e.g. Future of AgriTech 2024" 
                  required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input 
                    id="date" 
                    name="date" 
                    type="date"
                    defaultValue={conference?.date ? format(new Date(conference.date), 'yyyy-MM-dd') : ''} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room</Label>
                  <Input 
                    id="room" 
                    name="room" 
                    defaultValue={conference?.room} 
                    placeholder="e.g. Grand Ballroom" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input 
                    id="startTime" 
                    name="startTime" 
                    type="time" 
                    defaultValue={conference?.startTime} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input 
                    id="endTime" 
                    name="endTime" 
                    type="time" 
                    defaultValue={conference?.endTime} 
                    required 
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input 
                    id="capacity" 
                    name="capacity" 
                    type="number" 
                    min="0"
                    defaultValue={conference?.capacity} 
                    placeholder="e.g. 100" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail">Description</Label>
                <Textarea 
                  id="detail" 
                  name="detail" 
                  defaultValue={conference?.detail} 
                  placeholder="Provide a brief description of the session..." 
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speakerInfo">Speaker Information</Label>
                <Textarea 
                  id="speakerInfo" 
                  name="speakerInfo" 
                  defaultValue={conference?.speakerInfo} 
                  placeholder="Name, Title, Company of the speaker(s)..." 
                  rows={3}
                />
              </div>

              <div className="space-y-4 pt-2 border-t">
                <h3 className="text-sm font-medium text-muted-foreground">Visibility & Registration Settings</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isPublic" 
                    checked={isPublic} 
                    onCheckedChange={(checked) => setIsPublic(checked === true)}
                  />
                  <input type="hidden" name="isPublic" value={isPublic ? 'on' : 'off'} />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="isPublic" className="cursor-pointer">Publicly Visible</Label>
                    <p className="text-xs text-muted-foreground">
                      If unchecked, this session will strictly be hidden from public view.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="showOnReg" 
                    checked={showOnReg} 
                    onCheckedChange={(checked) => setShowOnReg(checked === true)}
                  />
                  <input type="hidden" name="showOnReg" value={showOnReg ? 'on' : 'off'} />
                  <div className="grid gap-1.5 leading-none">
                     <Label htmlFor="showOnReg" className="cursor-pointer">Show on Registration Form</Label>
                     <p className="text-xs text-muted-foreground">
                      Enable to allow users to see this session during registration.
                    </p>
                  </div>
                </div>

                 <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="allowPreReg" 
                    checked={allowPreReg} 
                    onCheckedChange={(checked) => setAllowPreReg(checked === true)}
                  />
                  <input type="hidden" name="allowPreReg" value={allowPreReg ? 'on' : 'off'} />
                  <div className="grid gap-1.5 leading-none">
                     <Label htmlFor="allowPreReg" className="cursor-pointer">Allow Pre-Registration</Label>
                     <p className="text-xs text-muted-foreground">
                      Allow users to book/register for this specific session in advance.
                    </p>
                  </div>
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

'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Conference } from '@/lib/mock-service'
import { createConference, updateConference } from '@/app/actions/conference'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2, Image as ImageIcon, X } from 'lucide-react'
import Link from 'next/link'

interface ConferenceFormProps {
  projectId: string
  // If provided, we are in "Edit" mode
  conference?: Conference
}

export function ConferenceForm({ projectId, conference }: Readonly<ConferenceFormProps>) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize states based on conference data or defaults
  const [isPublic, setIsPublic] = useState(conference?.isPublic ?? true)
  const [showOnReg, setShowOnReg] = useState(conference?.showOnReg ?? true)
  const [allowPreReg, setAllowPreReg] = useState(conference?.allowPreReg ?? true)
  const [photoUrl, setPhotoUrl] = useState(conference?.photoUrl ?? '')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file type
      const validTypes = ['image/jpeg', 'image/png']
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload .jpg or .png')
        e.target.value = ''
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const img = new Image()
        img.onload = () => {
          if (img.width !== 300 || img.height !== 300) {
            toast.error('Image must be exactly 300x300 px')
            e.target.value = ''
            return
          }
          setPhotoUrl(reader.result as string)
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setPhotoUrl('')
  }

  return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          {/* Hidden field for projectId is required for create */}
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="photoUrl" value={photoUrl} />

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
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Conference Image</Label>
                  <span className="text-xs text-muted-foreground font-medium">
                    Remark: .jpg, .png (300x300 px)
                  </span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  {photoUrl ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                      <img 
                        src={photoUrl} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 size-8 rounded-full shadow-lg"
                        onClick={removeImage}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 bg-muted/50 text-muted-foreground transition-colors hover:bg-muted/80">
                      <ImageIcon className="size-10 opacity-50" />
                      <p className="text-sm font-medium">Click to upload 300x300 image</p>
                      <p className="text-xs">Supports: .jpg, .png (Strict 300x300 px)</p>
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="hidden"
                        id="image-upload"
                        onChange={handleImageChange}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        Select Image
                      </Button>
                    </div>
                  )}
                </div>
              </div>

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
                  <Label htmlFor="capacity">Limit Seats</Label>
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
              
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground">Conference Type & Visibility</h3>
                
                <div className="space-y-3">
                  <Label>Conference Type</Label>
                  <RadioGroup 
                    defaultValue={isPublic ? 'on' : 'off'} 
                    onValueChange={(value: string) => setIsPublic(value === 'on')}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="on" id="public" />
                      <Label htmlFor="public" className="font-normal cursor-pointer">Public</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="off" id="private" />
                      <Label htmlFor="private" className="font-normal cursor-pointer">Private</Label>
                    </div>
                  </RadioGroup>
                  <input type="hidden" name="isPublic" value={isPublic ? 'on' : 'off'} />
                </div>

                <div className="flex items-center space-x-2 pt-2">
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

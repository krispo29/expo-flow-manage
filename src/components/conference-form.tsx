'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createConference, updateConference } from '@/app/actions/conference'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, Upload, MapPin, Users, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'

interface ConferenceFormProps {
  projectId: string
  conference?: any
}

export function ConferenceForm({ projectId, conference }: ConferenceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<Date | undefined>(
    conference?.date ? new Date(conference.date) : new Date()
  )
  const [photoPreview, setPhotoPreview] = useState<string | null>(conference?.photoUrl || null)
  
  const [formData, setFormData] = useState({
    topic: conference?.topic || '',
    startTime: conference?.startTime || '09:00',
    endTime: conference?.endTime || '10:00',
    room: conference?.room || '',
    capacity: conference?.capacity?.toString() || '',
    detail: conference?.detail || '',
    speakerInfo: conference?.speakerInfo || '',
    isPublic: conference?.isPublic ?? true,
    showOnReg: conference?.showOnReg ?? true,
    allowPreReg: conference?.allowPreReg ?? false
  })

  const ROOMS = ['Grand Hall', 'Meeting Room A', 'Meeting Room B', 'Auditorium', 'Workshop Room 1']

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleRemovePhoto() {
    setPhotoPreview(null)
    // We also need to clear the file input value if possible, strict react way is using ref, 
    // but for now relying on preview state is key. 
    // If there was an existing photo, it is now "removed" from preview.
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const payload = new FormData(e.currentTarget)
    payload.append('projectId', projectId)
    payload.append('isPublic', String(formData.isPublic))
    payload.append('showOnReg', String(formData.showOnReg))
    payload.append('allowPreReg', String(formData.allowPreReg))
    if (date) payload.append('date', date.toISOString())
    // Only append existingPhotoUrl if it exists AND the preview still matches it (meaning not removed/replaced)
    if (conference?.photoUrl && photoPreview === conference.photoUrl) {
      payload.append('existingPhotoUrl', conference.photoUrl)
    }
    // If preview is null but conference had photo, we might want to signal deletion
    if (conference?.photoUrl && !photoPreview) {
      payload.append('removePhoto', 'true')
    }

    // Append rich text content manually if using a future editor, but here textarea name binds automatically
    // except if we use controlled state which we are for tabs switching persistence?
    // Actually standard form submission captures named inputs even in other tabs if they are mounted.
    // Radix Tabs unmount content by default? No, usually just hidden. 
    // Wait, Radix Tabs (shadcn) might ensure content is present.
    // Let's ensure we append state data to be safe for controlled components.
    
    // Actually, uncontrolled inputs inside tabs might be lost if tabs unmount them.
    // Shadcn Tabs (Radix) defaults to `forceMount` usually being false, so they might unmount.
    // So better to append from state.
    payload.set('topic', formData.topic)
    payload.set('startTime', formData.startTime)
    payload.set('endTime', formData.endTime)
    payload.set('room', formData.room)
    payload.set('capacity', formData.capacity)
    payload.set('detail', formData.detail)
    payload.set('speakerInfo', formData.speakerInfo)

    let result
    if (conference) {
      result = await updateConference(conference.id, payload)
    } else {
      result = await createConference(payload)
    }

    if (result.success) {
      toast.success(conference ? 'Conference updated' : 'Conference created')
      router.push('/admin/conferences')
      router.refresh()
    } else {
      toast.error(result.error || 'Operation failed')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{conference ? 'Edit Conference' : 'New Conference'}</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {conference ? 'Save Changes' : 'Create Conference'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="speaker">Speaker Info</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="topic">Topic</Label>
                <Input 
                  id="topic" 
                  value={formData.topic} 
                  onChange={e => setFormData({...formData, topic: e.target.value})} 
                  required 
                  placeholder="e.g. Future of Tech"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="startTime" 
                      type="time" 
                      className="pl-8"
                      value={formData.startTime}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="endTime" 
                      type="time" 
                      className="pl-8"
                      value={formData.endTime}
                      onChange={e => setFormData({...formData, endTime: e.target.value})} 
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="room">Room / Location</Label>
                    <div className="relative">
                    <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                    <Select 
                      value={formData.room} 
                      onValueChange={(value) => setFormData({...formData, room: value})}
                    >
                      <SelectTrigger className="pl-8">
                        <SelectValue placeholder="Select Room" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOMS.map(room => (
                          <SelectItem key={room} value={room}>{room}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacity (Seats)</Label>
                  <div className="relative">
                    <Users className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="capacity" 
                      type="number" 
                      className="pl-8"
                      value={formData.capacity}
                      onChange={e => setFormData({...formData, capacity: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="description" className="py-4">
              <div className="grid gap-2 h-full">
                <Label htmlFor="detail">Session Details</Label>
                <Textarea 
                  id="detail" 
                  className="min-h-[300px] font-mono text-sm leading-relaxed" 
                  placeholder="Enter detailed description..."
                  value={formData.detail}
                  onChange={e => setFormData({...formData, detail: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">Markdown supported (basic)</p>
              </div>
            </TabsContent>
            
            <TabsContent value="speaker" className="py-4">
              <div className="grid gap-2 h-full">
                <Label htmlFor="speakerInfo">Speaker Information</Label>
                <Textarea 
                  id="speakerInfo" 
                  className="min-h-[300px] font-mono text-sm leading-relaxed" 
                  placeholder="Speaker bio, credentials, etc."
                  value={formData.speakerInfo}
                  onChange={e => setFormData({...formData, speakerInfo: e.target.value})}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Cover Photo</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors relative group cursor-pointer aspect-video flex flex-col items-center justify-center">
                  <Input 
                    type="file" 
                    name="photo" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handlePhotoChange}
                    // Reset value to allow selecting same file again if needed, or handle clearing
                    key={photoPreview ? 'has-preview' : 'no-preview'}
                  />
                  {photoPreview ? (
                    <>
                      <Image 
                        src={photoPreview} 
                        alt="Preview" 
                        fill 
                        className="object-cover rounded-md"
                      />
                      <div className="absolute top-2 right-2 z-20">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation() // Prevent triggering file input
                            handleRemovePhoto()
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                      <span className="text-xs text-muted-foreground mt-1">300x300 recommended</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Public Session</Label>
                    <p className="text-sm text-muted-foreground">Visible to everyone</p>
                  </div>
                  <Switch 
                    checked={formData.isPublic}
                    onCheckedChange={checked => setFormData({...formData, isPublic: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show on Registration</Label>
                    <p className="text-sm text-muted-foreground">List in registration form</p>
                  </div>
                  <Switch 
                    checked={formData.showOnReg}
                    onCheckedChange={checked => setFormData({...formData, showOnReg: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Allow Pre-Reg</Label>
                    <p className="text-sm text-muted-foreground">Users can book seats</p>
                  </div>
                  <Switch 
                    checked={formData.allowPreReg}
                    onCheckedChange={checked => setFormData({...formData, allowPreReg: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { updateSystemSettings } from '@/app/actions/settings'
import { SystemSettings } from '@/lib/mock-service'

interface SettingsFormProps {
  initialSettings: SystemSettings
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await updateSystemSettings(formData)
      if (result.success) {
        toast.success('Settings updated successfully')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Settings update error:', error)
      toast.error('Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="eventTitle">Event Title</Label>
          <Input 
            id="eventTitle" 
            name="eventTitle" 
            defaultValue={initialSettings.eventTitle} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="eventSubtitle">Event Subtitle</Label>
          <Textarea 
            id="eventSubtitle" 
            name="eventSubtitle" 
            defaultValue={initialSettings.eventSubtitle} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="siteUrl">Site URL</Label>
          <Input 
            id="siteUrl" 
            name="siteUrl" 
            type="url"
            defaultValue={initialSettings.siteUrl} 
            required 
          />
          <p className="text-sm text-muted-foreground">Used for invitation links.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="eventDate">Event Date</Label>
            <Input 
              id="eventDate" 
              name="eventDate" 
              type="date"
              defaultValue={initialSettings.eventDate ? new Date(initialSettings.eventDate).toISOString().split('T')[0] : ''} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cutoffDate">Exhibitor Edit Cutoff</Label>
            <Input 
              id="cutoffDate" 
              name="cutoffDate" 
              type="date"
              defaultValue={initialSettings.cutoffDate ? new Date(initialSettings.cutoffDate).toISOString().split('T')[0] : ''} 
              required 
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Save className="mr-2 h-4 w-4" />
        Save Settings
      </Button>
    </form>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createExhibitor, updateExhibitor } from '@/app/actions/exhibitor'
import { getEvents, type Event } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Store, Shield, User, Mail, MapPin, Ticket, Globe, Phone, Printer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { type Exhibitor } from '@/app/actions/exhibitor'

const exhibitorSchema = z.object({
  eventId: z.string().min(1, 'Event is required'),
  companyName: z.string().min(2, 'Company name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().optional(),
  boothNo: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  fax: z.string().optional(),
  website: z.string().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  quota: z.coerce.number().min(0, 'Quota must be 0 or greater'),
  overQuota: z.coerce.number().min(0, 'Over quota must be 0 or greater'),
})

type ExhibitorFormValues = z.infer<typeof exhibitorSchema>

interface ExhibitorFormProps {
  initialData?: Exhibitor
  projectId: string
}

export function ExhibitorForm({ initialData, projectId }: Readonly<ExhibitorFormProps>) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    async function loadEvents() {
      const result = await getEvents(projectId)
      if (result.success && result.events) {
        setEvents(result.events.filter(e => e.is_active))
      }
    }
    loadEvents()
  }, [projectId])

  const defaultValues: Partial<ExhibitorFormValues> = initialData
    ? {
        eventId: initialData.eventId || '',
        companyName: initialData.companyName,
        username: initialData.username || '',
        password: '', // Don't populate password on edit
        boothNo: initialData.boothNo || '',
        contactPerson: initialData.contactPerson || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        fax: initialData.fax || '',
        website: initialData.website || '',
        address: initialData.address || '',
        city: initialData.city || '',
        province: initialData.province || '',
        country: initialData.country || '',
        postalCode: initialData.postalCode || '',
        quota: initialData.quota,
        overQuota: initialData.overQuota,
      }
    : {
        eventId: '',
        companyName: '',
        username: '',
        password: '',
        boothNo: '',
        contactPerson: '',
        email: '',
        phone: '',
        fax: '',
        website: '',
        address: '',
        city: '',
        province: '',
        country: '',
        postalCode: '',
        quota: 0,
        overQuota: 0,
      }

  const form = useForm<ExhibitorFormValues>({
    resolver: zodResolver(exhibitorSchema) as any,
    defaultValues,
  })

  async function onSubmit(data: ExhibitorFormValues) {
    setLoading(true)
    
    // Payload now correctly maps directly via the new actions
    const payload = {
      ...data,
      projectId, // Not required by API body, but let's conform
    }

    let result
    if (initialData) {
      result = await updateExhibitor(projectId, initialData.id, payload as any)
    } else {
      result = await createExhibitor(projectId, payload as any)
    }

    if (result.success) {
      toast.success(initialData ? 'Exhibitor updated successfully' : 'Exhibitor created successfully')
      router.push(`/admin/exhibitors?projectId=${projectId}`)
      router.refresh()
    } else {
      toast.error(result.error || 'Something went wrong')
    }
    setLoading(false)
  }

  function fillMockData() {
    form.reset({
      eventId: events[0]?.event_uuid || '',
      companyName: 'Global Tech Solutions',
      username: `GT-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      password: 'password123',
      boothNo: 'B-205',
      contactPerson: 'Alice Smith',
      email: 'alice@globaltech.com',
      phone: '+66 81 234 5678',
      fax: '+66 2 123 4567',
      website: 'https://globaltech-solutions.example.com',
      address: '123 Innovation Park, Rama IV Rd',
      city: 'Bangkok',
      province: 'Bangkok',
      country: 'Thailand',
      postalCode: '10330',
      quota: 5,
      overQuota: 2,
    })
    toast.success('Mock data filled')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Company Profile Card */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Store className="size-4" />
                </div>
                <CardTitle className="text-lg">Company Profile</CardTitle>
              </div>
              <CardDescription>Basic information about the exhibitor.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="eventId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Assignment</FormLabel>
                    <Select disabled={!!initialData} onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {events.map(e => (
                          <SelectItem key={e.event_uuid} value={e.event_uuid}>
                            {e.event_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The event this exhibitor belongs to (cannot be changed after creation).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input placeholder="https://example.com" className="h-11 pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Account Access Card */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Shield className="size-4" />
                </div>
                <CardTitle className="text-lg">Account Access</CardTitle>
              </div>
              <CardDescription>Credentials for the exhibitor portal.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username (Registration ID)</FormLabel>
                    <FormControl>
                      <Input placeholder="REG-001" className="h-11" {...field} />
                    </FormControl>
                    <FormDescription className="text-[11px]">Unique identifier for login.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="••••••••" className="h-11" {...field} />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      {initialData ? "Leave blank to keep existing." : "Initial password for login."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className="md:col-span-2 shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Mail className="size-4" />
                </div>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </div>
              <CardDescription>Primary contact details for communication.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Representative</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                          <Input placeholder="John Doe" className="h-11 pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                          <Input type="email" placeholder="john@example.com" className="h-11 pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile / Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                          <Input placeholder="+1 234 567 890" className="h-11 pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fax (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Printer className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                          <Input placeholder="+1 234 567 899" className="h-11 pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Details Card */}
          <Card className="md:col-span-2 shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </div>
                <CardTitle className="text-lg">Location Details</CardTitle>
              </div>
              <CardDescription>Physical address for shipping and documentation.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Export Lane, Suite 400" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province / State</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="USA" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Allocation Card */}
          <Card className="md:col-span-2 shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Ticket className="size-4" />
                </div>
                <CardTitle className="text-lg">Booth & Staff Allocation</CardTitle>
              </div>
              <CardDescription>Configure event logistics and limits.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="boothNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booth Number</FormLabel>
                      <FormControl>
                        <Input placeholder="A-101" className="h-11 bg-white" {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px]">Primary booth location.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quota</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" className="h-11 bg-white" {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px]">Free staff badges allowed.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="overQuota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Over-Quota</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" className="h-11 bg-white" {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px]">Paid staff badges limit.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            {!initialData && (
              <Button type="button" variant="outline" onClick={fillMockData}>
                Fill Mock Data
              </Button>
            )}
          </div>
          <Button type="submit" size="lg" className="min-w-[200px] h-12 shadow-md hover:shadow-lg transition-all" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Please Wait...
              </>
            ) : (() => {
              if (initialData) return 'Save Changes'
              return 'Create Exhibitor Account'
            })()}
          </Button>
        </div>
      </form>
    </Form>
  )
}

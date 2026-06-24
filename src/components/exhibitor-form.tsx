'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createExhibitor, updateExhibitor, uploadExhibitorImage } from '@/app/actions/exhibitor'
import { createOrganizerExhibitor, updateOrganizerExhibitor, getOrganizerEvents } from '@/app/actions/organizer-exhibitor'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ImagePlus, Loader2, Store, User, Mail, MapPin, Ticket, Globe, Phone, Printer, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { type Exhibitor } from '@/app/actions/exhibitor'
import { CountrySelector } from '@/components/CountrySelector'

const exhibitorSchema = z.object({
  eventId: z.string().min(1, 'Event is required'),
  companyName: z.string().min(2, 'Company name is required'),
  username: z.string().optional(),
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
  companyProfile: z.string(),
  companyLogo: z.string(),
  companyLogoFile: z.custom<File>().optional(),
  productHighlights: z.array(z.object({
    description: z.string(),
    url: z.string(),
    file: z.custom<File>().optional(),
  }).refine(highlight => highlight.url || highlight.file, 'Image is required')),
})

type ExhibitorFormValues = z.infer<typeof exhibitorSchema>

interface ExhibitorFormProps {
  initialData?: Exhibitor
  projectId: string
  userRole?: string | null
}

export function ExhibitorForm({ initialData, projectId, userRole }: Readonly<ExhibitorFormProps>) {
  const isOrganizer = userRole === 'ORGANIZER'
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    async function loadEvents() {
      let result
      if (isOrganizer) {
        result = await getOrganizerEvents()
      } else {
        result = await getEvents(projectId)
      }
      if (result.success && result.events) {
        setEvents(result.events.filter((e: Event) => e.is_active))
      }
    }
    loadEvents()
  }, [projectId, isOrganizer])

  const defaultValues: Partial<ExhibitorFormValues> = initialData
    ? {
        eventId: initialData.eventId || '',
        companyName: initialData.companyName,
        username: initialData.username || '',
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
        companyProfile: initialData.companyProfile || '',
        companyLogo: initialData.companyLogo || '',
        companyLogoFile: undefined,
        productHighlights: initialData.productHighlights || [],
      }
    : {
        eventId: '',
        companyName: '',
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
        companyProfile: '',
        companyLogo: '',
        companyLogoFile: undefined,
        productHighlights: [],
      }

  const form = useForm<ExhibitorFormValues>({
    resolver: zodResolver(exhibitorSchema) as any,
    defaultValues,
  })
  const { fields: productHighlights, append, remove } = useFieldArray({
    control: form.control,
    name: 'productHighlights',
  })

  async function onSubmit(data: ExhibitorFormValues) {
    setLoading(true)

    let companyLogoUpload: Awaited<ReturnType<typeof uploadExhibitorImage>> = { success: true, imageUrl: data.companyLogo }
    if (data.companyLogoFile) {
      const formData = new FormData()
      formData.append('file', data.companyLogoFile)
      companyLogoUpload = await uploadExhibitorImage(projectId, formData)
    }
    if (!companyLogoUpload.success) {
      toast.error(companyLogoUpload.error)
      setLoading(false)
      return
    }

    const uploads = await Promise.all(data.productHighlights.map(async highlight => {
      if (!highlight.file) return { success: true as const, imageUrl: highlight.url }
      const formData = new FormData()
      formData.append('file', highlight.file)
      return uploadExhibitorImage(projectId, formData)
    }))
    const failedUpload = uploads.find(result => !result.success)
    if (failedUpload) {
      toast.error(failedUpload.error)
      setLoading(false)
      return
    }
    const { companyLogoFile, ...submitData } = data
    
    // Payload now correctly maps directly via the new actions
    const payload = {
      ...submitData,
      companyLogo: companyLogoUpload.imageUrl || data.companyLogo,
      productHighlights: submitData.productHighlights.map((highlight, index) => ({
        description: highlight.description,
        url: uploads[index].imageUrl || highlight.url,
      })),
      projectId, // Not required by API body, but let's conform
    }

    let result
    if (isOrganizer) {
      if (initialData) {
        result = await updateOrganizerExhibitor(initialData.id, payload)
      } else {
        result = await createOrganizerExhibitor(payload)
      }
    } else {
      if (initialData) {
        result = await updateExhibitor(projectId, initialData.id, payload)
      } else {
        result = await createExhibitor(projectId, payload)
      }
    }

    if (result.success) {
      toast.success(initialData ? 'Exhibitor updated successfully' : 'Exhibitor created successfully')
      router.push(isOrganizer ? '/admin/exhibitors' : `/admin/exhibitors?projectId=${projectId}`)
      router.refresh()
    } else {
      toast.error(result.error || 'Something went wrong')
    }
    setLoading(false)
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Company Profile Card */}
          <Card className="md:col-span-2 shadow-sm border-slate-200 overflow-hidden">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <FormItem className="md:col-span-2">
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
                <FormField
                  control={form.control}
                  name="companyLogoFile"
                  render={() => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Company Logo</FormLabel>
                      <FormControl>
                        <Input type="file" accept="image/*" onChange={event => form.setValue('companyLogoFile', event.target.files?.[0], { shouldValidate: true })} />
                      </FormControl>
                      {form.watch('companyLogo') && <FormDescription className="truncate">{form.watch('companyLogo')}</FormDescription>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyProfile"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Company Profile</FormLabel>
                      <FormControl><Textarea placeholder="Describe the company" rows={5} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><ImagePlus className="size-4" /></div>
                <CardTitle className="text-lg">Product Highlights</CardTitle>
              </div>
              <CardDescription>Add product descriptions and images.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {productHighlights.map((highlight, index) => (
                <div key={highlight.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_auto]">
                  <FormField
                    control={form.control}
                    name={`productHighlights.${index}.description`}
                    render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>}
                  />
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <Input type="file" accept="image/*" onChange={event => form.setValue(`productHighlights.${index}.file`, event.target.files?.[0], { shouldValidate: true })} />
                    {form.watch(`productHighlights.${index}.url`) && <FormDescription className="truncate">{form.watch(`productHighlights.${index}.url`)}</FormDescription>}
                    <FormMessage>{form.formState.errors.productHighlights?.[index]?.root?.message}</FormMessage>
                  </FormItem>
                  <Button type="button" variant="ghost" size="icon" className="self-end" onClick={() => remove(index)} aria-label="Remove product highlight"><Trash2 className="size-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => append({ description: '', url: '' })}><Plus className="mr-2 size-4" />Add Highlight</Button>
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
                    <FormItem className="flex flex-col mt-2">
                      <FormLabel className="mb-[2px]">Country</FormLabel>
                      <CountrySelector 
                        value={field.value || ''} 
                        onChange={field.onChange} 
                      />
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

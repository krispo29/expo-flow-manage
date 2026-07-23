'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createExhibitor, updateExhibitor, presignExhibitorImage, getExhibitorBusinessMatchingCategories } from '@/app/actions/exhibitor'
import { createOrganizerExhibitor, updateOrganizerExhibitor, getOrganizerEvents, getOrganizerExhibitorBusinessMatchingCategories } from '@/app/actions/organizer-exhibitor'
import { getProjectDetail } from '@/app/actions/project'
import { getEvents, type Event } from '@/app/actions/settings'
import { isBusinessMatchingEnabled } from '@/lib/features'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { BriefcaseBusiness, ImagePlus, Loader2, Store, User, Mail, MapPin, Ticket, Globe, Phone, Printer, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { type BusinessMatchingCategory, type Exhibitor } from '@/app/actions/exhibitor'
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
  categoryUUIDs: z.array(z.string()),
})

type ExhibitorFormValues = z.infer<typeof exhibitorSchema>

interface ExhibitorFormProps {
  initialData?: Exhibitor
  projectId: string
  userRole?: string | null
}

function ImagePreviewLink({ url, file, alt }: Readonly<{ url?: string; file?: File; alt: string }>) {
  const [previewUrl, setPreviewUrl] = useState(url || '')

  useEffect(() => {
    if (!file) {
      setPreviewUrl(url || '')
      return
    }
    const nextUrl = URL.createObjectURL(file)
    setPreviewUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [file, url])

  if (!previewUrl) return null

  return (
    <a href={previewUrl} target="_blank" rel="noreferrer" className="group mt-2 flex items-center gap-3 rounded-xl border bg-slate-50 p-2 transition hover:border-primary/40 hover:bg-primary/5">
      <img src={previewUrl} alt={alt} className="size-14 rounded-lg border bg-white object-cover" />
      <span className="min-w-0 text-sm text-slate-600">
        <span className="block font-medium text-slate-900">Click to preview image</span>
        <span className="block truncate group-hover:text-primary">{previewUrl}</span>
      </span>
    </a>
  )
}

function resizeImage(file: File, maxWidth = 2048, quality = 0.85) {
  return new Promise<Blob>((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Failed to resize image')), file.type, quality)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Invalid image file'))
    }
    img.src = url
  })
}

export function ExhibitorForm({ initialData, projectId, userRole }: Readonly<ExhibitorFormProps>) {
  const isOrganizer = userRole === 'ORGANIZER'
  const showBusinessMatchingCategories = isBusinessMatchingEnabled(projectId)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [showCompanyProfileFields, setShowCompanyProfileFields] = useState(false)
  const [businessMatchingCategories, setBusinessMatchingCategories] = useState<BusinessMatchingCategory[]>([])
  const [categorySearch, setCategorySearch] = useState('')
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [categoriesReady, setCategoriesReady] = useState(false)

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

  useEffect(() => {
    async function loadProjectSettings() {
      const result = await getProjectDetail(projectId || undefined)
      if (result.success && result.project) {
        const exhibitorPortal = result.project.settings?.exhibitor_portal
        const portalSettings =
          !!exhibitorPortal && typeof exhibitorPortal === 'object' && !Array.isArray(exhibitorPortal)
            ? exhibitorPortal as { is_show_company_profile_fields?: unknown }
            : null
        setShowCompanyProfileFields(
          portalSettings?.is_show_company_profile_fields === true
        )
      }
    }
    loadProjectSettings()
  }, [projectId])

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
        categoryUUIDs: [],
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
        categoryUUIDs: [],
      }

  const form = useForm<ExhibitorFormValues>({
    resolver: zodResolver(exhibitorSchema) as any,
    defaultValues,
  })
  const { fields: productHighlights, append, remove } = useFieldArray({
    control: form.control,
    name: 'productHighlights',
  })
  const eventId = form.watch('eventId')
  const categoryUUIDs = form.watch('categoryUUIDs')
  const selectedCategories = businessMatchingCategories.filter(category =>
    categoryUUIDs.includes(category.category_uuid)
  )

  function focusCategory(categoryUuid: string) {
    setCategorySearch('')
    requestAnimationFrame(() => {
      document
        .getElementById(`business-matching-category-${categoryUuid}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  useEffect(() => {
    if (!showBusinessMatchingCategories) return

    if (!eventId) {
      setBusinessMatchingCategories([])
      form.setValue('categoryUUIDs', [])
      setCategoriesReady(false)
      return
    }

    let active = true
    setLoadingCategories(true)
    setCategoriesReady(false)
    const loadCategories = isOrganizer
      ? getOrganizerExhibitorBusinessMatchingCategories(eventId, initialData?.id)
      : getExhibitorBusinessMatchingCategories(projectId, eventId, initialData?.id)

    loadCategories.then(result => {
      if (!active) return
      if (!result.success) {
        setBusinessMatchingCategories([])
        setCategoriesReady(false)
        toast.error(result.error)
        return
      }
      const available = new Set(result.categories.map(category => category.category_uuid))
      setBusinessMatchingCategories(result.categories)
      form.setValue(
        'categoryUUIDs',
        result.selectedCategoryUUIDs.filter(categoryUUID => available.has(categoryUUID)),
        { shouldDirty: false }
      )
      setCategoriesReady(true)
    }).finally(() => {
      if (active) setLoadingCategories(false)
    })

    return () => { active = false }
  }, [eventId, form, initialData?.id, isOrganizer, projectId, showBusinessMatchingCategories])

  async function onSubmit(data: ExhibitorFormValues) {
    setLoading(true)

    const uploadImage = async (file?: File, existingUrl = '') => {
      try {
        if (!file) return { success: true as const, imageUrl: existingUrl }
        const presign = await presignExhibitorImage(projectId, { filename: file.name, contentType: file.type })
        if (!presign.success || !('uploadUrl' in presign) || !('fileUrl' in presign)) {
          return { success: false as const, error: 'error' in presign ? presign.error : 'Failed to get signed upload URL' }
        }
        const response = await fetch(presign.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
            'x-goog-acl': 'public-read',
          },
          body: await resizeImage(file),
        })
        return response.ok
          ? { success: true as const, imageUrl: presign.fileUrl }
          : { success: false as const, error: 'Failed to upload image to storage' }
      } catch (error) {
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to upload image' }
      }
    }

    const [companyLogoUpload, uploads] = showCompanyProfileFields
      ? await Promise.all([
          uploadImage(data.companyLogoFile, data.companyLogo),
          Promise.all(data.productHighlights.map(highlight => uploadImage(highlight.file, highlight.url))),
        ])
      : [{ success: true as const, imageUrl: '' }, []]
    if (!companyLogoUpload.success) {
      toast.error(companyLogoUpload.error)
      setLoading(false)
      return
    }
    const failedUpload = uploads.find(result => !result.success)
    if (failedUpload) {
      toast.error(failedUpload.error)
      setLoading(false)
      return
    }
    const { companyLogoFile, categoryUUIDs, ...submitData } = data
    
    // Payload now correctly maps directly via the new actions
    const payload = {
      ...submitData,
      projectId, // Not required by API body, but let's conform
      ...(categoriesReady ? { categoryUUIDs } : {}),
      ...(showCompanyProfileFields
        ? {
            companyLogo: companyLogoUpload.imageUrl || data.companyLogo,
            companyProfile: data.companyProfile,
            productHighlights: submitData.productHighlights.map((highlight, index) => ({
              description: highlight.description,
              url: uploads[index].imageUrl || highlight.url,
            })),
          }
        : {}),
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
      router.push(isOrganizer ? '/organizer/exhibitors' : `/admin/exhibitors?projectId=${projectId}`)
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
                {showCompanyProfileFields && (
                  <>
                    <FormField
                      control={form.control}
                      name="companyLogoFile"
                      render={() => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Company Logo</FormLabel>
                          <FormControl>
                            <Input type="file" accept="image/*" onChange={event => form.setValue('companyLogoFile', event.target.files?.[0], { shouldValidate: true })} />
                          </FormControl>
                          <FormDescription>
                            Note:<br />
                            - Format &amp; Size: JPG or PNG only (Max. 2 MB)<br />
                            - Company Logo: 1:1 ratio recommended (e.g., 512 &#215; 512 px)
                          </FormDescription>
                          <ImagePreviewLink url={form.watch('companyLogo')} file={form.watch('companyLogoFile')} alt="Company logo preview" />
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
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {showCompanyProfileFields && (
            <Card className="md:col-span-2 shadow-sm border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><ImagePlus className="size-4" /></div>
                  <CardTitle className="text-lg">Product Highlights</CardTitle>
                </div>
                <CardDescription>Add product descriptions and images.</CardDescription>
                <FormDescription>
                  Note:<br />
                  - Format &amp; Size: JPG or PNG only (Max. 2 MB)<br />
                  - Product Highlight: Landscape 16:9 ratio recommended (e.g., 1280 &#215; 720 px / 1920 &#215; 1080 px)
                </FormDescription>
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
                      <ImagePreviewLink url={form.watch(`productHighlights.${index}.url`)} file={form.watch(`productHighlights.${index}.file`)} alt={`Product highlight ${index + 1} preview`} />
                      <FormMessage>{form.formState.errors.productHighlights?.[index]?.root?.message}</FormMessage>
                    </FormItem>
                    <Button type="button" variant="ghost" size="icon" className="self-end" onClick={() => remove(index)} aria-label="Remove product highlight"><Trash2 className="size-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ description: '', url: '' })}><Plus className="mr-2 size-4" />Add Highlight</Button>
              </CardContent>
            </Card>
          )}

          {showBusinessMatchingCategories && <Card className="md:col-span-2 shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><BriefcaseBusiness className="size-4" /></div>
                <CardTitle className="text-lg">Business Matching Categories</CardTitle>
              </div>
              <CardDescription>Select any main or sub-profile that describes the exhibitor. This field is optional.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="categoryUUIDs"
                render={({ field }) => (
                  <FormItem>
                    {selectedCategories.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-2 text-xs font-medium text-slate-500">Selected categories</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCategories.map(category => (
                            <button
                              key={category.category_uuid}
                              type="button"
                              onClick={() => focusCategory(category.category_uuid)}
                              className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <Input
                      value={categorySearch}
                      onChange={event => setCategorySearch(event.target.value)}
                      placeholder="Search category..."
                      disabled={!eventId || loadingCategories}
                      className="mb-3"
                    />
                    <div className="max-h-80 overflow-y-auto rounded-lg border p-3">
                      {loadingCategories ? (
                        <div className="flex items-center justify-center py-8 text-sm text-slate-500"><Loader2 className="mr-2 size-4 animate-spin" />Loading categories...</div>
                      ) : businessMatchingCategories.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-500">{eventId ? 'No categories available for this event.' : 'Select an event to load categories.'}</p>
                      ) : (
                        businessMatchingCategories
                          .filter(category => category.name.toLowerCase().includes(categorySearch.trim().toLowerCase()))
                          .map(category => {
                            const isMainProfile = !category.parent_uuid
                            return (
                              <label
                                key={category.category_uuid}
                                id={`business-matching-category-${category.category_uuid}`}
                                className={`flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-50 ${isMainProfile ? 'font-semibold' : 'ml-7'}`}
                              >
                                <Checkbox
                                  checked={field.value.includes(category.category_uuid)}
                                  onCheckedChange={checked => field.onChange(
                                    checked
                                      ? [...field.value, category.category_uuid]
                                      : field.value.filter(categoryUUID => categoryUUID !== category.category_uuid)
                                  )}
                                />
                                <span>{category.name}</span>
                                <span className="ml-auto text-xs font-normal text-slate-400">{category.event_code.split('_').pop()}</span>
                              </label>
                            )
                          })
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>}

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

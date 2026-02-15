'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod' // Use namespace import for Zod to avoid compatibility issues
import { createExhibitor, updateExhibitor } from '@/app/actions/exhibitor'
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
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const exhibitorSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  registrationId: z.string().optional(),
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
  initialData?: any
  projectId: string
}

export function ExhibitorForm({ initialData, projectId }: ExhibitorFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const defaultValues: Partial<ExhibitorFormValues> = initialData
    ? {
        companyName: initialData.companyName,
        registrationId: initialData.registrationId || '',
        password: initialData.password || '',
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
        companyName: '',
        registrationId: '',
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
    
    // Clean up empty strings to null or undefined if needed, but Prisma handles optional strings well usually.
    // However, unique constraints might key off empty strings, so careful.
    
    const payload = {
      ...data,
      name: data.companyName, // Map companyName to name as required by interface
      projectId,
      boothNumber: data.boothNo || '', // Map boothNo to boothNumber
      contactName: data.contactPerson || '',
      email: data.email || '',
      phone: data.phone || '',
    }

    let result
    if (initialData) {
      result = await updateExhibitor(initialData.id, payload as any)
    } else {
      result = await createExhibitor(payload as any)
    }

    if (result.success) {
      toast.success(initialData ? 'Exhibitor updated' : 'Exhibitor created')
      router.push(`/admin/exhibitors?projectId=${projectId}`)
      router.refresh()
    } else {
      toast.error(result.error || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
            <FormField
              control={form.control}
              name="registrationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="REG-001" {...field} />
                  </FormControl>
                  <FormDescription>Unique ID used for login.</FormDescription>
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
                    <Input type="text" placeholder="Secret123" {...field} />
                  </FormControl>
                  <FormDescription>Leave blank to keep existing password (if editing).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
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
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1 234 567 890" {...field} />
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
                <FormLabel>Fax</FormLabel>
                <FormControl>
                  <Input placeholder="+1 234 567 899" {...field} />
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
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Address Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
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
                    <Input placeholder="New York" {...field} />
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
                  <FormLabel>Province/State</FormLabel>
                  <FormControl>
                    <Input placeholder="NY" {...field} />
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
                    <Input placeholder="USA" {...field} />
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
                    <Input placeholder="10001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Booth & Staff Allocation</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="boothNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booth Number</FormLabel>
                  <FormControl>
                    <Input placeholder="A-101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff Quota</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormDescription>Number of staff allowed.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="overQuota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Over Quota</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormDescription>Additional staff allowed beyond quota.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Update Exhibitor' : 'Create Exhibitor'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

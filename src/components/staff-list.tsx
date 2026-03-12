'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2, Plus, Search, Loader2, Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { 
  createProjectStaff, updateProjectStaff, deleteProjectStaff, printProjectStaffBadge, getStaffTypes
} from '@/app/actions/staff'
import { toast } from 'sonner'
import { printBadge } from '@/utils/print-badge'

export interface Staff {
  staff_uuid: string
  title: string
  first_name: string
  last_name: string
  company_name: string
  staff_code: string
  staff_type_code: string
  is_active: boolean
  created_at: string
  updated_at: string | null
}

interface StaffResponse {
  items: Staff[]
  total_items: number
  page: number
  limit: number
  total_pages: number
}

interface StaffListProps {
  initialData: StaffResponse
  projectId: string
}

export function StaffList({ 
  initialData, 
  projectId, 
}: StaffListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null)
  
  const formRef = useRef<HTMLFormElement>(null)
  
  const [staffType, setStaffType] = useState('ST')
  const [title, setTitle] = useState('Mr.')
  
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('keyword') || '')
  
  // Staff Types state
  const [staffTypes, setStaffTypes] = useState<{type_code: string, type_name: string}[]>([])

  useEffect(() => {
    getStaffTypes(projectId).then(res => {
      if (res.success && res.data) {
        setStaffTypes(res.data)
      }
    })
  }, [projectId])


  const onPrintClick = async (p: Staff) => {
    toast.promise(printProjectStaffBadge(projectId, p.staff_uuid), {
      loading: 'Printing badge...',
      success: (result) => {
        if (result.success && result.data) {
          const data = result.data
          try {
            printBadge({
               firstName: data.first_name || '',
               lastName: data.last_name || '',
               companyName: data.company_name || '',
               country: 'THAILAND',
               registrationCode: data.staff_code || '',
               category: data.staff_type_code || 'STAFF',
            })
          } catch (e) {
            console.error("Local print failed", e)
          }
          return 'Badge print triggered'
        }
        throw new Error(result.error || 'Failed to print badge')
      },
      error: (err) => err instanceof Error ? err.message : 'Failed to print badge'
    })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentKeyword = searchParams.get('keyword') || ''
      if (searchQuery !== currentKeyword) {
        const params = new URLSearchParams(searchParams.toString())
        if (searchQuery) {
          params.set('keyword', searchQuery)
        } else {
          params.delete('keyword')
        }
        params.set('page', '1') // Reset to first page
        router.push(`${pathname}?${params.toString()}`)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, pathname, router, searchParams])

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  function openCreate() {
    setSelectedStaff(null)
    setStaffType('ST')
    setTitle('Mr.')
    setIsDialogOpen(true)
  }

  function openEdit(p: Staff) {
    setSelectedStaff(p)
    const normalizedType = p.staff_type_code === 'ONSITE' ? 'ST' : p.staff_type_code === 'ORGANIZER' ? 'OR' : (p.staff_type_code || 'ST')
    setStaffType(normalizedType)
    setTitle(p.title || 'Mr.')
    setIsDialogOpen(true)
  }

  function handleDelete(staffUuid: string) {
    setStaffToDelete(staffUuid)
    setIsDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!staffToDelete) return
    
    setLoading(true)
    const result = await deleteProjectStaff(projectId, staffToDelete)
    setLoading(false)
    setIsDeleteDialogOpen(false)
    setStaffToDelete(null)

    if (result.success) {
      toast.success('Staff deleted')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to delete staff')
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const commonData = {
      title: formData.get('title'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      company_name: formData.get('company_name'),
    }

    let result
    if (selectedStaff) {
      result = await updateProjectStaff(projectId, selectedStaff.staff_uuid, commonData)
    } else {
      const data = {
        ...commonData,
        staff_type_code: formData.get('staff_type_code'),
      }
      result = await createProjectStaff(projectId, data)
    }

    setLoading(false)
    if (result.success) {
      toast.success(selectedStaff ? 'Staff updated' : 'Staff created')
      setIsDialogOpen(false)
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to save staff')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, company, code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background focus-visible:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-background">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No staff members found.
                  </TableCell>
                </TableRow>
              ) : (
                initialData.items.map((p) => (
                  <TableRow key={p.staff_uuid}>
                    <TableCell className="font-medium whitespace-nowrap">{p.staff_code}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full bg-secondary text-xs">{p.staff_type_code}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {p.title} {p.first_name} {p.last_name}
                    </TableCell>
                    <TableCell>{p.company_name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                         <Button variant="outline" size="icon" onClick={() => onPrintClick(p)} title="Print Badge">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.staff_uuid)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
        {initialData.total_items > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-muted/5">
            <div className="text-sm text-muted-foreground italic">
              Showing <span className="font-medium text-foreground">{(initialData.page - 1) * initialData.limit + 1}</span> to{' '}
              <span className="font-medium text-foreground">{Math.min(initialData.page * initialData.limit, initialData.total_items)}</span> of{' '}
              <span className="font-medium text-foreground">{initialData.total_items}</span> staff
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(initialData.page - 1)}
                disabled={initialData.page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1 min-w-[3rem] justify-center">
                <span className="text-sm font-medium">{initialData.page}</span>
                <span className="text-sm text-muted-foreground mx-0.5">/</span>
                <span className="text-sm text-muted-foreground">{initialData.total_pages || 1}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(initialData.page + 1)}
                disabled={initialData.page === initialData.total_pages || initialData.total_pages === 0}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedStaff ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="staff_type_code">Staff Type <span className="text-red-500">*</span></Label>
              <Select name="staff_type_code" value={staffType} onValueChange={setStaffType} required disabled={!!selectedStaff}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staffTypes.length > 0 ? (
                    staffTypes.map((t) => (
                      <SelectItem key={t.type_code} value={t.type_code}>
                        {t.type_name} ({t.type_code})
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="ST">Onsite (ST)</SelectItem>
                      <SelectItem value="OR">Organizer (OR)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Select name="title" value={title} onValueChange={setTitle} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', title])).filter(Boolean).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
                <Input id="first_name" name="first_name" defaultValue={selectedStaff?.first_name || ''} required />
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
                <Input id="last_name" name="last_name" defaultValue={selectedStaff?.last_name || ''} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name <span className="text-red-500">*</span></Label>
              <Input id="company_name" name="company_name" defaultValue={selectedStaff?.company_name || ''} required />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedStaff ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this staff member? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}





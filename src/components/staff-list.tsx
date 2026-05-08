'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
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
import { Checkbox } from "@/components/ui/checkbox"
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2, Plus, Search, Loader2, Printer, ChevronLeft, ChevronRight, Building2, ShieldCheck, Power, Filter, X, Copy, Check } from 'lucide-react'
import {
  createProjectStaff, updateProjectStaff, deleteProjectStaff, printProjectStaffBadge, getStaffTypes
} from '@/app/actions/staff'
import { countries } from '@/lib/countries'
import { toast } from 'sonner'
import { printBadge } from '@/utils/print-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CountrySelector } from "./CountrySelector"
import { copyTextToClipboard } from '@/lib/clipboard'

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
  residence_country?: string
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
  const [copiedStaffId, setCopiedStaffId] = useState<string | null>(null)
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set())

  const formRef = useRef<HTMLFormElement>(null)

  const [staffType, setStaffType] = useState('ST')
  const [title, setTitle] = useState('Mr.')
  const [residenceCountry, setResidenceCountry] = useState('TH')

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('keyword') || '')

  // Staff Types state
  const [staffTypes, setStaffTypes] = useState<{type_code: string, type_name: string}[]>([])

  // Column filter state
  const [showFilters, setShowFilters] = useState(false)
  const [columnFilters, setColumnFilters] = useState({
    staffCode: '',
    type: '',
    name: '',
    company: '',
    isActive: 'all'
  })

  useEffect(() => {
    getStaffTypes(projectId).then(res => {
      if (res.success && res.data) {
        setStaffTypes(res.data)
      }
    })
  }, [projectId])

  const copyStaffCode = async (text: string, id: string) => {
    if (!text) return

    try {
      await copyTextToClipboard(text)
      setCopiedStaffId(id)
      toast.success('Code copied to clipboard')
      setTimeout(() => setCopiedStaffId(null), 2000)
    } catch (error) {
      console.error('Failed to copy staff code:', error)
      toast.error('Failed to copy code')
    }
  }

  const copySelectedCodes = async () => {
    const codes = selectedStaffMembers.map(staff => staff.staff_code).filter(Boolean)

    if (codes.length === 0) {
      toast.error('Select at least one staff code')
      return
    }

    try {
      await copyTextToClipboard(codes.join('\n'))
      toast.success(`Copied ${codes.length} staff code${codes.length === 1 ? '' : 's'}`)
    } catch (error) {
      console.error('Failed to copy selected staff codes:', error)
      toast.error('Failed to copy selected codes')
    }
  }

  const toggleStaffSelection = (staffUuid: string, checked: boolean | string) => {
    setSelectedStaffIds(prev => {
      const next = new Set(prev)
      if (checked === true) {
        next.add(staffUuid)
      } else {
        next.delete(staffUuid)
      }
      return next
    })
  }

  const toggleCurrentPageSelection = (checked: boolean | string) => {
    setSelectedStaffIds(prev => {
      const next = new Set(prev)
      currentPageStaffIds.forEach(id => {
        if (checked === true) {
          next.add(id)
        } else {
          next.delete(id)
        }
      })
      return next
    })
  }

  const clearSelection = () => {
    setSelectedStaffIds(new Set())
  }

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
               country: data.residence_country || p.residence_country || 'THAILAND',
               registrationCode: data.staff_code || '',
               category: data.staff_type_code || 'STAFF',
               position: '',
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
    setResidenceCountry('TH')
    setIsDialogOpen(true)
  }

  function openEdit(p: Staff) {
    setSelectedStaff(p)
    const normalizedType = p.staff_type_code === 'ONSITE' ? 'ST' : p.staff_type_code === 'ORGANIZER' ? 'OR' : (p.staff_type_code || 'ST')
    setStaffType(normalizedType)
    setTitle(p.title || 'Mr.')
    
    // Map full name from API to country code for UI
    const countryCode = countries.find(c => c.name === p.residence_country)?.code || 'TH'
    setResidenceCountry(countryCode)
    
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
      staff_type_code: formData.get('staff_type_code'),
      // Map country code from UI to full name for API
      residence_country: countries.find(c => c.code === residenceCountry)?.name || 'Thailand',
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

  // Filter staff based on column filters
  const filteredStaff = useMemo(() => initialData.items.filter(staff => {
    const matchesCode = !columnFilters.staffCode ||
      (staff.staff_code && staff.staff_code.toLowerCase().includes(columnFilters.staffCode.toLowerCase()))

    const matchesType = !columnFilters.type || columnFilters.type === 'all' ||
      (staff.staff_type_code && staff.staff_type_code.toLowerCase().includes(columnFilters.type.toLowerCase()))

    const matchesName = !columnFilters.name ||
      ((staff.first_name && staff.first_name.toLowerCase().includes(columnFilters.name.toLowerCase())) ||
       (staff.last_name && staff.last_name.toLowerCase().includes(columnFilters.name.toLowerCase())) ||
       (staff.title && staff.title.toLowerCase().includes(columnFilters.name.toLowerCase())))

    const matchesCompany = !columnFilters.company ||
      (staff.company_name && staff.company_name.toLowerCase().includes(columnFilters.company.toLowerCase()))

    const matchesStatus = columnFilters.isActive === 'all' ||
      (columnFilters.isActive === 'active' && staff.is_active) ||
      (columnFilters.isActive === 'inactive' && !staff.is_active)

    return matchesCode && matchesType && matchesName && matchesCompany && matchesStatus
  }), [initialData.items, columnFilters])
  const selectedStaffMembers = initialData.items.filter(staff => selectedStaffIds.has(staff.staff_uuid) && staff.staff_code)
  const currentPageStaffIds = filteredStaff
    .filter(staff => staff.staff_code)
    .map(staff => staff.staff_uuid)
  const currentPageSelectedCount = currentPageStaffIds.filter(id => selectedStaffIds.has(id)).length
  const currentPageSelectionState =
    currentPageStaffIds.length > 0 && currentPageSelectedCount === currentPageStaffIds.length
      ? true
      : currentPageSelectedCount > 0
        ? 'indeterminate'
        : false

  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setColumnFilters({
      staffCode: '',
      type: '',
      name: '',
      company: '',
      isActive: 'all'
    })
    setSearchQuery('')
    setShowFilters(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-6">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-display">Staff List</CardTitle>
              <CardDescription className="font-medium">Monitoring real-time check-in events across all active zones.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search by name, company, code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-11 bg-white/5 border-white/10 rounded-2xl focus-visible:ring-primary/30 transition-all focus:bg-white/10"
                  />
                </div>
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="icon"
                  className={cn("h-11 w-11 rounded-2xl shrink-0 transition-all", showFilters ? "shadow-lg shadow-primary/20" : "bg-white/5 border-white/10")}
                  onClick={() => setShowFilters(!showFilters)}
                  title="Toggle Filters"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                {(showFilters || searchQuery || Object.values(columnFilters).some(v => v !== '' && v !== 'all')) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-2xl shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/10"
                    onClick={clearFilters}
                    title="Clear All Filters"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button onClick={openCreate} className="btn-aurora h-11 px-6 rounded-2xl font-bold shadow-lg shadow-primary/20 w-full sm:w-auto">
                <Plus className="h-5 w-5 mr-2" />
                Add Staff
              </Button>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-current-staff"
                  checked={currentPageSelectionState}
                  onCheckedChange={toggleCurrentPageSelection}
                  aria-label="Select staff on this page"
                  disabled={currentPageStaffIds.length === 0}
                />
                <Label htmlFor="select-current-staff" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Select page
                </Label>
              </div>
              <Badge variant="outline" className="border-white/10 bg-background/40 text-[10px] font-black uppercase tracking-widest">
                {selectedStaffMembers.length} selected
              </Badge>
              {currentPageSelectedCount > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                  {currentPageSelectedCount}/{currentPageStaffIds.length} on page
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedStaffMembers.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-xl bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500"
                  onClick={clearSelection}
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary"
                onClick={() => void copySelectedCodes()}
                disabled={selectedStaffMembers.length === 0}
              >
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copy Codes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {showFilters && (
            <div className="p-6 bg-primary/5 border-b border-white/5 md:hidden space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Staff Code</Label>
                  <Input
                    placeholder="Filter by code..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.staffCode}
                    onChange={e => handleColumnFilterChange('staffCode', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Type</Label>
                  <Input
                    placeholder="Filter by type..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.type}
                    onChange={e => handleColumnFilterChange('type', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Name</Label>
                  <Input
                    placeholder="Filter by name..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.name}
                    onChange={e => handleColumnFilterChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Company</Label>
                  <Input
                    placeholder="Filter by company..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.company}
                    onChange={e => handleColumnFilterChange('company', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Status</Label>
                  <Select value={columnFilters.isActive} onValueChange={v => handleColumnFilterChange('isActive', v)}>
                    <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-xl text-sm">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10 rounded-xl">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Mobile View: Cards */}
          <div className="md:hidden divide-y divide-white/5">
            {filteredStaff.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground italic font-medium">
                No staff members found.
              </div>
            ) : (
              filteredStaff.map((p) => (
                <div key={p.staff_uuid} className="p-6 space-y-4 hover:bg-white/5 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="flex min-w-0 items-start gap-3">
                      <Checkbox
                        className="mt-1 shrink-0"
                        checked={selectedStaffIds.has(p.staff_uuid)}
                        onCheckedChange={checked => toggleStaffSelection(p.staff_uuid, checked)}
                        aria-label={`Select staff code ${p.staff_code}`}
                      />
                      <div className="min-w-0 space-y-1.5">
                        <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                          {p.title} {p.first_name} {p.last_name}
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">{p.staff_code}</code>
                          {p.staff_code && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md hover:bg-white/10"
                              onClick={() => void copyStaffCode(p.staff_code, p.staff_uuid)}
                            >
                              {copiedStaffId === p.staff_uuid ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3 text-muted-foreground/60" />
                              )}
                            </Button>
                          )}
                          <Badge variant="secondary" className="bg-white/5 border-white/5 text-[9px] font-bold py-0">{p.staff_type_code}</Badge>
                        </div>
                      </div>
                    </div>
                    <Badge className={cn("rounded-full px-3 text-[10px] font-bold", p.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground/80 font-medium">
                    <Building2 className="h-4 w-4 shrink-0 text-primary/40" />
                    <span className="truncate">{p.company_name}</span>
                  </div>

                  {p.residence_country && (
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                      <img 
                        src={`https://flagcdn.com/${countries.find(c => c.name === p.residence_country)?.code.toLowerCase() || 'th'}.svg`} 
                        alt={p.residence_country} 
                        className="w-4 h-auto rounded-sm object-cover shadow-sm opacity-80"
                      />
                      <span>{p.residence_country}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pt-2">
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white/5 border-white/10 hover:bg-primary/10 hover:text-primary" onClick={() => onPrintClick(p)} title="Print Badge">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <div className="flex-1" />
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/10" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(p.staff_uuid)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-[52px] pl-6">
                    <Checkbox
                      checked={currentPageSelectionState}
                      onCheckedChange={toggleCurrentPageSelection}
                      aria-label="Select staff on this page"
                      disabled={currentPageStaffIds.length === 0}
                    />
                  </TableHead>
                  <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-widest">Code</TableHead>
                  <TableHead className="w-[100px] font-bold text-[10px] uppercase tracking-widest">Type</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Name</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Company</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Residence</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-6">Actions</TableHead>
                </TableRow>
                {showFilters && (
                  <TableRow className="hover:bg-transparent border-white/5 bg-primary/5 animate-in fade-in duration-500">
                    <TableHead className="pl-6 py-2" />
                    <TableHead className="py-2">
                      <Input
                        placeholder="Filter code..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.staffCode}
                        onChange={e => handleColumnFilterChange('staffCode', e.target.value)}
                      />
                    </TableHead>
                    <TableHead className="py-2">
                      <Input
                        placeholder="Filter type..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.type}
                        onChange={e => handleColumnFilterChange('type', e.target.value)}
                      />
                    </TableHead>
                    <TableHead className="py-2">
                      <Input
                        placeholder="Filter name..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.name}
                        onChange={e => handleColumnFilterChange('name', e.target.value)}
                      />
                    </TableHead>
                    <TableHead className="py-2">
                      <Input
                        placeholder="Filter company..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.company}
                        onChange={e => handleColumnFilterChange('company', e.target.value)}
                      />
                    </TableHead>
                    <TableHead />
                    <TableHead className="py-2 text-center">
                      <Select value={columnFilters.isActive} onValueChange={v => handleColumnFilterChange('isActive', v)}>
                        <SelectTrigger className="h-9 bg-white/5 border-white/10 rounded-lg text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="glass border-white/10 rounded-xl">
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead className="py-2 text-right pr-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px] font-bold uppercase tracking-tight text-muted-foreground hover:text-red-500 transition-colors"
                        onClick={clearFilters}
                      >
                        Reset
                      </Button>
                    </TableHead>
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-24 italic text-muted-foreground font-medium">
                      No staff members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((p) => (
                    <TableRow key={p.staff_uuid} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="pl-6">
                        <Checkbox
                          checked={selectedStaffIds.has(p.staff_uuid)}
                          onCheckedChange={checked => toggleStaffSelection(p.staff_uuid, checked)}
                          aria-label={`Select staff code ${p.staff_code}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">{p.staff_code}</code>
                          {p.staff_code && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full hover:bg-primary/10 group/copy"
                              onClick={() => void copyStaffCode(p.staff_code, p.staff_uuid)}
                            >
                              {copiedStaffId === p.staff_uuid ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground/40 group-hover/copy:text-primary transition-colors" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold text-[9px] border-white/10 uppercase bg-white/5">{p.staff_type_code}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors whitespace-nowrap">{p.title} {p.first_name} {p.last_name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-bold text-foreground/80">{p.company_name}</p>
                      </TableCell>
                      <TableCell>
                        {p.residence_country && (
                          <div className="flex items-center gap-2">
                            <img 
                              src={`https://flagcdn.com/${countries.find(c => c.name === p.residence_country)?.code.toLowerCase() || 'th'}.svg`} 
                              alt={p.residence_country} 
                              className="w-5 h-auto rounded-sm object-cover shadow-sm"
                            />
                            <span className="text-xs font-medium text-muted-foreground">{p.residence_country}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("rounded-full px-2 py-0 text-[9px] font-bold border", p.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:bg-primary/10 hover:text-primary group-hover:scale-110 transition-all duration-300" onClick={() => onPrintClick(p)} title="Print Badge">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/10 group-hover:scale-110 transition-all duration-300" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive group-hover:scale-110 transition-all duration-300" onClick={() => handleDelete(p.staff_uuid)}>
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

          {/* Pagination */}
          {initialData.total_items > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4 border-t border-white/5 bg-white/5">
              <div className="text-sm text-muted-foreground italic font-medium">
                Showing <span className="text-foreground">{(initialData.page - 1) * initialData.limit + 1}</span> to{' '}
                <span className="text-foreground">{Math.min(initialData.page * initialData.limit, initialData.total_items)}</span> of{' '}
                <span className="text-foreground font-bold">{initialData.total_items}</span> staff
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white/5 border-white/10"
                  onClick={() => handlePageChange(initialData.page - 1)}
                  disabled={initialData.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1 mx-2">
                  <span className="text-sm font-bold text-foreground">{initialData.page}</span>
                  <span className="text-sm text-muted-foreground/40 font-normal">/</span>
                  <span className="text-sm text-muted-foreground font-bold">{initialData.total_pages || 1}</span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white/5 border-white/10"
                  onClick={() => handlePageChange(initialData.page + 1)}
                  disabled={initialData.page === initialData.total_pages || initialData.total_pages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass max-h-[calc(100dvh-1rem)] grid-rows-[auto_minmax(0,1fr)] sm:max-w-[540px] border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="shrink-0 p-4 pr-12 sm:p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                {selectedStaff ? <Pencil className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">{selectedStaff ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
                <DialogDescription className="font-medium italic">
                  Complete the profile matrix to {selectedStaff ? 'update existing metadata' : 'initialize a new registration'}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="min-h-0 flex flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto space-y-5 sm:space-y-6 p-4 sm:p-8">
              <div className="space-y-2.5">
                <Label htmlFor="staff_type_code" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Staff Type <span className="text-red-500">*</span></Label>
                <Select name="staff_type_code" value={staffType} onValueChange={setStaffType} required disabled={!!selectedStaff}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl focus:bg-white/10 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10">
                    {staffTypes.length > 0 ? (
                      staffTypes.map((t) => (
                        <SelectItem key={t.type_code} value={t.type_code} className="text-xs font-bold uppercase">
                          {t.type_name} ({t.type_code})
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="ST" className="text-xs font-bold uppercase">Onsite (ST)</SelectItem>
                        <SelectItem value="OR" className="text-xs font-bold uppercase">Organizer (OR)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2.5 sm:col-span-2">
                  <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Title <span className="text-red-500">*</span></Label>
                  <Select name="title" value={title} onValueChange={setTitle} required>
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl focus:bg-white/10 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      {Array.from(new Set(['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', title])).filter(Boolean).map(t => (
                        <SelectItem key={t} value={t} className="text-xs font-bold">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="first_name" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">First Name <span className="text-red-500">*</span></Label>
                  <Input id="first_name" name="first_name" defaultValue={selectedStaff?.first_name || ''} required className="h-12 bg-white/5 border-white/10 rounded-xl" />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="last_name" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Last Name <span className="text-red-500">*</span></Label>
                  <Input id="last_name" name="last_name" defaultValue={selectedStaff?.last_name || ''} required className="h-12 bg-white/5 border-white/10 rounded-xl" />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="company_name" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Company Name <span className="text-red-500">*</span></Label>
                <Input id="company_name" name="company_name" defaultValue={selectedStaff?.company_name || ''} required className="h-12 bg-white/5 border-white/10 rounded-xl" />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="residence_country" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Residence Country <span className="text-red-500">*</span></Label>
                <CountrySelector
                  value={residenceCountry}
                  onChange={setResidenceCountry}
                  required
                />
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-white/5 bg-background/90 p-4 backdrop-blur sm:p-6 sm:px-8 flex sm:flex-row gap-3">
              <Button type="button" variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="btn-aurora rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {selectedStaff ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="glass sm:max-w-[400px] border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-display font-bold">Confirm Delete</DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8">
            <DialogDescription className="text-sm font-medium text-muted-foreground italic">
              Are you sure you want to delete this staff member? This action cannot be undone and will permanently remove the record from the core database.
            </DialogDescription>
          </div>
          <DialogFooter className="p-8 bg-white/5 border-t border-white/10 flex sm:flex-row gap-3">
            <Button variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setIsDeleteDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={confirmDelete} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

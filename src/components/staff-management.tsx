'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createStaff, updateStaff, deleteStaff, sendStaffCredentials, Staff } from '@/app/actions/staff'
import { toggleLeadScannerMemberStatus, updateLeadScannerStaffQuota, type LeadScannerStaffQuotaStatus } from '@/app/actions/exhibitor'
import { getOrganizerExhibitorMembers, createOrganizerMember, updateOrganizerMember, toggleStatusOrganizerMember, resendEmailOrganizerMember } from '@/app/actions/organizer-exhibitor'
import { toggleOrganizerLeadScannerMemberStatus, updateOrganizerLeadScannerStaffQuota } from '@/app/actions/organizer-exhibitor'
import { getCountryCodeFromValue } from '@/lib/countries'
import { CountrySelector } from '@/components/CountrySelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Pencil, Loader2, GripVertical, Mail, Power, Search } from 'lucide-react'
import { toast } from 'sonner'

interface StaffManagementProps {
  readonly exhibitorId: string
  readonly projectId: string
  readonly exhibitor?: any
  readonly userRole?: string | null
  readonly leadScannerStatus?: LeadScannerStaffQuotaStatus | null
  readonly onLeadScannerChanged?: () => void
}

export function StaffManagement({ exhibitorId, projectId, exhibitor, userRole, leadScannerStatus, onLeadScannerChanged }: StaffManagementProps) {
  const isOrganizer = userRole === 'ORGANIZER'
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [togglingStaffId, setTogglingStaffId] = useState<string | null>(null)
  const [leadScannerDialogOpen, setLeadScannerDialogOpen] = useState(false)
  const [leadScannerQuota, setLeadScannerQuota] = useState('')
  const [updatingLeadScannerQuota, setUpdatingLeadScannerQuota] = useState(false)
  const [togglingLeadScannerId, setTogglingLeadScannerId] = useState<string | null>(null)
  
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [targetEmail, setTargetEmail] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  const filteredStaffList = useMemo(() => {
    if (!searchQuery.trim()) return staffList
    const query = searchQuery.toLowerCase().trim()
    return staffList.filter((staff) => {
      const fullName = `${staff.title || ''} ${staff.firstName || ''} ${staff.lastName || ''}`.toLowerCase()
      const staffId = (staff.registrationCode || staff.id || '').toLowerCase()
      const position = (staff.position || '').toLowerCase()
      const email = (staff.email || '').toLowerCase()
      const mobile = (staff.mobile || staff.phone || '').toLowerCase()
      const company = (staff.companyName || '').toLowerCase()

      return (
        fullName.includes(query) ||
        staffId.includes(query) ||
        position.includes(query) ||
        email.includes(query) ||
        mobile.includes(query) ||
        company.includes(query)
      )
    })
  }, [staffList, searchQuery])


  // Note: Using a simpler form management here instead of react-hook-form for speed/simplicity on this sub-component,
  // but for production consistency, RHF + Zod is better. 
  // I'll stick to controlled inputs for now to save setup time unless complex validation is needed.
  // Resolve country values from the API into selector-friendly ISO codes.
  const initialCountry = getCountryCodeFromValue(exhibitor?.country)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    position: '',
    email: '',
    mobile: '',
    companyName: '',
    companyCountry: 'TH',
    companyTel: '',
    staffTypeCode: 'EXHIBITOR'
  })
  const [isOtherTitle, setIsOtherTitle] = useState(false)
  const [customTitle, setCustomTitle] = useState('')

  const TITLES = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.', 'Miss']

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    
    let result
    if (isOrganizer) {
      result = await getOrganizerExhibitorMembers(exhibitorId)
    } else {
      const { getExhibitorMembers } = await import('@/app/actions/exhibitor')
      result = await getExhibitorMembers(projectId, exhibitorId)
    }
    
    if (result.success && result.members) {
      // Map members to Staff format
      const mappedStaff: Staff[] = result.members.map((m: any) => ({
        id: m.registration_uuid,
        registrationUuid: m.registration_uuid,
        registrationCode: m.registration_code,
        exhibitorId: exhibitorId,
        title: m.title || '',
        firstName: m.first_name || '',
        lastName: m.last_name || '',
        email: m.email || '',
        mobile: m.mobile_number || '',
        phone: m.mobile_number || '',
        position: m.job_position || '',
        isActive: m.is_active !== undefined ? m.is_active : true,
        createdAt: new Date().toISOString(),
        companyName: m.company_name || '',
        companyCountry: getCountryCodeFromValue(m.company_country, initialCountry),
        companyTel: m.company_tel || '',
        staff_type_code: m.staff_type_code || 'EXHIBITOR',
        isLeadScannerEnabled: Boolean(m.is_lead_scanner_enabled)
      }))
      setStaffList(mappedStaff)
    } else {
      setStaffList([])
    }
    setLoading(false)
  }, [exhibitorId, projectId, isOrganizer, initialCountry])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  function handleOpenDialog(staff?: Staff) {
    if (staff) {
      setEditingStaff(staff)
      const isStandard = TITLES.includes(staff.title || '')
      
      let displayTitle = '';
      if (isStandard) {
        displayTitle = staff.title || '';
      } else if (staff.title) {
        displayTitle = 'Other';
      }
      
      setFormData({
        firstName: staff.firstName || '',
        lastName: staff.lastName || '',
        title: displayTitle,
        position: staff.position || '',
        email: staff.email || '',
        mobile: staff.mobile || '',
        companyName: staff.companyName || exhibitor?.companyName || '',
        companyCountry: staff.companyCountry || initialCountry,
        companyTel: staff.companyTel || exhibitor?.phone || '',
        staffTypeCode: staff.staff_type_code || 'EXHIBITOR'
      })
      
      if (!isStandard && staff.title) {
        setIsOtherTitle(true)
        setCustomTitle(staff.title)
      } else {
        setIsOtherTitle(false)
        setCustomTitle('')
      }
    } else {
      setEditingStaff(null)
      setFormData({
        firstName: '',
        lastName: '',
        title: '',
        position: '',
        email: '',
        mobile: '',
        companyName: exhibitor?.companyName || '',
        companyCountry: initialCountry,
        companyTel: exhibitor?.phone || '',
        staffTypeCode: 'EXHIBITOR'
      })
      setIsOtherTitle(false)
      setCustomTitle('')
    }
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    
    const finalTitle = isOtherTitle ? customTitle : formData.title
    
    // Structure expected by the actions
    const payload = {
      title: finalTitle,
      firstName: formData.firstName,
      lastName: formData.lastName,
      position: formData.position,
      email: formData.email,
      mobile: formData.mobile,
      exhibitorId: exhibitorId,
      companyName: formData.companyName,
      companyCountry: formData.companyCountry,
      companyTel: formData.companyTel,
      staffTypeCode: formData.staffTypeCode
    }

    try {
      let result
      if (isOrganizer) {
        if (editingStaff) {
          result = await updateOrganizerMember(editingStaff.id, payload)
        } else {
          result = await createOrganizerMember(payload)
        }
      } else {
        if (editingStaff) {
          result = await updateStaff(projectId, editingStaff.id, payload)
        } else {
          result = await createStaff(projectId, payload)
        }
      }

      if (result.success) {
        if (editingStaff) {
          toast.success('Staff updated')
        } else {
          const emailTrimmed = formData.email?.trim()
          if (emailTrimmed) {
            toast.success('Staff added', {
              description: `Business Matching email will be sent to ${emailTrimmed} in the next scheduled batch.`,
            })
          } else {
            toast.success('Staff added', {
              description: 'Add a staff email to enable Business Matching auto-send.',
            })
          }
        }
        setIsDialogOpen(false)
        fetchStaff()
      } else {
        toast.error(result.error || 'Operation failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    toast("Delete this staff member?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          const result = await deleteStaff(projectId, id, exhibitorId)
          if (result.success) {
            toast.success('Staff deleted')
            setStaffList(staffList.filter(s => s.id !== id))
          } else {
            toast.error('Failed to delete staff')
          }
        },
      },
    })
  }

  async function handleToggleStatus(staff: Staff) {
    if (togglingStaffId) return

    setTogglingStaffId(staff.id)
    let result
    try {
      if (isOrganizer) {
        result = await toggleStatusOrganizerMember(exhibitorId, staff.id)
      } else {
        const { toggleStatusStaff } = await import('@/app/actions/staff')
        result = await toggleStatusStaff(projectId, staff.id, exhibitorId)
      }
      if (result.success) {
        toast.success('Status toggled successfully')
        fetchStaff()
      } else {
        toast.error('Failed to toggle status')
      }
    } finally {
      setTogglingStaffId(null)
    }
  }

  function openLeadScannerQuotaDialog() {
    setLeadScannerQuota(String(leadScannerStatus?.quota ?? exhibitor?.leadScannerStaffQuota ?? 0))
    setLeadScannerDialogOpen(true)
  }

  async function handleUpdateLeadScannerQuota() {
    if (!/^\d+$/.test(leadScannerQuota) || updatingLeadScannerQuota) {
      toast.error('Quota must be a non-negative whole number')
      return
    }

    setUpdatingLeadScannerQuota(true)
    try {
      const quota = Number(leadScannerQuota)
      const result = isOrganizer
        ? await updateOrganizerLeadScannerStaffQuota(exhibitorId, quota)
        : await updateLeadScannerStaffQuota(projectId, exhibitorId, quota)

      if (result.success) {
        toast.success('Lead Scanner quota updated')
        setLeadScannerDialogOpen(false)
        await fetchStaff()
        onLeadScannerChanged?.()
      } else {
        toast.error(result.error || 'Failed to update Lead Scanner quota')
      }
    } finally {
      setUpdatingLeadScannerQuota(false)
    }
  }

  async function handleToggleLeadScanner(staff: Staff) {
    if (togglingLeadScannerId) return

    setTogglingLeadScannerId(staff.id)
    try {
      const result = isOrganizer
        ? await toggleOrganizerLeadScannerMemberStatus(exhibitorId, staff.id)
        : await toggleLeadScannerMemberStatus(projectId, exhibitorId, staff.id)

      if (result.success) {
        toast.success('Lead Scanner access updated')
        await fetchStaff()
        onLeadScannerChanged?.()
      } else {
        toast.error(result.error || 'Failed to update Lead Scanner access')
      }
    } finally {
      setTogglingLeadScannerId(null)
    }
  }

  function handleOpenEmailDialog(staff: Staff) {
    setSelectedStaff(staff)
    setTargetEmail(staff.email || '')
    setEmailDialogOpen(true)
  }

  async function handleSendCredentials() {
    if (!selectedStaff) return
    
    setSendingEmail(true)
    let result
    if (isOrganizer) {
      result = await resendEmailOrganizerMember([{
        registration_uuid: selectedStaff.registrationUuid || selectedStaff.id,
        email: targetEmail
      }])
    } else {
      result = await sendStaffCredentials(projectId, [{
        member_uuid: selectedStaff.id,
        email: targetEmail
      }])
    }
    setSendingEmail(false)
    
    if (result.success) {
      toast.success('Confirmation email sent successfully')
      setEmailDialogOpen(false)
    } else {
      toast.error('Failed to send confirmation')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Staff Members</CardTitle>
          <p className="text-sm text-muted-foreground">{leadScannerStatus?.enabled_count ?? 0} / {leadScannerStatus?.quota ?? exhibitor?.leadScannerStaffQuota ?? 0} Lead Scanner staff{leadScannerStatus?.is_quota_full ? ' (Quota full)' : ''}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button variant="outline" onClick={openLeadScannerQuotaDialog} size="sm">Adjust Lead Scanner Quota</Button>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search staff members..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => handleOpenDialog()} size="sm" disabled={exhibitor?.isQuotaFull || exhibitor?.is_quota_full}>
            <Plus className="mr-2 h-4 w-4" /> Add Staff
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            No staff members added yet.
          </div>
        ) : filteredStaffList.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            No staff members found matching &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lead Scanner</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaffList.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </TableCell>
                  <TableCell>{staff.registrationCode || staff.id.substring(0, 8)}</TableCell>
                  <TableCell>{staff.title}</TableCell>
                  <TableCell className="font-medium">{staff.firstName} {staff.lastName}</TableCell>
                  <TableCell>{staff.position}</TableCell>
                  <TableCell>
                    <div className="text-sm">{staff.email}</div>
                    <div className="text-xs text-muted-foreground">{staff.mobile}</div>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${staff.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {staff.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      aria-label={`Enable Lead Scanner for ${staff.firstName} ${staff.lastName}`}
                      checked={staff.isLeadScannerEnabled}
                      disabled={togglingLeadScannerId !== null || (leadScannerStatus?.is_quota_full === true && !staff.isLeadScannerEnabled)}
                      onCheckedChange={() => handleToggleLeadScanner(staff)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      
                       <Button variant="ghost" size="icon" title="Resend Email" onClick={() => handleOpenEmailDialog(staff)}>
                        <Mail className="h-4 w-4 text-purple-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(staff)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" title={staff.isActive ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(staff)} disabled={togglingStaffId !== null}>
                        {togglingStaffId === staff.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className={`h-4 w-4 ${staff.isActive ? 'text-green-500' : 'text-muted-foreground'}`} />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={leadScannerDialogOpen} onOpenChange={setLeadScannerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Lead Scanner Quota</DialogTitle>
            <DialogDescription>Set the maximum number of staff who can use Lead Scanner.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="leadScannerQuota">Maximum staff</Label>
            <Input id="leadScannerQuota" type="number" min="0" step="1" value={leadScannerQuota} onChange={(event) => setLeadScannerQuota(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeadScannerDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateLeadScannerQuota} disabled={updatingLeadScannerQuota}>
              {updatingLeadScannerQuota && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Update staff details.' : 'Add a new staff member to this exhibitor.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <div className="col-span-3 flex gap-2">
                  <Select 
                    value={formData.title} 
                    onValueChange={(value) => {
                      if (value === 'Other') {
                        setIsOtherTitle(true)
                        setFormData({...formData, title: 'Other'})
                      } else {
                        setIsOtherTitle(false)
                        setFormData({...formData, title: value})
                        setCustomTitle('')
                      }
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {TITLES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {isOtherTitle && (
                    <Input 
                      placeholder="Specify title" 
                      value={customTitle} 
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="flex-1"
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">First Name</Label>
                <Input id="firstName" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">Last Name</Label>
                <Input id="lastName" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="position" className="text-right">Position</Label>
                <Input id="position" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mobile" className="text-right">Mobile</Label>
                <Input id="mobile" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                  className="col-span-3"
                  placeholder="Company name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Company Country</Label>
                <div className="col-span-3">
                  <CountrySelector
                    value={formData.companyCountry}
                    onChange={(code) => setFormData({...formData, companyCountry: code})}
                    label=""
                    placeholder="Select country"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Company Tel</Label>
                <Input
                  id="companyTel"
                  value={formData.companyTel}
                  onChange={e => setFormData({...formData, companyTel: e.target.value})}
                  className="col-span-3"
                  placeholder="Company telephone"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingStaff ? 'Save Changes' : 'Add Staff'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Email Confirmation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input 
                id="email" 
                value={targetEmail} 
                onChange={e => setTargetEmail(e.target.value)} 
                className="col-span-3" 
                placeholder="example@email.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendCredentials} disabled={sendingEmail}>
              {sendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Resend Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

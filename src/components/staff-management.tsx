'use client'

import { useState, useEffect, useCallback } from 'react'
import { getStaffByExhibitorId, createStaff, updateStaff, deleteStaff, sendStaffCredentials, Staff } from '@/app/actions/staff'
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
import { Plus, Pencil, Trash2, Loader2, GripVertical, Mail, Power } from 'lucide-react'
import { toast } from 'sonner'

interface StaffManagementProps {
  readonly exhibitorId: string
  readonly projectId: string
}

export function StaffManagement({ exhibitorId, projectId }: StaffManagementProps) {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [targetEmail, setTargetEmail] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  
  // Note: Using a simpler form management here instead of react-hook-form for speed/simplicity on this sub-component,
  // but for production consistency, RHF + Zod is better. 
  // I'll stick to controlled inputs for now to save setup time unless complex validation is needed.
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    position: '',
    email: '',
    mobile: ''
  })
  const [isOtherTitle, setIsOtherTitle] = useState(false)
  const [customTitle, setCustomTitle] = useState('')

  const TITLES = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.', 'Miss']

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    const { getExhibitorMembers } = await import('@/app/actions/exhibitor')
    const result = await getExhibitorMembers(projectId, exhibitorId)
    if (result.success && result.members) {
      // Map members to Staff format
      const mappedStaff: Staff[] = result.members.map((m: any) => ({
        id: m.member_uuid,
        registrationCode: m.registration_code,
        exhibitorId: exhibitorId,
        title: m.title || '',
        firstName: m.first_name || '',
        lastName: m.last_name || '',
        email: m.email || '',
        mobile: m.mobile_number || '',
        phone: m.mobile_number || '', // Mapping to mobile for now
        position: m.job_position || '',
        isActive: true, // Assuming active by default
        createdAt: new Date().toISOString()
      }))
      setStaffList(mappedStaff)
    } else {
      setStaffList([])
    }
    setLoading(false)
  }, [exhibitorId, projectId])

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
        mobile: staff.mobile || ''
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
        mobile: ''
      })
      setIsOtherTitle(false)
      setCustomTitle('')
    }
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    const finalTitle = isOtherTitle ? customTitle : formData.title
    
    // Structure expected by the actions
    const payload = {
      title: finalTitle,
      firstName: formData.firstName,
      lastName: formData.lastName,
      position: formData.position,
      email: formData.email,
      mobile: formData.mobile,
      exhibitorId: exhibitorId
    }

    let result
    if (editingStaff) {
      result = await updateStaff(projectId, editingStaff.id, payload)
    } else {
      result = await createStaff(projectId, payload)
    }

    if (result.success) {
      toast.success(editingStaff ? 'Staff updated' : 'Staff added')
      setIsDialogOpen(false)
      fetchStaff()
    } else {
      toast.error(result.error || 'Operation failed')
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
    const { toggleStatusStaff } = await import('@/app/actions/staff')
    const result = await toggleStatusStaff(projectId, staff.id, exhibitorId)
    if (result.success) {
      toast.success('Status toggled successfully')
      fetchStaff()
    } else {
      toast.error('Failed to toggle status')
    }
  }

  function handleOpenEmailDialog(staff: Staff) {
    setSelectedStaff(staff)
    setEmailDialogOpen(true)
  }

  async function handleSendCredentials() {
    if (!selectedStaff) return
    
    setSendingEmail(true)
    const result = await sendStaffCredentials(projectId, selectedStaff.id)
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Staff Members</CardTitle>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Staff
        </Button>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList.map((staff) => (
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" title={staff.isActive ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(staff)}>
                        <Power className={`h-4 w-4 ${staff.isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </Button>
                       <Button variant="ghost" size="icon" title="Send Credentials" onClick={() => handleOpenEmailDialog(staff)}>
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(staff)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(staff.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

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
            </div>
            <DialogFooter>
              <Button type="submit">{editingStaff ? 'Save Changes' : 'Add Staff'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Credentials</DialogTitle>
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
              Send Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

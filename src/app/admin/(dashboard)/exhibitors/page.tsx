'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getExhibitors, deleteExhibitor, toggleStatusExhibitor, forcePasswordResetExhibitor, sendExhibitorCredentials } from '@/app/actions/exhibitor'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, Key, Loader2, Mail, Power } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function ExhibitorsPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  
  const [exhibitors, setExhibitors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [selectedExhibitor, setSelectedExhibitor] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  // Wait for fetchExhibitors
  const fetchExhibitors = async () => {
    if (!projectId) return
    setLoading(true)
    const result = await getExhibitors(projectId)
    if (result.success && result.exhibitors) {
      setExhibitors(result.exhibitors)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchExhibitors()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function handleDelete(id: string) {
    toast("Delete this exhibitor?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          if (!projectId) return
          const result = await deleteExhibitor(projectId, id)
          if (result.success) {
            setExhibitors(exhibitors.filter(e => e.id !== id))
            toast.success('Exhibitor deleted')
          } else {
            toast.error('Failed to delete exhibitor')
          }
        }
      }
    })
  }

  async function handleToggleStatus(id: string) {
    if (!projectId) return
    const result = await toggleStatusExhibitor(projectId, id)
    if (result.success) {
      toast.success('Status toggled successfully')
      fetchExhibitors()
    } else {
      toast.error('Failed to toggle status')
    }
  }

  function handleOpenPasswordDialog(exhibitor: any) {
    setSelectedExhibitor(exhibitor)
    setNewPassword('')
    setPasswordDialogOpen(true)
  }

  function handleOpenEmailDialog(exhibitor: any) {
    setSelectedExhibitor(exhibitor)
    setEmailDialogOpen(true)
  }

  async function handleSendCredentials() {
    if (!selectedExhibitor || !projectId) return
    
    setSendingEmail(true)
    const result = await sendExhibitorCredentials(projectId, selectedExhibitor.id)
    setSendingEmail(false)
    
    if (result.success) {
      toast.success('Credentials sent successfully')
      setEmailDialogOpen(false)
    } else {
      toast.error('Failed to send credentials')
    }
  }

  async function handleResetPassword() {
    if (!selectedExhibitor || !projectId) return
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    setSavingPassword(true)
    const result = await forcePasswordResetExhibitor(projectId, selectedExhibitor.id, newPassword)
    setSavingPassword(false)
    
    if (result.success) {
      toast.success('Password reset successfully')
      setPasswordDialogOpen(false)
    } else {
      toast.error(result.error || 'Failed to reset password')
    }
  }

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold">No Project Selected</h2>
        <p className="text-muted-foreground">Please select a project from the dashboard.</p>
        <Link href="/admin/projects">
          <Button className="mt-4" variant="outline">Select Project</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Exhibitors</h1>
        <Link href={`/admin/exhibitors/new?projectId=${projectId}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Exhibitor
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Exhibitors</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : exhibitors.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No exhibitors found. Add one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Booth No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Used Quota</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exhibitors.map((item, index) => (
                  <TableRow key={`${item.id}-${index}`}>
                    <TableCell className="font-medium">{item.username || '-'}</TableCell>
                    <TableCell>{item.companyName}</TableCell>
                    <TableCell>{item.eventName || '-'}</TableCell>
                    <TableCell>{item.boothNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.usedQuota}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title={item.isActive ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(item.id)}>
                          <Power className={`h-4 w-4 ${item.isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" title="Send Credentials" onClick={() => handleOpenEmailDialog(item)}>
                          <Mail className="h-4 w-4 text-purple-500" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Reset Password" onClick={() => handleOpenPasswordDialog(item)}>
                          <Key className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Link href={`/admin/exhibitors/${item.id}?projectId=${projectId}`}>
                          <Button variant="ghost" size="icon" title="Edit/Manage">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(item.id)}>
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
      </Card>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedExhibitor?.companyName} ({selectedExhibitor?.username}).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">New Password</Label>
              <Input 
                id="password" 
                type="text"
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                className="col-span-3" 
                placeholder="Min 6 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={savingPassword}>
              {savingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
              Save Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Credentials</DialogTitle>
            <DialogDescription>
              Are you sure you want to send the login credentials to {selectedExhibitor?.companyName}? The email will be sent to their registered contact email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendCredentials} disabled={sendingEmail}>
              {sendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

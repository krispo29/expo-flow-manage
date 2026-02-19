'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getExhibitors, deleteExhibitor } from '@/app/actions/exhibitor'
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
import { Plus, Pencil, Trash2, Link as LinkIcon, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner' // Using sonner as recommended by shadcn

export default function ExhibitorsPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  
  const [exhibitors, setExhibitors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [selectedExhibitor, setSelectedExhibitor] = useState<any>(null)
  const [targetEmail, setTargetEmail] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    if (!projectId) return

    async function fetchExhibitors() {
      setLoading(true)
      const result = await getExhibitors(projectId!)
      if (result.success && result.exhibitors) {
        setExhibitors(result.exhibitors)
      }
      setLoading(false)
    }
    fetchExhibitors()
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

  function handleOpenEmailDialog(exhibitor: any) {
    setSelectedExhibitor(exhibitor)
    setTargetEmail(exhibitor.email || '')
    setEmailDialogOpen(true)
  }

  async function handleSendCredentials() {
    if (!selectedExhibitor) return
    
    setSendingEmail(true)
    const { sendExhibitorCredentials } = await import('@/app/actions/exhibitor')
    if (projectId) {
      const result = await sendExhibitorCredentials(projectId, selectedExhibitor.id, targetEmail)
      setSendingEmail(false)
      
      if (result.success) {
        toast.success('Credentials sent successfully')
        setEmailDialogOpen(false)
      } else {
        toast.error('Failed to send credentials')
      }
    } else {
      setSendingEmail(false)
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
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Booth No.</TableHead>
                  <TableHead>Quota</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exhibitors.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.registrationId || '-'}</TableCell>
                    <TableCell className="font-medium">{item.companyName}</TableCell>
                    <TableCell>{item.contactName || '-'}</TableCell>
                    <TableCell>{item.boothNumber || '-'}</TableCell>
                    <TableCell>
                      {item.quota} (+{item.overQuota})
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {item.inviteCode ? (
                          <Button variant="ghost" size="icon" title="Copy Invite Link" onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/invite/${item.inviteCode}`)
                            toast.success('Invite link copied')
                          }}>
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" title="Generate Invite Code" onClick={async () => {
                             const { generateInviteCode } = await import('@/app/actions/exhibitor')
                             if (projectId) {
                               const res = await generateInviteCode(projectId, item.id)
                               if(res.success) {
                                 toast.success('Code generated')
                               }
                             }
                          }}>
                            <Loader2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Send Credentials" onClick={() => handleOpenEmailDialog(item)}>
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Link href={`/admin/exhibitors/${item.id}?projectId=${projectId}`}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
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

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Credentials</DialogTitle>
            <DialogDescription>
              Confirm the recipient email address for {selectedExhibitor?.companyName}.
            </DialogDescription>
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
    </div>
  )
}

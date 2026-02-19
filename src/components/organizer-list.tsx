'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  getOrganizers,
  createOrganizer,
  updateOrganizer,
  forceResetPassword,
  toggleOrganizerStatus,
  type Organizer,
} from '@/app/actions/organizer'
import { Pencil, Plus, Loader2, KeyRound, Power } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface OrganizerListProps {
  projectUuid: string
}

export function OrganizerList({ projectUuid }: Readonly<OrganizerListProps>) {
  const [organizers, setOrganizers] = useState<Organizer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newOrg, setNewOrg] = useState({ username: '', password: '', full_name: '' })

  // Edit dialog
  const [editingOrg, setEditingOrg] = useState<Organizer | null>(null)

  // Reset password dialog
  const [resetOrg, setResetOrg] = useState<Organizer | null>(null)
  const [newPassword, setNewPassword] = useState('')

  async function fetchOrganizers() {
    setLoading(true)
    const result = await getOrganizers(projectUuid)
    if (result.success) {
      setOrganizers(result.data || [])
    } else {
      toast.error(result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrganizers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUuid])

  async function handleCreate() {
    if (!newOrg.username || !newOrg.password || !newOrg.full_name) {
      toast.error('Please fill in all fields')
      return
    }
    setSaving(true)
    const result = await createOrganizer(projectUuid, newOrg)
    setSaving(false)
    if (result.success) {
      toast.success('Organizer created')
      setIsCreateOpen(false)
      setNewOrg({ username: '', password: '', full_name: '' })
      fetchOrganizers()
    } else {
      toast.error(result.error || 'Failed to create organizer')
    }
  }

  async function handleUpdate() {
    if (!editingOrg) return
    setSaving(true)
    const result = await updateOrganizer(projectUuid, {
      organizer_uuid: editingOrg.organizer_uuid,
      full_name: editingOrg.full_name,
      is_active: editingOrg.is_active,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Organizer updated')
      setEditingOrg(null)
      fetchOrganizers()
    } else {
      toast.error(result.error || 'Failed to update organizer')
    }
  }

  async function handleToggleStatus(org: Organizer) {
    setSaving(true)
    const result = await toggleOrganizerStatus(projectUuid, org.organizer_uuid)
    setSaving(false)
    if (result.success) {
      toast.success(`Organizer ${org.is_active ? 'deactivated' : 'activated'}`)
      fetchOrganizers()
    } else {
      toast.error(result.error || 'Failed to toggle status')
    }
  }

  async function handleResetPassword() {
    if (!resetOrg || !newPassword) {
      toast.error('Please enter a new password')
      return
    }
    setSaving(true)
    const result = await forceResetPassword(projectUuid, {
      organizer_uuid: resetOrg.organizer_uuid,
      new_password: newPassword,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Password reset successfully')
      setResetOrg(null)
      setNewPassword('')
    } else {
      toast.error(result.error || 'Failed to reset password')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Organizers ({organizers.length})</h2>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Organizer
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No organizers found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              organizers.map((org) => (
                <TableRow key={org.organizer_uuid}>
                  <TableCell className="font-medium">{org.username}</TableCell>
                  <TableCell>{org.full_name}</TableCell>
                  <TableCell>
                    <Badge variant={org.is_active ? "default" : "secondary"}>
                      {org.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {org.last_login ? format(new Date(org.last_login), 'MMM d, yyyy HH:mm') : '—'}
                  </TableCell>
                  <TableCell>{format(new Date(org.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        onClick={() => setEditingOrg({ ...org })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Reset Password"
                        onClick={() => { setResetOrg(org); setNewPassword(''); }}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={org.is_active ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggleStatus(org)}
                        disabled={saving}
                      >
                        <Power className={`h-4 w-4 ${org.is_active ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Organizer</DialogTitle>
            <DialogDescription>
              Create a new organizer account for this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-username">Username</Label>
              <Input
                id="create-username"
                value={newOrg.username}
                onChange={(e) => setNewOrg({ ...newOrg, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-fullname">Full Name</Label>
              <Input
                id="create-fullname"
                value={newOrg.full_name}
                onChange={(e) => setNewOrg({ ...newOrg, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={newOrg.password}
                onChange={(e) => setNewOrg({ ...newOrg, password: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingOrg} onOpenChange={(open) => !open && setEditingOrg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organizer</DialogTitle>
            <DialogDescription>
              Update organizer details. Username: <strong>{editingOrg?.username}</strong>
            </DialogDescription>
          </DialogHeader>
          {editingOrg && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fullname">Full Name</Label>
                <Input
                  id="edit-fullname"
                  value={editingOrg.full_name}
                  onChange={(e) => setEditingOrg({ ...editingOrg, full_name: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={editingOrg.is_active}
                  onCheckedChange={(checked) => setEditingOrg({ ...editingOrg, is_active: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOrg(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetOrg} onOpenChange={(open) => !open && setResetOrg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetOrg?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOrg(null)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

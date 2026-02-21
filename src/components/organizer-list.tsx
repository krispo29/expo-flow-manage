import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
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
import { Pencil, Loader2, KeyRound, Power, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface OrganizerListProps {
  projectUuid: string
}

export interface OrganizerListHandle {
  openCreateDialog: () => void
}

export const OrganizerList = forwardRef<OrganizerListHandle, OrganizerListProps>(
  ({ projectUuid }, ref) => {
  const [organizers, setOrganizers] = useState<Organizer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newOrg, setNewOrg] = useState({ username: '', password: '', full_name: '' })

  // Exposed handle for parent component
  useImperativeHandle(ref, () => ({
    openCreateDialog: () => setIsCreateOpen(true)
  }))

  // Edit dialog
  const [editingOrg, setEditingOrg] = useState<Organizer | null>(null)

  const [resetOrg, setResetOrg] = useState<Organizer | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter organizers based on search
  const filteredOrganizers = organizers.filter(org => 
    org.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate pagination based on FILTERED data
  const totalPages = Math.ceil(filteredOrganizers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrganizers = filteredOrganizers.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  // Handle search change and reset pagination
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

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
      toast.success('Organizer created successfully')
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
      toast.success('Organizer updated successfully')
      setEditingOrg(null)
      fetchOrganizers()
    } else {
      toast.error(result.error || 'Failed to update organizer')
    }
  }

  async function handleToggleStatus(org: Organizer) {
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

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-none shadow-md">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-bold">All Organizers</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search username or name..."
                className="pl-9 bg-background border-border/50 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : organizers.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No organizers found. Add one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Username</TableHead>
                  <TableHead className="font-semibold text-foreground">Full Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Last Login</TableHead>
                  <TableHead className="font-semibold text-foreground">Created</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      {searchQuery ? "No results matching your search terms." : "No organizers found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrganizers.map((org) => (
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
          )}

          <div className="flex items-center justify-between p-4 border-t bg-muted/10">
            <div className="text-xs text-muted-foreground italic">
              Showing <span className="font-medium">{filteredOrganizers.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredOrganizers.length)}</span> of <span className="font-medium">{filteredOrganizers.length}</span> results
            </div>
            {filteredOrganizers.length > itemsPerPage && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage
                    if (currentPage <= 3) pageNum = i + 1
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                    else pageNum = currentPage - 2 + i

                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8 text-xs font-semibold"
                          onClick={() => goToPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    }
                    return null
                  })}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
})

OrganizerList.displayName = 'OrganizerList'

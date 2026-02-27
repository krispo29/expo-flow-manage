"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getInvitations, createInvitation, updateInvitation, type Invitation } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Copy, Edit, Plus, Loader2, ExternalLink, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface InvitationCodeSettingsProps {
  projectUuid: string
}

export function InvitationCodeSettings({ projectUuid }: Readonly<InvitationCodeSettingsProps>) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingInvite, setEditingInvite] = useState<Invitation | null>(null)

  // Create form state
  const [newInvite, setNewInvite] = useState({ company_name: '' })

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter invitations based on search
  const filteredInvitations = invitations.filter(invite => 
    invite.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invite.invite_code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate pagination based on FILTERED data
  const totalPages = Math.ceil(filteredInvitations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedInvitations = filteredInvitations.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  // Handle search change and reset pagination
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  async function fetchInvitations() {
    setLoading(true)
    const result = await getInvitations(projectUuid)
    if (result.success) setInvitations(result.invitations)
    setLoading(false)
  }

  useEffect(() => {
    fetchInvitations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUuid])


  async function handleCreate() {
    if (!newInvite.company_name) {
      toast.error("Please fill in Company Name")
      return
    }
    setSaving(true)
    const result = await createInvitation(projectUuid, newInvite)
    setSaving(false)
    if (result.success) {
      toast.success("Invitation created")
      setIsCreateOpen(false)
      setNewInvite({ company_name: '' })
      fetchInvitations()
    } else {
      toast.error(result.error || "Failed to create invitation")
    }
  }

  async function handleUpdate() {
    if (!editingInvite) return
    setSaving(true)
    const result = await updateInvitation(projectUuid, {
      invite_uuid: editingInvite.invite_uuid,
      company_name: editingInvite.company_name,
      invite_code: editingInvite.invite_code,
      is_active: editingInvite.is_active,
    })
    setSaving(false)
    if (result.success) {
      toast.success("Invitation updated")
      setEditingInvite(null)
      fetchInvitations()
    } else {
      toast.error(result.error || "Failed to update invitation")
    }
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link)
    toast.success("Link copied to clipboard")
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invitation Codes</CardTitle>
            <CardDescription>Manage invitation codes for special access.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search company or code..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Code
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredInvitations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {searchQuery ? "No matching results found." : "No invitation codes found. Click \"Add Code\" to create one."}
          </div>
        ) : (
          <div className="border rounded-md">
            <div className="grid grid-cols-8 gap-4 p-3 font-medium text-sm bg-muted/50 border-b">
              <div>Company</div>
              <div>Code</div>
              <div>Invite Link</div>
              <div>Source</div>
              <div>Creator</div>
              <div>Used</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>
            {paginatedInvitations.map((invite, index) => (
              <div key={`${invite.invite_uuid}-${index}`} className="grid grid-cols-8 gap-4 p-3 text-sm items-center border-b last:border-0 hover:bg-muted/10 transition-colors">
                <div className="font-medium">{invite.company_name}</div>
                <div>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{invite.invite_code}</code>
                </div>
                <div className="truncate text-xs text-muted-foreground flex items-center gap-1" title={invite.invite_link}>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{invite.invite_link}</span>
                </div>
                <div className="text-muted-foreground truncate" title={invite.source}>
                  {invite.source || '-'}
                </div>
                <div className="text-muted-foreground truncate" title={invite.creator_name}>
                  {invite.creator_name || '-'}
                </div>
                <div className="text-muted-foreground">
                  {invite.used_count ?? 0}
                </div>
                <div>
                  <Badge variant={invite.is_active ? "default" : "secondary"} className="text-xs">
                    {invite.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyLink(invite.invite_link)}
                    title="Copy Link"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingInvite(invite)}
                    title="Edit"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredInvitations.length > itemsPerPage && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredInvitations.length)}</span> of <span className="font-medium">{filteredInvitations.length}</span> results
            </div>
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
                  let pageNum = i + 1
                  if (totalPages > 5) {
                    if (currentPage <= 3) pageNum = i + 1
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                    else pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 text-xs"
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
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
          </div>
        )}
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Invitation Code</DialogTitle>
            <DialogDescription>Create a new invitation code for a company.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Company Name</Label>
              <Input value={newInvite.company_name} onChange={(e) => setNewInvite({ ...newInvite, company_name: e.target.value })} placeholder="e.g. THE DEFT" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingInvite} onOpenChange={(open) => !open && setEditingInvite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Invitation Code</DialogTitle>
            <DialogDescription>Update the invitation code details.</DialogDescription>
          </DialogHeader>
          {editingInvite && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Company Name</Label>
                <Input value={editingInvite.company_name} onChange={(e) => setEditingInvite({ ...editingInvite, company_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Invite Code</Label>
                <Input value={editingInvite.invite_code} onChange={(e) => setEditingInvite({ ...editingInvite, invite_code: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingInvite.is_active} onCheckedChange={(v) => setEditingInvite({ ...editingInvite, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingInvite(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

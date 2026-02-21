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
import { Copy, Edit, Plus, Loader2, ExternalLink } from "lucide-react"
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
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Code
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No invitation codes found. Click &quot;Add Code&quot; to create one.
          </div>
        ) : (
          <div className="border rounded-md">
            <div className="grid grid-cols-5 gap-4 p-3 font-medium text-sm bg-muted/50 border-b">
              <div>Company</div>
              <div>Code</div>
              <div>Invite Link</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>
            {invitations.map((invite, index) => (
              <div key={`${invite.invite_uuid}-${index}`} className="grid grid-cols-5 gap-4 p-3 text-sm items-center border-b last:border-0 hover:bg-muted/10 transition-colors">
                <div className="font-medium">{invite.company_name}</div>
                <div>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{invite.invite_code}</code>
                </div>
                <div className="truncate text-xs text-muted-foreground flex items-center gap-1" title={invite.invite_link}>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{invite.invite_link}</span>
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

"use client"

import { useTransition, useRef, useState } from "react"
import { toast } from "sonner"
import { createInvitationCode, updateInvitationCode, deleteInvitationCode } from "@/app/actions/settings"
import { InvitationCode } from "@/lib/mock-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Copy, Trash2, Edit } from "lucide-react"

interface InvitationCodeSettingsProps {
  codes: InvitationCode[]
  siteUrl: string
}

export function InvitationCodeSettings({ codes, siteUrl }: Readonly<InvitationCodeSettingsProps>) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [editingCode, setEditingCode] = useState<InvitationCode | null>(null)

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createInvitationCode(formData)
      if (result.success) {
        toast.success("Invitation code created")
        formRef.current?.reset()
      } else {
        toast.error("Failed to create invitation code")
      }
    })
  }

  async function handleUpdate(formData: FormData) {
    if (!editingCode) return
    startTransition(async () => {
      const result = await updateInvitationCode(editingCode.id, formData)
      if (result.success) {
        toast.success("Invitation code updated")
        setEditingCode(null)
      } else {
        toast.error("Failed to update invitation code")
      }
    })
  }

  async function handleDelete(id: string) {
    toast("Delete this invitation code?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          startTransition(async () => {
            const result = await deleteInvitationCode(id)
            if (result.success) {
              toast.success("Invitation code deleted")
            } else {
              toast.error("Failed to delete invitation code")
            }
          })
        },
      },
    })
  }

  function copyLink(code: string) {
    const link = `${siteUrl}?code=${code}` // Simplified link logic
    navigator.clipboard.writeText(link)
    toast.success("Link copied to clipboard")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitation Codes</CardTitle>
        <CardDescription>
          Manage invitation codes for special access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form ref={formRef} action={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end border p-4 rounded-md bg-muted/20">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" name="companyName" required placeholder="e.g. Partner Corp" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" required placeholder="e.g. VIP2025" />
          </div>
          <Button type="submit" disabled={isPending}>Create Code</Button>
        </form>

        <div className="border rounded-md">
            <div className="grid grid-cols-6 p-3 font-medium text-sm bg-muted/50 border-b">
                <div>Company</div>
                <div>Code</div>
                <div>Invite Link</div>
                <div>Status</div>
                <div>Created At</div>
                <div className="text-right">Actions</div>
            </div>
            {codes.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">No invitation codes created yet.</div>
            )}
            {codes.map((item) => (
                <div key={item.id} className="grid grid-cols-6 p-3 text-sm items-center border-b last:border-0 hover:bg-muted/10 transition-colors">
                    <div className="font-medium">{item.companyName}</div>
                    <div>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{item.code}</code>
                    </div>
                    <div className="truncate text-xs text-muted-foreground pr-2" title={`${siteUrl}?code=${item.code}`}>
                        {siteUrl}?code={item.code}
                    </div>
                     <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {item.isUsed ? 'Used' : 'Available'}
                        </span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                        {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex justify-end gap-2">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => copyLink(item.code)}
                            title="Copy Link"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        
                        <Dialog open={!!editingCode && editingCode.id === item.id} onOpenChange={(open) => !open && setEditingCode(null)}>
                            <DialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setEditingCode(item)}
                                    title="Edit Code"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Invitation Code</DialogTitle>
                                    <DialogDescription>
                                        Update the company name and code.
                                    </DialogDescription>
                                </DialogHeader>
                                <form action={handleUpdate} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-companyName">Company Name</Label>
                                        <Input id="edit-companyName" name="companyName" defaultValue={item.companyName} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-code">Code</Label>
                                        <Input id="edit-code" name="code" defaultValue={item.code} required />
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setEditingCode(null)}>Cancel</Button>
                                        <Button type="submit" disabled={isPending}>Save Changes</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(item.id)}
                            disabled={isPending}
                            title="Delete Code"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}


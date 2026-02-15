"use client"

import { useTransition, useRef } from "react"
import { toast } from "sonner"
import { createInvitationCode, deleteInvitationCode } from "@/app/actions/settings"
import { InvitationCode } from "@/lib/mock-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Copy, Trash2 } from "lucide-react"

interface InvitationCodeSettingsProps {
  codes: InvitationCode[]
  siteUrl: string
}

export function InvitationCodeSettings({ codes, siteUrl }: Readonly<InvitationCodeSettingsProps>) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

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

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this code?")) return
    startTransition(async () => {
      const result = await deleteInvitationCode(id)
      if (result.success) {
        toast.success("Code deleted")
      } else {
        toast.error("Failed to delete code")
      }
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
            <div className="grid grid-cols-4 p-3 font-medium text-sm bg-muted/50 border-b">
                <div>Company</div>
                <div>Code</div>
                <div>Created At</div>
                <div className="text-right">Actions</div>
            </div>
            {codes.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">No invitation codes created yet.</div>
            )}
            {codes.map((item) => (
                <div key={item.id} className="grid grid-cols-4 p-3 text-sm items-center border-b last:border-0 hover:bg-muted/10 transition-colors">
                    <div className="font-medium">{item.companyName}</div>
                    <div>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{item.code}</code>
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
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(item.id)}
                            disabled={isPending}
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

'use client'

import { useState } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createOrganizer, updateOrganizer, deleteOrganizer } from '@/app/actions/organizer'
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner' // Assuming sonner is installed, otherwise use alert or basic console

interface Organizer {
  id: string
  username: string
  role: string
  createdAt: Date
}

interface OrganizerListProps {
  organizers: Organizer[]
}

export function OrganizerList({ organizers }: OrganizerListProps) {
  const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form State
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function openCreate() {
    setSelectedOrganizer(null)
    setUsername('')
    setPassword('')
    setIsDialogOpen(true)
  }

  function openEdit(org: Organizer) {
    setSelectedOrganizer(org)
    setUsername(org.username)
    setPassword('') // Don't show existing password
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData()
    formData.append('username', username)
    if (password) formData.append('password', password)

    let result
    if (selectedOrganizer) {
      result = await updateOrganizer(selectedOrganizer.id, formData)
    } else {
      result = await createOrganizer(formData)
    }

    setLoading(false)

    if (result.success) {
      toast.success(selectedOrganizer ? 'Organizer updated' : 'Organizer created')
      setIsDialogOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  async function handleDelete(id: string) {
    toast("Delete this organizer?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          setLoading(true)
          const result = await deleteOrganizer(id)
          setLoading(false)

          if (result.success) {
            toast.success('Organizer deleted')
          } else {
            toast.error(result.error)
          }
        },
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Organizers</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Organizer
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No organizers found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              organizers.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.username}</TableCell>
                  <TableCell>{org.role}</TableCell>
                  <TableCell>{format(new Date(org.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(org)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(org.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedOrganizer ? 'Edit Organizer' : 'Add New Organizer'}</DialogTitle>
            <DialogDescription>
              {selectedOrganizer 
                ? 'Update the organizer account credentials.' 
                : 'Create a new account for an event organizer.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password {selectedOrganizer && '(Leave blank to keep unchanged)'}</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required={!selectedOrganizer}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedOrganizer ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

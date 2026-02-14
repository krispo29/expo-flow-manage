'use client'

import { useState, useRef } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2, Plus, Search, Loader2, Printer } from 'lucide-react'
import { createParticipant, updateParticipant, deleteParticipant } from '@/app/actions/participant'
import { toast } from 'sonner'
import { ParticipantExcelOperations } from './participant-excel'
import { BadgePrint } from './badge-print'
import { useReactToPrint } from 'react-to-print'

import { Participant } from '@/lib/mock-service'

interface ParticipantListProps {
  participants: Participant[]
  projectId: string
  onSearch: (query: string) => void
  onTypeFilter: (type: string) => void
  currentType: string
}

export function ParticipantList({ 
  participants, 
  projectId, 
  onSearch, 
  onTypeFilter,
  currentType 
}: ParticipantListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  
  // Print State
  const [printParticipant, setPrintParticipant] = useState<Participant | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Participant Badge",
    onAfterPrint: () => setPrintParticipant(null), // Optional cleanup
  })

  // Trigger print when a user is selected for printing
  const onPrintClick = (p: Participant) => {
    setPrintParticipant(p)
     // Wait for state to update and render the badge off-screen before printing
    setTimeout(() => {
        handlePrint()
    }, 100)
  }

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    onSearch(searchQuery)
  }

  function openCreate() {
    setSelectedParticipant(null)
    setIsDialogOpen(true)
  }

  function openEdit(p: Participant) {
    setSelectedParticipant(p)
    setIsDialogOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this participant?')) return
    
    setLoading(true)
    const result = await deleteParticipant(id)
    setLoading(false)

    if (result.success) {
      toast.success('Participant deleted')
    } else {
      toast.error(result.error)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append('projectId', projectId)

    let result
    if (selectedParticipant) {
      result = await updateParticipant(selectedParticipant.id, formData)
    } else {
      result = await createParticipant(formData)
    }

    setLoading(false)
    if (result.success) {
      toast.success(selectedParticipant ? 'Participant updated' : 'Participant created')
      setIsDialogOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Hidden Print Area */}
      <div style={{ display: "none" }}>
        <div ref={printRef}>
            {printParticipant && <BadgePrint participant={printParticipant} />}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <Input 
            placeholder="Search by name, email, company, code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
        <div className="flex gap-2">
          <Select value={currentType} onValueChange={onTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="INDIVIDUAL">Individual</SelectItem>
              <SelectItem value="GROUP">Group</SelectItem>
              <SelectItem value="ONSITE">Onsite</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="BY">Buyer (BY)</SelectItem>
              <SelectItem value="SPEAKER">Speaker</SelectItem>
              <SelectItem value="PRESS">Press</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Room</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No participants found.
                </TableCell>
              </TableRow>
            ) : (
              participants.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <span className="px-2 py-1 rounded-full bg-secondary text-xs">{p.type}</span>
                  </TableCell>
                  <TableCell>{p.code}</TableCell>
                  <TableCell>
                    {p.firstName} {p.lastName}
                    <div className="text-xs text-muted-foreground">{p.position}</div>
                  </TableCell>
                  <TableCell>{p.company}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs">{p.email}</div>
                      <div className="text-xs">{p.mobile}</div>
                    </div>
                  </TableCell>
                  <TableCell>{p.room}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Button variant="outline" size="icon" onClick={() => onPrintClick(p)} title="Print Badge">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id)}>
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

      <div className="pt-8 border-t">
        <h2 className="text-lg font-semibold mb-4">Data Management</h2>
        <ParticipantExcelOperations projectId={projectId} />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedParticipant ? 'Edit Participant' : 'Add Participant'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               {/* Same form fields as before */}
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue={selectedParticipant?.type || 'INDIVIDUAL'} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="GROUP">Group</SelectItem>
                    <SelectItem value="ONSITE">Onsite</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="BUY">Buyer (BY)</SelectItem>
                    <SelectItem value="SPEAKER">Speaker</SelectItem>
                    <SelectItem value="PRESS">Press</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code (VIP/Badge No)</Label>
                <Input id="code" name="code" defaultValue={selectedParticipant?.code || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" defaultValue={selectedParticipant?.firstName || ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" defaultValue={selectedParticipant?.lastName || ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={selectedParticipant?.email || ''} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input id="mobile" name="mobile" defaultValue={selectedParticipant?.mobile || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" defaultValue={selectedParticipant?.company || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" name="position" defaultValue={selectedParticipant?.position || ''} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="room">Room (For Pre-Reg)</Label>
                <Input id="room" name="room" defaultValue={selectedParticipant?.room || ''} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedParticipant ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

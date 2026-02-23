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
import { Pencil, Trash2, Plus, Search, Loader2, Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { Participant, createParticipant, updateParticipant, deleteParticipant, getParticipantById, type ParticipantDetail } from '@/app/actions/participant'
import { toast } from 'sonner'
import { ParticipantExcelOperations } from './participant-excel'
import { BadgePrint } from './badge-print'
import { useReactToPrint } from 'react-to-print'

const PAGE_SIZE = 10

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
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | ParticipantDetail | null>(null)
  
  // Print State
  const [printParticipant, setPrintParticipant] = useState<Participant | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  
  // Dialog Form State for controlled components
  const [attendeeType, setAttendeeType] = useState('VI')
  const [title, setTitle] = useState('Mr.')
  const [titleOther, setTitleOther] = useState('')
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Participant Badge",
    onAfterPrint: () => setPrintParticipant(null),
  })

  const onPrintClick = (p: Participant) => {
    setPrintParticipant(p)
    setTimeout(() => {
        handlePrint()
    }, 100)
  }

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Sliced participants for pagination
  const totalPages = Math.ceil(participants.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const currentParticipants = participants.slice(startIndex, endIndex)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page on search
    onSearch(searchQuery)
  }

  function handleTypeFilter(type: string) {
    setCurrentPage(1) // Reset to first page on filter
    onTypeFilter(type)
  }

  function openCreate() {
    setSelectedParticipant(null)
    setAttendeeType('VI')
    setTitle('Mr.')
    setTitleOther('')
    setIsDialogOpen(true)
  }

  async function openEdit(p: Participant) {
    setLoading(true)
    const result = await getParticipantById(p.registration_uuid)
    setLoading(false)

    if (result.success && result.data) {
      setSelectedParticipant(result.data)
      setAttendeeType(result.data.attendee_type_code || 'VI')
      setTitle(result.data.title || 'Mr.')
      setTitleOther(result.data.title_other || '')
    } else {
      // Fallback to participant data if detail fetch fails
      setSelectedParticipant(p)
      setAttendeeType(p.attendee_type_code || 'VI')
      setTitle(p.title || 'Mr.')
      setTitleOther('')
    }
    setIsDialogOpen(true)
  }

  function handleDelete(registrationUuid: string) {
    toast("Delete this participant?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          setLoading(true)
          const result = await deleteParticipant(registrationUuid)
          setLoading(false)

          if (result.success) {
            toast.success('Participant deleted')
          } else {
            toast.error(result.error)
          }
        },
      },
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    let result
    if (selectedParticipant) {
      result = await updateParticipant(selectedParticipant.registration_uuid, formData)
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

  function fillMockData() {
    const form = formRef.current
    if (!form) return
 
    const mockData = {
      first_name: 'John',
      last_name: 'Wick',
      email: `john.wick.${Math.floor(Math.random() * 1000)}@continental.com`,
      mobile_country_code: '+66',
      mobile_number: '0812345678',
      company_name: 'The Continental',
      job_position: 'Legendary Assassin',
      residence_country: 'Thailand',
      invitation_code: 'EXPO2024'
    }
 
    Object.entries(mockData).forEach(([key, value]) => {
      const input = form.querySelector(`[name="${key}"]`) as HTMLInputElement
      if (input) {
        input.value = value
      }
    })
 
    // Update Select States
    setAttendeeType('VI')
    setTitle('Mr.')
    setTitleOther('')

    toast.success('Mock data filled')
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
          <Select value={currentType} onValueChange={handleTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="VI">Visitor (VI)</SelectItem>
              <SelectItem value="VP">VIP (VP)</SelectItem>
              <SelectItem value="EX">Exhibitor (EX)</SelectItem>
              <SelectItem value="VG">VIP Group (VG)</SelectItem>
              <SelectItem value="BY">Buyer (BY)</SelectItem>
              <SelectItem value="SP">Speaker (SP)</SelectItem>
              <SelectItem value="PR">Press (PR)</SelectItem>
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No participants found.
                </TableCell>
              </TableRow>
            ) : (
              currentParticipants.map((p) => (
                <TableRow key={p.registration_uuid}>
                  <TableCell className="font-medium">
                    <span className="px-2 py-1 rounded-full bg-secondary text-xs">{p.attendee_type_code}</span>
                  </TableCell>
                  <TableCell>{p.registration_code}</TableCell>
                  <TableCell>
                    {p.first_name} {p.last_name}
                    <div className="text-xs text-muted-foreground">{p.job_position}</div>
                  </TableCell>
                  <TableCell>{p.company_name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs">{p.email}</div>
                      <div className="text-xs">Conferences: {p.conference_count}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {p.is_email_sent && (
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                          Email Sent
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Button variant="outline" size="icon" onClick={() => onPrintClick(p)} title="Print Badge">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.registration_uuid)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination Controls */}
        {participants.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-muted/5">
            <div className="text-sm text-muted-foreground italic">
              Showing <span className="font-medium text-foreground">{Math.min(startIndex + 1, participants.length)}</span> to{' '}
              <span className="font-medium text-foreground">{Math.min(endIndex, participants.length)}</span> of{' '}
              <span className="font-medium text-foreground">{participants.length}</span> participants
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1 min-w-[3rem] justify-center">
                <span className="text-sm font-medium">{currentPage}</span>
                <span className="text-sm text-muted-foreground mx-0.5">/</span>
                <span className="text-sm text-muted-foreground">{totalPages || 1}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="pt-8 border-t">
        <h2 className="text-lg font-semibold mb-4">Data Management</h2>
        <ParticipantExcelOperations projectId={projectId} />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center pr-8">
              <DialogTitle>{selectedParticipant ? 'Edit Participant' : 'Add Participant'}</DialogTitle>
              {!selectedParticipant && (
                <Button type="button" variant="outline" size="sm" onClick={fillMockData}>
                  Fill Mock Data
                </Button>
              )}
            </div>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="event_uuid" value="6109decb-d4e4-44e2-bb16-22eb0548e414" />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="attendee_type_code">Type</Label>
                <Select name="attendee_type_code" value={attendeeType} onValueChange={setAttendeeType} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VI">Visitor (VI)</SelectItem>
                    <SelectItem value="VP">VIP (VP)</SelectItem>
                    <SelectItem value="EX">Exhibitor (EX)</SelectItem>
                    <SelectItem value="VG">VIP Group (VG)</SelectItem>
                    <SelectItem value="BY">Buyer (BY)</SelectItem>
                    <SelectItem value="SP">Speaker (SP)</SelectItem>
                    <SelectItem value="PR">Press (PR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Select name="title" value={title} onValueChange={setTitle} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr.">Mr.</SelectItem>
                    <SelectItem value="Mrs.">Mrs.</SelectItem>
                    <SelectItem value="Ms.">Ms.</SelectItem>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {title === 'Other' && (
                <div className="space-y-2">
                  <Label htmlFor="title_other">Please specify *</Label>
                  <Input 
                    id="title_other" 
                    name="title_other" 
                    value={titleOther} 
                    onChange={(e) => setTitleOther(e.target.value)} 
                    required 
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input id="first_name" name="first_name" defaultValue={selectedParticipant?.first_name || ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input id="last_name" name="last_name" defaultValue={selectedParticipant?.last_name || ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" defaultValue={selectedParticipant?.email || ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile_country_code">Country Code *</Label>
                <Input id="mobile_country_code" name="mobile_country_code" defaultValue={(selectedParticipant as ParticipantDetail)?.mobile_country_code || "+66"} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number *</Label>
                <Input id="mobile_number" name="mobile_number" defaultValue={(selectedParticipant as ParticipantDetail)?.mobile_number || ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Company *</Label>
                <Input id="company_name" name="company_name" defaultValue={selectedParticipant?.company_name || ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_position">Position *</Label>
                <Input id="job_position" name="job_position" defaultValue={selectedParticipant?.job_position || ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="residence_country">Residence Country *</Label>
                <Input id="residence_country" name="residence_country" defaultValue={(selectedParticipant as ParticipantDetail)?.residence_country || "Thailand"} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="invitation_code">Invitation Code (Optional)</Label>
                <Input id="invitation_code" name="invitation_code" defaultValue={(selectedParticipant as ParticipantDetail)?.invitation_code || ""} />
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

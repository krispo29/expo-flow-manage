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
import { Checkbox } from "@/components/ui/checkbox"
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
import { Pencil, Trash2, Plus, Search, Loader2, Printer, ChevronLeft, ChevronRight, Mail, Calendar } from 'lucide-react'
import { 
  Participant, createParticipant, updateParticipant, deleteParticipant, getParticipantById, type ParticipantDetail,
  resendEmailConfirmation, getMyReservations, reserveConference, cancelConferenceReservation
} from '@/app/actions/participant'
import { getConferences, getRooms, type Conference, type Room } from '@/app/actions/conference'
import { toast } from 'sonner'
import { CountrySelector } from '@/components/CountrySelector'
import { countries } from '@/lib/countries'
import { ParticipantExcelOperations } from './participant-excel'
import { BadgePrint } from './badge-print'
import { useReactToPrint } from 'react-to-print'

const PAGE_SIZE = 10
const CONF_PAGE_SIZE = 9

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
  
  // Conference Dialog State
  const [isConfDialogOpen, setIsConfDialogOpen] = useState(false)
  const [confParticipant, setConfParticipant] = useState<Participant | null>(null)
  const [conferences, setConferences] = useState<Conference[]>([])
  const [reservations, setReservations] = useState<{conference_uuid: string}[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [confLoading, setConfLoading] = useState(false)
  const [confSearchQuery, setConfSearchQuery] = useState('')
  const [confCurrentPage, setConfCurrentPage] = useState(1)
  const [showOnlyReserved, setShowOnlyReserved] = useState(false)
  
  // Print State
  const [printParticipant, setPrintParticipant] = useState<Participant | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  
  // Dialog Form State for controlled components
  const [attendeeType, setAttendeeType] = useState('VI')
  const [title, setTitle] = useState('Mr')
  const [residenceCountry, setResidenceCountry] = useState('VN')
  const [mobileCountryCode, setMobileCountryCode] = useState('VN')
  
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
    setTitle('Mr')
    setResidenceCountry('VN')
    setMobileCountryCode('VN')
    setIsDialogOpen(true)
  }

  async function openEdit(p: Participant) {
    setLoading(true)
    const result = await getParticipantById(p.registration_uuid)
    setLoading(false)

    if (result.success && result.data) {
      setSelectedParticipant(result.data)
      setAttendeeType(result.data.attendee_type_code || 'VI')
      setTitle(result.data.title || 'Mr')
      const resCountryRaw = result.data.residence_country || 'Thailand'
      const found = countries.find(c =>
        c.name.toLowerCase() === resCountryRaw.toLowerCase() ||
        c.code.toLowerCase() === resCountryRaw.toLowerCase()
      )
      setResidenceCountry(found ? found.code : 'VN')

      const mccRaw = result.data.mobile_country_code || '84'
      const mccClean = mccRaw.startsWith('+') ? mccRaw : `+${mccRaw}`
      const foundMcc = countries.find(c => c.phoneCode === mccClean || c.phoneCode === mccRaw)
      setMobileCountryCode(foundMcc ? foundMcc.code : 'VN')
    } else {
      setSelectedParticipant(p)
      setAttendeeType(p.attendee_type_code || 'VI')
      setTitle(p.title || 'Mr')
      setResidenceCountry('VN')
      setMobileCountryCode('VN')
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

  function handleResendEmail(p: Participant) {
    toast(`Resend email confirmation to ${p.email}?`, {
      action: {
        label: "Send",
        onClick: () => {
          (async () => {
            setLoading(true)
            const result = await resendEmailConfirmation([p.registration_uuid])
            setLoading(false)

            if (result.success) {
              toast.success('Email confirmation sent')
            } else {
              toast.error(result.error || 'Failed to resend email')
            }
          })()
        },
      },
    })
  }

  async function openConferenceDialog(p: Participant) {
    setConfParticipant(p)
    setConfSearchQuery('')
    setConfCurrentPage(1)
    setShowOnlyReserved(false)
    setIsConfDialogOpen(true)
    setConfLoading(true)
    
    try {
      const [confRes, resRes, roomRes] = await Promise.all([
        getConferences(projectId),
        getMyReservations(p.registration_uuid),
        rooms.length > 0 ? Promise.resolve({ success: true, data: rooms }) : getRooms()
      ])
      
      if (confRes.success) setConferences(confRes.data || [])
      if (resRes.success) setReservations(resRes.data || [])
      if (roomRes.success) setRooms(roomRes.data || [])
    } catch (error) {
      console.error('Failed to load conference data:', error)
      toast.error('Failed to load conference data')
    } finally {
      setConfLoading(false)
    }
  }

  async function handleReserve(confUuid: string) {
    if (!confParticipant) return
    setConfLoading(true)
    const result = await reserveConference(confUuid, confParticipant.registration_uuid)
    if (result.success) {
      toast.success('Reserved successfully')
      const resRes = await getMyReservations(confParticipant.registration_uuid)
      if (resRes.success) setReservations(resRes.data || [])
    } else {
      toast.error(result.error || 'Failed to reserve')
    }
    setConfLoading(false)
  }

  async function handleCancelReserve(confUuid: string) {
    if (!confParticipant) return
    setConfLoading(true)
    const result = await cancelConferenceReservation(confUuid, confParticipant.registration_uuid)
    if (result.success) {
      toast.success('Reservation cancelled successfully')
      const resRes = await getMyReservations(confParticipant.registration_uuid)
      if (resRes.success) setReservations(resRes.data || [])
    } else {
      toast.error(result.error || 'Failed to cancel reservation')
    }
    setConfLoading(false)
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
    setTitle('Mr')

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
                       <Button variant="outline" size="icon" onClick={() => handleResendEmail(p)} title="Resend Email">
                         <Mail className="h-4 w-4 text-blue-500" />
                       </Button>
                       <Button variant="outline" size="icon" onClick={() => openConferenceDialog(p)} title="Manage Conferences">
                         <Calendar className="h-4 w-4 text-green-600" />
                       </Button>
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
                    {Array.from(new Set(['Mr', 'Mr.', 'Mrs', 'Mrs.', 'Ms', 'Ms.', 'Dr', 'Dr.', 'Prof', 'Prof.', title])).filter(Boolean).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <Label>Country Code *</Label>
                <CountrySelector
                  value={mobileCountryCode}
                  onChange={setMobileCountryCode}
                  label=""
                  placeholder="Select"
                  displayProperty="phoneCode"
                />
                <input
                  type="hidden"
                  name="mobile_country_code"
                  value={countries.find(c => c.code === mobileCountryCode)?.phoneCode || mobileCountryCode}
                />
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
                <Label>Residence Country *</Label>
                <CountrySelector
                  value={residenceCountry}
                  onChange={setResidenceCountry}
                  label=""
                  placeholder="Select country"
                />
                <input
                  type="hidden"
                  name="residence_country"
                  value={countries.find(c => c.code === residenceCountry)?.name || residenceCountry}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="invitation_code">Invitation Code {selectedParticipant ? "(Cannot be changed)" : "(Optional)"}</Label>
                <Input 
                  id="invitation_code" 
                  name="invitation_code" 
                  defaultValue={(selectedParticipant as ParticipantDetail)?.invitation_code || ""} 
                  disabled={!!selectedParticipant}
                  className={selectedParticipant ? "bg-muted cursor-not-allowed" : ""}
                />
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

      <Dialog open={isConfDialogOpen} onOpenChange={setIsConfDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[1000px] xl:max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl">Manage Conferences for <span className="text-primary">{confParticipant?.first_name} {confParticipant?.last_name}</span></DialogTitle>
          </DialogHeader>
          <div className="pt-2 pb-0 space-y-3">
             <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
               <div className="relative flex-1 w-full">
                 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                 <Input 
                   placeholder="Search conferences by title, speaker, or room..." 
                   value={confSearchQuery}
                   onChange={(e) => {
                     setConfSearchQuery(e.target.value)
                     setConfCurrentPage(1)
                   }}
                   className="pl-9 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/50"
                 />
               </div>
               <div className="flex items-center space-x-2 bg-muted/20 px-3 py-2 rounded-md border border-muted-foreground/10 h-10 shrink-0">
                 <Checkbox 
                   id="show-only-reserved" 
                   checked={showOnlyReserved}
                   onCheckedChange={(checked) => {
                     setShowOnlyReserved(checked as boolean)
                     setConfCurrentPage(1)
                   }}
                 />
                 <Label 
                   htmlFor="show-only-reserved" 
                   className="text-sm font-medium leading-none cursor-pointer select-none"
                 >
                   Show Only Reserved
                 </Label>
               </div>
             </div>
          </div>
          <div className="space-y-4 mt-2 overflow-y-auto flex-1 p-1">
            {confLoading && conferences.length === 0 ? (
               <div className="flex justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>
            ) : (
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {conferences.length === 0 ? (
                   <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border">
                     No conferences available at this time.
                   </div>
                 ) : (
                   (() => {
                     let filtered = Array.from(new Map(conferences.map(c => [c.conference_uuid, c])).values());
                     
                     // Filter by reservation status
                     if (showOnlyReserved) {
                       filtered = filtered.filter(conf => 
                         (reservations || []).some(r => r.conference_uuid === conf.conference_uuid)
                       );
                     }

                     if (confSearchQuery.trim()) {
                       const query = confSearchQuery.toLowerCase();
                       filtered = filtered.filter(conf => {
                         const room = rooms.find(r => r.room_uuid === conf.location);
                         const locationName = room ? room.room_name.toLowerCase() : conf.location.toLowerCase();
                         return (
                           conf.title.toLowerCase().includes(query) ||
                           conf.speaker_name.toLowerCase().includes(query) ||
                           locationName.includes(query)
                         );
                       });
                     }
                     
                     if (filtered.length === 0) {
                       return (
                         <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                           No conferences found matching &quot;{confSearchQuery}&quot;
                         </div>
                       );
                     }
                   
                     const totalConfPages = Math.ceil(filtered.length / CONF_PAGE_SIZE)
                     const startIdx = (confCurrentPage - 1) * CONF_PAGE_SIZE
                     const currentConfs = filtered.slice(startIdx, startIdx + CONF_PAGE_SIZE)

                     return (
                       <>
                         <div className="col-span-full grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                           {currentConfs.map((conf, index) => {
                             const reserved = (reservations || []).some(r => r.conference_uuid === conf.conference_uuid);
                             const room = rooms.find(r => r.room_uuid === conf.location);
                             const locationName = room ? room.room_name : conf.location;
                             
                             return (
                               <div key={`${conf.conference_uuid}-${index}`} className={`relative p-5 rounded-xl border transition-all duration-200 flex flex-col h-full ${reserved ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-card hover:shadow-md'}`}>
                                 {reserved && (
                                   <div className="absolute top-3 right-3 z-10">
                                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow-sm">
                                       Reserved
                                     </span>
                                   </div>
                                 )}
                                 <div className="space-y-4 flex-1 flex flex-col">
                                   <div>
                                     <h4 className="font-semibold text-lg line-clamp-2 pr-16 leading-tight" title={conf.title}>{conf.title}</h4>
                                     <p className="text-sm text-primary/80 font-medium mt-1">By {conf.speaker_name}</p>
                                   </div>
                                   
                                   <div className="grid gap-2.5 text-sm text-muted-foreground mt-auto pt-2">
                                     <div className="flex items-center gap-2">
                                       <Calendar className="h-4 w-4 shrink-0 opacity-70" />
                                       <span>{conf.show_date} • {conf.start_time.substring(0, 5)} - {conf.end_time.substring(0, 5)}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                       <div className="h-4 w-4 shrink-0 flex items-center justify-center opacity-70">
                                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                       </div>
                                       <span className="truncate" title={locationName}>{locationName}</span>
                                     </div>
                                   </div>
                                   
                                   <div className="pt-3 mt-1 flex items-center justify-between border-t border-border/50">
                                     <div className="text-sm flex flex-col">
                                       <div className="flex items-baseline gap-1">
                                         <span className={`font-semibold ${conf.remaining_seats > 0 ? 'text-foreground' : 'text-destructive'}`}>{conf.remaining_seats}</span>
                                         <span className="text-muted-foreground text-xs">/ {conf.quota}</span>
                                       </div>
                                       <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">seats left</span>
                                     </div>
                                     <div>
                                       {reserved ? (
                                         <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 w-full shadow-sm" size="sm" onClick={() => handleCancelReserve(conf.conference_uuid)} disabled={confLoading}>
                                           Cancel
                                         </Button>
                                       ) : (
                                         <Button variant={conf.remaining_seats > 0 && conf.can_book ? "default" : "secondary"} className="w-full shadow-sm" size="sm" onClick={() => handleReserve(conf.conference_uuid)} disabled={confLoading || !conf.can_book || conf.remaining_seats <= 0}>
                                           {conf.remaining_seats > 0 ? 'Reserve Seat' : 'Full'}
                                         </Button>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                         
                         {totalConfPages > 1 && (
                           <div className="col-span-full flex items-center justify-between pt-4 mt-2 border-t text-sm">
                             <div className="text-muted-foreground">
                               Showing <span className="font-medium text-foreground">{startIdx + 1}</span> to <span className="font-medium text-foreground">{Math.min(startIdx + CONF_PAGE_SIZE, filtered.length)}</span> of <span className="font-medium text-foreground">{filtered.length}</span> results
                             </div>
                             <div className="flex gap-2">
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 onClick={() => setConfCurrentPage(prev => Math.max(1, prev - 1))}
                                 disabled={confCurrentPage === 1}
                               >
                                 <ChevronLeft className="h-4 w-4 mr-1" />
                                 Previous
                               </Button>
                               <div className="flex items-center px-4 font-medium">
                                 {confCurrentPage} / {totalConfPages}
                               </div>
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 onClick={() => setConfCurrentPage(prev => Math.min(totalConfPages, prev + 1))}
                                 disabled={confCurrentPage === totalConfPages}
                               >
                                 Next
                                 <ChevronRight className="h-4 w-4 ml-1" />
                               </Button>
                             </div>
                           </div>
                         )}
                       </>
                     );
                   })()
                 )}
               </div>
            )}
          </div>
          <DialogFooter className="mt-2 pt-4 border-t">
             <Button variant="outline" onClick={() => setIsConfDialogOpen(false)}>Close Window</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

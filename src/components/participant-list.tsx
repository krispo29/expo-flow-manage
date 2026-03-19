'use client'

import { useState, useRef, useMemo } from 'react'
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
import { Separator } from "@/components/ui/separator"

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
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2, Plus, Search, Loader2, Printer, ChevronLeft, ChevronRight, Mail, Calendar, Building2 } from 'lucide-react'
import { 
  Participant, createParticipant, updateParticipant, deleteParticipant, getParticipantById, type ParticipantDetail,
  resendEmailConfirmation, getMyReservations, reserveConference, cancelConferenceReservation,
  printParticipantBadge
} from '@/app/actions/participant'
import { getConferences, getRooms, type Conference, type Room } from '@/app/actions/conference'
import { toast } from 'sonner'
import { CountrySelector } from '@/components/CountrySelector'
import { countries } from '@/lib/countries'
import { printBadge } from '@/utils/print-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10
const CONF_PAGE_SIZE = 9

interface ParticipantListProps {
  participants: Participant[]
  projectId: string
}

export function ParticipantList({ 
  participants, 
  projectId, 
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
  
  const formRef = useRef<HTMLFormElement>(null)
  
  // Dialog Form State for controlled components
  const [attendeeType, setAttendeeType] = useState('VI')
  const [title, setTitle] = useState('Mr')
  const [residenceCountry, setResidenceCountry] = useState('VN')
  const [mobileCountryCode, setMobileCountryCode] = useState('VN')
  
  const onPrintClick = async (p: Participant) => {
    toast.promise(printParticipantBadge(projectId, p.registration_uuid), {
      loading: 'Printing badge...',
      success: (res) => {
        if (!res.success) {
          throw new Error(res.error || 'Failed to print badge')
        }
        try {
          printBadge({
            firstName: p.first_name || '',
            lastName: p.last_name || '',
            companyName: p.company_name || '',
            country: (p as ParticipantDetail).residence_country || 'THAILAND',
            registrationCode: p.registration_code || '',
            category: p.attendee_type_code || 'VISITOR',
          })
        } catch (e) {
          console.error("Local print failed", e)
        }
        return 'Badge print triggered'
      },
      error: 'Failed to print badge'
    })
  }

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  // Email Dialog State
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailTarget, setEmailTarget] = useState<Participant | null>(null)
  const [targetEmail, setTargetEmail] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  // Client-side filtering
  const filteredParticipants = useMemo(() => {
    let filtered = participants
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.first_name.toLowerCase().includes(lowerQuery) ||
        p.last_name.toLowerCase().includes(lowerQuery) ||
        p.email.toLowerCase().includes(lowerQuery) ||
        p.company_name.toLowerCase().includes(lowerQuery) ||
        p.registration_code.toLowerCase().includes(lowerQuery)
      )
    }
    if (typeFilter && typeFilter !== 'ALL') {
      filtered = filtered.filter(p => p.attendee_type_code === typeFilter)
    }
    return filtered
  }, [participants, searchQuery, typeFilter])

  // Sliced participants for pagination
  const totalPages = Math.ceil(filteredParticipants.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const currentParticipants = filteredParticipants.slice(startIndex, endIndex)


  function handleTypeFilter(type: string) {
    setTypeFilter(type)
    setCurrentPage(1) // Reset to first page on filter
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

  function handleOpenEmailDialog(p: Participant) {
    setEmailTarget(p)
    setTargetEmail(p.email || '')
    setEmailDialogOpen(true)
  }

  async function handleSendEmail() {
    if (!emailTarget) return
    setSendingEmail(true)
    const result = await resendEmailConfirmation([{
      registration_uuid: emailTarget.registration_uuid,
      email: targetEmail
    }])
    setSendingEmail(false)

    if (result.success) {
      toast.success('Email confirmation sent')
      setEmailDialogOpen(false)
    } else {
      toast.error(result.error || 'Failed to resend email')
    }
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


  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Card className="glass shadow-xl shadow-primary/5 border-white/10">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-6">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-display">Participants</CardTitle>
              <CardDescription className="font-medium">Filter and manage all event attendees.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Name, Email, Company, Code..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-11 h-11 bg-white/5 border-white/10 rounded-2xl focus-visible:ring-primary/30 transition-all focus:bg-white/10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={handleTypeFilter}>
                  <SelectTrigger className="h-11 w-[160px] bg-white/5 border-white/10 rounded-2xl font-medium">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10">
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
                <Button onClick={openCreate} className="btn-aurora h-11 px-6 rounded-2xl font-bold shadow-lg shadow-primary/20">
                  <Plus className="h-5 w-5 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          
          {/* Mobile View: Cards */}
          <div className="md:hidden divide-y divide-white/5">
            {currentParticipants.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground italic font-medium">
                No participants captured matching your matrix.
              </div>
            ) : (
              currentParticipants.map((p, i) => (
                <div key={p.registration_uuid || i} className="p-6 space-y-4 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-bold text-lg text-foreground line-clamp-1">{p.first_name} {p.last_name}</p>
                      <code className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">{p.registration_code}</code>
                    </div>
                    <Badge variant="outline" className="font-bold text-[9px] border-white/10 uppercase bg-white/5">{p.attendee_type_code}</Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground/80 font-medium">
                      <Building2 className="h-4 w-4 shrink-0 text-primary/40" />
                      <span className="truncate">{p.company_name || '---'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground/80 font-medium italic">
                      <Mail className="h-4 w-4 shrink-0 text-primary/40" />
                      <span className="truncate">{p.email || '---'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge className={cn("rounded-full px-3 text-[10px] font-bold", p.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {p.is_email_sent && (
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 rounded-full px-3 text-[10px] font-bold">Email Sent</Badge>
                    )}
                    <Badge variant="secondary" className="bg-white/5 border-white/5 rounded-full px-3 text-[10px] font-bold">Confs: {p.conference_count}</Badge>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2">
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white/5 border-white/10 hover:bg-purple-500/10 hover:text-purple-500" onClick={() => handleOpenEmailDialog(p)} title="Resend Email">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white/5 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-500" onClick={() => openConferenceDialog(p)} title="Manage Conferences">
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white/5 border-white/10 hover:bg-primary/10 hover:text-primary" onClick={() => onPrintClick(p)} title="Print Badge">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <div className="flex-1" />
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/10" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(p.registration_uuid)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-[100px] font-bold text-[10px] uppercase tracking-widest pl-6">Type</TableHead>
                  <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-widest">Code</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Participant Information</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Company / Org</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status / Email</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentParticipants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 italic text-muted-foreground font-medium">
                      No participants found matching your matrix.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentParticipants.map((p, i) => (
                    <TableRow key={p.registration_uuid || i} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="pl-6">
                        <Badge variant="outline" className="font-bold text-[9px] border-white/10 uppercase bg-white/5">{p.attendee_type_code}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">{p.registration_code}</code>
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{p.first_name} {p.last_name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium mt-0.5">
                          <Mail className="h-3 w-3 opacity-40" />
                          {p.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-bold text-foreground/80">{p.company_name || '---'}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 uppercase font-mono mt-0.5">{p.job_position || 'No position'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 items-start">
                          <Badge className={cn("rounded-full px-2 py-0 text-[9px] font-bold border", p.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')}>
                            {p.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {p.is_email_sent && (
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-500/80 uppercase">
                              <div className="size-1 rounded-full bg-blue-500 animate-pulse" />
                              Email Confirmed
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:bg-purple-500/10 hover:text-purple-500 group-hover:scale-110 transition-all duration-300" onClick={() => handleOpenEmailDialog(p)} title="Resend Email">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:text-emerald-500 group-hover:scale-110 transition-all duration-300" onClick={() => openConferenceDialog(p)} title="Manage Conferences">
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:bg-primary/10 hover:text-primary group-hover:scale-110 transition-all duration-300" onClick={() => onPrintClick(p)} title="Print Badge">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/10 group-hover:scale-110 transition-all duration-300" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive group-hover:scale-110 transition-all duration-300" onClick={() => handleDelete(p.registration_uuid)}>
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

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4 border-t border-white/5 bg-white/5">
            <div className="text-sm text-muted-foreground italic font-medium">
              Visualizing <span className="text-foreground">{filteredParticipants.length > 0 ? startIndex + 1 : 0}</span> to <span className="text-foreground">{Math.min(endIndex, filteredParticipants.length)}</span> of <span className="text-foreground font-bold">{filteredParticipants.length}</span> attendees
            </div>
            
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full bg-white/5 border-white/10"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1 mx-2">
                <span className="text-sm font-bold text-foreground">{currentPage}</span>
                <span className="text-sm text-muted-foreground/40 font-normal">/</span>
                <span className="text-sm text-muted-foreground font-bold">{totalPages || 1}</span>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full bg-white/5 border-white/10"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass sm:max-w-5xl border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                {selectedParticipant ? <Pencil className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">{selectedParticipant ? 'Edit Identity' : 'Create Participant'}</DialogTitle>
                <DialogDescription className="font-medium italic">
                  Complete the profile matrix to {selectedParticipant ? 'update existing metadata' : 'initialize a new registration'}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="p-8">
            <input type="hidden" name="event_uuid" value="6109decb-d4e4-44e2-bb16-22eb0548e414" />
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-1">
              <div className="space-y-2.5">
                <Label htmlFor="attendee_type_code" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Profile Category</Label>
                <Select name="attendee_type_code" value={attendeeType} onValueChange={setAttendeeType} required>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl focus:bg-white/10 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10">
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
              <div className="space-y-2.5">
                <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Title</Label>
                <Select name="title" value={title} onValueChange={setTitle} required>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl focus:bg-white/10 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10">
                    {Array.from(new Set(['Mr', 'Mr.', 'Mrs', 'Mrs.', 'Ms', 'Ms.', 'Dr', 'Dr.', 'Prof', 'Prof.', title])).filter(Boolean).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="first_name" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">First Name *</Label>
                <Input id="first_name" name="first_name" placeholder="e.g. John" defaultValue={selectedParticipant?.first_name || ''} required className="h-12 bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="last_name" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Last Name *</Label>
                <Input id="last_name" name="last_name" placeholder="e.g. Doe" defaultValue={selectedParticipant?.last_name || ''} required className="h-12 bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="space-y-2.5 sm:col-span-2">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Email *</Label>
                <Input id="email" name="email" type="email" placeholder="john.doe@example.com" defaultValue={selectedParticipant?.email || ''} required className="h-12 bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Country Code *</Label>
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
              <div className="space-y-2.5 sm:col-span-2">
                <Label htmlFor="mobile_number" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Mobile Number*</Label>
                <Input id="mobile_number" name="mobile_number" placeholder="e.g. 0812345678" defaultValue={(selectedParticipant as ParticipantDetail)?.mobile_number || ""} required className="h-12 bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="space-y-2.5 sm:col-span-2">
                <Label htmlFor="company_name" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Company *</Label>
                <Input id="company_name" name="company_name" placeholder="Company/Organization Name" defaultValue={selectedParticipant?.company_name || ''} required className="h-12 bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="job_position" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Position *</Label>
                <Input id="job_position" name="job_position" placeholder="Job Title / Position" defaultValue={selectedParticipant?.job_position || ''} required className="h-12 bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="space-y-2.5 sm:col-span-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Residence Country *</Label>
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
              <div className="space-y-2.5 sm:col-span-3">
                <Label htmlFor="invitation_code" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Access/Invitation Token {selectedParticipant ? "(Locked)" : "(Optional)"}</Label>
                <Input 
                  id="invitation_code" 
                  name="invitation_code" 
                  defaultValue={(selectedParticipant as ParticipantDetail)?.invitation_code || ""} 
                  disabled={!!selectedParticipant}
                  placeholder="Optional access code"
                  className={cn("h-12 rounded-xl", selectedParticipant ? "bg-white/5 border-white/5 text-muted-foreground cursor-not-allowed opacity-50" : "bg-white/5 border-white/10")}
                />
              </div>
            </div>
            <DialogFooter className="mt-8 pt-8 border-t border-white/5 flex sm:flex-row gap-3">
              <Button type="button" variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setIsDialogOpen(false)}>Abort</Button>
              <Button type="submit" disabled={loading} className="btn-aurora rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {selectedParticipant ? 'Save Changes' : 'Initialize Profile'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Email Confirmation Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="glass sm:max-w-[480px] border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                <Mail className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Email Protocol</DialogTitle>
                <DialogDescription className="font-medium italic">
                  Transmit confirmation payload to attendee.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
              <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Recipient Identity</p>
              <p className="text-sm font-bold text-foreground">
                {emailTarget?.first_name} {emailTarget?.last_name}
              </p>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="participantEmail" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Target Address</Label>
              <Input 
                id="participantEmail" 
                value={targetEmail} 
                onChange={e => setTargetEmail(e.target.value)} 
                className="h-12 bg-white/5 border-white/10 rounded-xl" 
                placeholder="example@email.com"
              />
            </div>
          </div>
          <DialogFooter className="p-8 bg-white/5 border-t border-white/10 flex sm:flex-row gap-3">
            <Button variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail} className="btn-aurora rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
              {sendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Dispatch Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conference Management Dialog */}
      <Dialog open={isConfDialogOpen} onOpenChange={setIsConfDialogOpen}>
        <DialogContent className="glass max-w-[95vw] sm:max-w-[90vw] lg:max-w-[1100px] border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden flex flex-col h-[90vh]">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10 shrink-0">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <Calendar className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-display font-bold">Session Matrix</DialogTitle>
                  <DialogDescription className="font-medium italic">
                    Manage conference allocations for <span className="text-foreground font-bold">{confParticipant?.first_name} {confParticipant?.last_name}</span>.
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-3 glass p-1.5 rounded-2xl border-white/10">
                <div className="relative w-48 sm:w-64 group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                   <Input 
                     placeholder="Search sessions..." 
                     value={confSearchQuery}
                     onChange={(e) => {
                       setConfSearchQuery(e.target.value)
                       setConfCurrentPage(1)
                     }}
                     className="pl-9 h-9 text-xs bg-white/5 border-white/5 rounded-xl focus:bg-white/10 transition-all"
                   />
                </div>
                <Separator orientation="vertical" className="h-6 bg-white/10" />
                <label className="flex items-center gap-2 cursor-pointer group px-2">
                   <Checkbox 
                     id="show-only-reserved" 
                     checked={showOnlyReserved}
                     onCheckedChange={(checked) => {
                       setShowOnlyReserved(checked as boolean)
                       setConfCurrentPage(1)
                     }}
                     className="size-3.5 border-white/20"
                   />
                   <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-tight">Reserved Only</span>
                </label>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-white/5">
            {confLoading && conferences.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full py-20">
                 <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                 <p className="text-sm font-bold tracking-widest uppercase opacity-40">Compiling sessions...</p>
               </div>
            ) : (
               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {(() => {
                     let filtered = Array.from(new Map(conferences.map(c => [c.conference_uuid, c])).values());
                     
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
                         <div className="col-span-full flex flex-col items-center justify-center py-24 text-center glass rounded-3xl border-dashed">
                           <Calendar className="h-12 w-12 text-muted-foreground/20 mb-4" />
                           <p className="text-lg font-display font-bold">No sessions found</p>
                           <p className="text-sm text-muted-foreground italic mt-2">Try adjusting your search matrix or filters.</p>
                         </div>
                       );
                     }
                   
                     const totalConfPages = Math.ceil(filtered.length / CONF_PAGE_SIZE)
                     const startIdx = (confCurrentPage - 1) * CONF_PAGE_SIZE
                     const currentConfs = filtered.slice(startIdx, startIdx + CONF_PAGE_SIZE)

                     return (
                       <>
                         {currentConfs.map((conf, index) => {
                             const reserved = (reservations || []).some(r => r.conference_uuid === conf.conference_uuid);
                             const room = rooms.find(r => r.room_uuid === conf.location);
                             const locationName = room ? room.room_name : conf.location;
                             
                             return (
                               <div key={`${conf.conference_uuid}-${index}`} className={cn("glass group/conf p-6 rounded-3xl border transition-all duration-500 flex flex-col h-full", reserved ? 'border-emerald-500/30 bg-emerald-500/5 shadow-lg shadow-emerald-500/5' : 'hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5')}>
                                 <div className="flex justify-between items-start mb-4">
                                   <Badge variant="secondary" className="text-[9px] font-black tracking-tighter border-0 bg-white/10 uppercase">
                                     {conf.conference_type || 'Session'}
                                   </Badge>
                                   {reserved && (
                                      <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-bold px-3 py-0.5 rounded-full animate-in zoom-in-50">RESERVED</Badge>
                                   )}
                                 </div>

                                 <div className="flex-1 space-y-4">
                                   <div>
                                     <h4 className="font-display font-bold text-lg leading-tight line-clamp-2 group-hover/conf:text-primary transition-colors">{conf.title}</h4>
                                     <div className="flex items-center gap-2 text-xs font-bold text-primary/60 mt-1.5 uppercase tracking-wide">
                                       <div className="size-1 rounded-full bg-primary/60" />
                                       {conf.speaker_name}
                                     </div>
                                   </div>
                                   
                                   <div className="space-y-2.5 text-[11px] font-medium text-muted-foreground/80">
                                     <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                                       <Calendar className="h-3.5 w-3.5 opacity-40" />
                                       <span>{conf.show_date} • {conf.start_time.substring(0, 5)} - {conf.end_time.substring(0, 5)}</span>
                                     </div>
                                     <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                                       <Building2 className="h-3.5 w-3.5 opacity-40" />
                                       <span className="truncate">{locationName}</span>
                                     </div>
                                   </div>
                                   
                                   <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
                                     <div className="space-y-0.5">
                                       <div className="flex items-baseline gap-1">
                                         <span className={cn("text-base font-display font-black", conf.remaining_seats > 0 ? 'text-foreground' : 'text-destructive')}>{conf.remaining_seats}</span>
                                         <span className="text-[10px] text-muted-foreground/40 font-bold">/ {conf.quota}</span>
                                       </div>
                                       <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Seats Left</p>
                                     </div>
                                     <div className="shrink-0">
                                       {reserved ? (
                                         <Button variant="ghost" size="sm" className="rounded-xl h-9 px-4 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10" onClick={() => handleCancelReserve(conf.conference_uuid)} disabled={confLoading}>
                                           Cancel
                                         </Button>
                                       ) : (
                                         <Button 
                                           variant={conf.remaining_seats > 0 && conf.can_book ? "default" : "secondary"} 
                                           size="sm"
                                           className={cn("rounded-xl h-9 px-4 text-xs font-bold uppercase tracking-widest", conf.remaining_seats > 0 && conf.can_book ? 'btn-aurora' : '')} 
                                           onClick={() => handleReserve(conf.conference_uuid)} 
                                           disabled={confLoading || !conf.can_book || conf.remaining_seats <= 0}
                                         >
                                           {conf.remaining_seats > 0 ? 'Reserve' : 'Full'}
                                         </Button>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                         
                         {totalConfPages > 1 && (
                           <div className="col-span-full flex flex-col sm:flex-row items-center justify-between pt-8 mt-4 border-t border-white/10 text-xs gap-4">
                             <div className="text-muted-foreground font-medium italic">
                               Visualizing <span className="text-foreground">{startIdx + 1}</span> to <span className="text-foreground">{Math.min(startIdx + CONF_PAGE_SIZE, filtered.length)}</span> of <span className="text-foreground font-bold">{filtered.length}</span> results
                             </div>
                             <div className="flex gap-2">
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="icon"
                                 className="h-8 w-8 rounded-full bg-white/5 border-white/10"
                                 onClick={() => setConfCurrentPage(prev => Math.max(1, prev - 1))}
                                 disabled={confCurrentPage === 1}
                               >
                                 <ChevronLeft className="h-4 w-4" />
                               </Button>
                               <div className="flex items-center px-4 font-bold">
                                 {confCurrentPage} <span className="mx-1 opacity-30 font-normal">/</span> {totalConfPages}
                               </div>
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="icon"
                                 className="h-8 w-8 rounded-full bg-white/5 border-white/10"
                                 onClick={() => setConfCurrentPage(prev => Math.min(totalConfPages, prev + 1))}
                                 disabled={confCurrentPage === totalConfPages}
                               >
                                 <ChevronRight className="h-4 w-4" />
                               </Button>
                             </div>
                           </div>
                         )}
                       </>
                     );
                   })()
                 }
               </div>
            )}
          </div>
          <DialogFooter className="p-6 bg-white/5 border-t border-white/10 shrink-0">
             <Button variant="ghost" className="rounded-2xl h-11 px-8 font-bold text-xs uppercase tracking-widest" onClick={() => setIsConfDialogOpen(false)}>Close Session Manager</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

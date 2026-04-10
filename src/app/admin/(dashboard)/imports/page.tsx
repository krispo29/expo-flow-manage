"use client"

import { useEffect, useMemo, useState, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Upload, Loader2, FileDown, Eye, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, History, Info, Users, User, Building2, Ticket, ShieldCheck, Mail, FileText, CalendarDays, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  getImportEvents,
  getImportExhibitors,
  getImportHistory,
  getImportHistoryCodes,
  getImportHistories,
  importConferencesExcel,
  importExhibitorMembers,
  importExhibitors,
  importInviteCodes,
  importRegistrations,
  importStaff,
  type ImportEvent,
  type ImportExhibitor,
  type ImportHistory,
} from '@/app/actions/import'
import { getAllAttendeeTypes, type AttendeeType } from '@/app/actions/participant'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

type ImportKind =
  | 'exhibitors'
  | 'exhibitor-members'
  | 'registrations'
  | 'staff'
  | 'conferences'
  | 'invite-codes'

const TEMPLATE_LINKS = {
  conferences: 'http://static.expoflow.co/template/Conference_Template.xlsx',
  exhibitors: 'http://static.expoflow.co/template/Exhibitor_Company_Template.xlsx',
  exhibitorMembers: 'http://static.expoflow.co/template/Exhibitor_Member_Template.xlsx',
  inviteCodes: 'http://static.expoflow.co/template/Invite_Code_Template.xlsx',
  registrations: 'http://static.expoflow.co/template/Registration_Template.xlsx',
  staff: 'http://static.expoflow.co/template/Staff_Template.xlsx',
}

function ImportsContent() {
  const [events, setEvents] = useState<ImportEvent[]>([])
  const [exhibitors, setExhibitors] = useState<ImportExhibitor[]>([])
  const [histories, setHistories] = useState<ImportHistory[]>([])
  const [attendeeTypes, setAttendeeTypes] = useState<AttendeeType[]>([])
  const [eventUuids, setEventUuids] = useState<Record<string, string>>({})
  const [exhibitorUuids, setExhibitorUuids] = useState<Record<string, string>>({})
  const [attendeeTypeCodes, setAttendeeTypeCodes] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<Record<ImportKind, File | null>>({
    exhibitors: null,
    'exhibitor-members': null,
    registrations: null,
    staff: null,
    conferences: null,
    'invite-codes': null,
  })
  const [loading, setLoading] = useState<Record<ImportKind, boolean>>({
    exhibitors: false,
    'exhibitor-members': false,
    registrations: false,
    staff: false,
    conferences: false,
    'invite-codes': false,
  })


  // View Codes Dialog State
  const [viewCodesUuid, setViewCodesUuid] = useState<string | null>(null)
  const [viewSearch, setViewSearch] = useState('')
  const [viewPage, setViewPage] = useState(1)
  const [viewCodesData, setViewCodesData] = useState<{ first_name: string; last_name: string; email: string; code: string }[]>([])
  const [viewLoading, setViewLoading] = useState(false)
  const [exportingCodesUuid, setExportingCodesUuid] = useState<string | null>(null)

  // View Details Dialog State
  const [viewDetailUuid, setViewDetailUuid] = useState<string | null>(null)
  const [detailData, setDetailData] = useState<ImportHistory | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  
  const filteredCodes = useMemo(() => {
    return viewCodesData.filter(d => 
      d.first_name.toLowerCase().includes(viewSearch.toLowerCase()) ||
      d.last_name.toLowerCase().includes(viewSearch.toLowerCase()) ||
      d.email.toLowerCase().includes(viewSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(viewSearch.toLowerCase())
    )
  }, [viewCodesData, viewSearch])

  const viewLimit = 50
  const totalPages = Math.ceil(filteredCodes.length / viewLimit)
  const paginatedCodes = useMemo(() => {
    const start = (viewPage - 1) * viewLimit
    return filteredCodes.slice(start, start + viewLimit)
  }, [filteredCodes, viewPage])

  // Reset page when search changes
  useEffect(() => {
    setViewPage(1)
  }, [viewSearch])

  const fetchHistories = async () => {
    const res = await getImportHistories()
    if (res.success) {
      setHistories(res.data)
    }
  }

  useEffect(() => {
    const run = async () => {
      const [eventsRes, exhibitorsRes, historiesRes, typesRes] = await Promise.all([
        getImportEvents(), 
        getImportExhibitors(),
        getImportHistories(),
        getAllAttendeeTypes()
      ])

      if (eventsRes.success) {
        setEvents(eventsRes.data)
        if (eventsRes.data.length > 0) {
          const defaultUuid = eventsRes.data[0].event_uuid
          setEventUuids({
            exhibitors: defaultUuid,
            registrations: defaultUuid,
            conferences: defaultUuid,
          })
        }
      }

      if (exhibitorsRes.success) {
        setExhibitors(exhibitorsRes.data)
        if (exhibitorsRes.data.length > 0) {
          const defaultUuid = exhibitorsRes.data[0].exhibitor_uuid
          setExhibitorUuids({
            'exhibitor-members': defaultUuid,
          })
        }
      }

      if (historiesRes.success) {
        setHistories(historiesRes.data)
      }

      if (typesRes.success) {
        setAttendeeTypes(typesRes.data)
      }
    }

    void run()
  }, [])

  const exhibitorOptions = useMemo(
    () =>
      exhibitors.map((item) => ({
        value: item.exhibitor_uuid,
        label: `${item.company_name} (${item.event_name})`,
      })),
    [exhibitors],
  )

  const eventOptions = useMemo(
    () =>
      events.map((item) => ({
        value: item.event_uuid,
        label: item.event_name,
      })),
    [events],
  )

  const attendeeTypeOptions = useMemo(
    () =>
      attendeeTypes.map((item) => ({
        value: item.type_code,
        label: `${item.type_name} (${item.type_code})`,
      })),
    [attendeeTypes],
  )

  const setFile = (kind: ImportKind, file: File | null) => {
    setFiles((prev) => ({ ...prev, [kind]: file }))
  }

  const getFilenameFromDisposition = (disposition: string | null) => {
    if (!disposition) return null

    const utfMatch = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
    if (utfMatch?.[1]) {
      return decodeURIComponent(utfMatch[1])
    }

    const basicMatch = disposition.match(/filename\s*=\s*"?(?:.+\/)?([^";]+)"?/i)
    return basicMatch?.[1] ?? null
  }

  const downloadFileFromUrl = async (url: string, fallbackFilename: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to export codes')
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = blobUrl
    link.download = getFilenameFromDisposition(response.headers.get('content-disposition')) ?? fallbackFilename

    document.body.appendChild(link)
    link.click()
    URL.revokeObjectURL(blobUrl)
    link.remove()
  }

  const handleExportCodes = async (importUuid: string) => {
    try {
      setExportingCodesUuid(importUuid)
      await downloadFileFromUrl(
        `/api/export/import-history-codes?uuid=${importUuid}`,
        `import_history_codes_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`
      )
    } catch (error) {
      console.error('Import history export error:', error)
      toast.error('Failed to export codes')
    } finally {
      setExportingCodesUuid((current) => (current === importUuid ? null : current))
    }
  }

  const runImport = async (kind: ImportKind) => {
    const file = files[kind]
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    if (kind === 'exhibitors' || kind === 'registrations' || kind === 'conferences') {
      const eventUuid = eventUuids[kind]
      if (!eventUuid) {
        toast.error('Please select event')
        return
      }
      formData.append('event_uuid', eventUuid)
    }

    if (kind === 'exhibitor-members') {
      const exhibitorUuid = exhibitorUuids[kind]
      if (!exhibitorUuid) {
        toast.error('Please select exhibitor')
        return
      }
      formData.append('exhibitor_uuid', exhibitorUuid)
    }

    if (kind === 'registrations') {
      const attendeeTypeCode = attendeeTypeCodes[kind]
      if (!attendeeTypeCode) {
        toast.error('Please select attendee type')
        return
      }
      formData.append('attendee_type_code', attendeeTypeCode)
    }

    setLoading((prev) => ({ ...prev, [kind]: true }))
    try {
      let result: { success: boolean; error?: string }
      switch (kind) {
        case 'exhibitors':
          result = await importExhibitors(formData)
          break
        case 'exhibitor-members':
          result = await importExhibitorMembers(formData)
          break
        case 'registrations':
          result = await importRegistrations(formData)
          break
        case 'staff':
          result = await importStaff(formData)
          break
        case 'conferences':
          result = await importConferencesExcel(formData)
          break
        case 'invite-codes':
          result = await importInviteCodes(formData)
          break
      }

      if (result.success) {
        toast.success('Import completed successfully')
        setFile(kind, null)
        void fetchHistories()
      } else {
        toast.error(result.error || 'Import failed')
      }
    } catch (error) {
      toast.error('Import failed')
    } finally {
      setLoading((prev) => ({ ...prev, [kind]: false }))
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Imports</h1>
        <p className="text-muted-foreground mt-1 font-sans">Bulk import data by template for admin project.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Import Exhibitors */}
        <Card className="glass shadow-xl shadow-primary/5 border-white/10 flex flex-col transition-all hover:shadow-primary/10">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-display">Import Exhibitors</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Event Selection</Label>
              <Combobox
                options={eventOptions}
                value={eventUuids.exhibitors}
                onValueChange={(val) => setEventUuids(prev => ({ ...prev, exhibitors: val }))}
                placeholder="Select event"
                emptyMessage="No events found"
                triggerClassName="h-11 bg-white/5 border-white/10 rounded-xl focus:bg-white/10 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Upload File (.xlsx, .xls)</Label>
              <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile('exhibitors', e.target.files?.[0] || null)} className="bg-white/5 border-white/10 h-11 rounded-xl cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-3 file:font-bold file:text-[10px]" />
            </div>
            <div className="flex gap-2 mt-auto pt-4">
              <Button className="flex-1 btn-aurora rounded-xl font-bold h-11 shadow-lg shadow-primary/20" onClick={() => void runImport('exhibitors')} disabled={loading.exhibitors}>
                {loading.exhibitors ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import
              </Button>
              <Button asChild variant="outline" className="rounded-xl h-11 border-white/10 bg-white/5 hover:bg-white/10 font-bold px-4">
                <a href={TEMPLATE_LINKS.exhibitors} target="_blank" rel="noreferrer">
                  <FileDown className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Exhibitor Members */}
        <Card className="glass shadow-xl shadow-primary/5 border-white/10 flex flex-col transition-all hover:shadow-primary/10">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <Users className="h-5 w-5 text-emerald-500" />
              </div>
              <CardTitle className="text-lg font-display">Import Exhibitor Members</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Exhibitor Selection</Label>
              <Combobox
                options={exhibitorOptions}
                value={exhibitorUuids['exhibitor-members']}
                onValueChange={(val) => setExhibitorUuids(prev => ({ ...prev, 'exhibitor-members': val }))}
                placeholder="Select exhibitor"
                emptyMessage="No exhibitors found"
                triggerClassName="h-11 bg-white/5 border-white/10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Upload File (.xlsx, .xls)</Label>
              <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile('exhibitor-members', e.target.files?.[0] || null)} className="bg-white/5 border-white/10 h-11 rounded-xl cursor-pointer file:bg-emerald-500/10 file:text-emerald-500 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-3 file:font-bold file:text-[10px]" />
            </div>
            <div className="flex gap-2 mt-auto pt-4">
              <Button className="flex-1 btn-aurora rounded-xl font-bold h-11 shadow-lg shadow-primary/20" onClick={() => void runImport('exhibitor-members')} disabled={loading['exhibitor-members']}>
                {loading['exhibitor-members'] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import
              </Button>
              <Button asChild variant="outline" className="rounded-xl h-11 border-white/10 bg-white/5 hover:bg-white/10 font-bold px-4">
                <a href={TEMPLATE_LINKS.exhibitorMembers} target="_blank" rel="noreferrer">
                  <FileDown className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Registrations */}
        <Card className="glass shadow-xl shadow-primary/5 border-white/10 flex flex-col transition-all hover:shadow-primary/10">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <CardTitle className="text-lg font-display">Import Registrations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Event</Label>
                <Combobox
                  options={eventOptions}
                  value={eventUuids.registrations}
                  onValueChange={(val) => setEventUuids(prev => ({ ...prev, registrations: val }))}
                  placeholder="Select"
                  emptyMessage="No events found"
                  triggerClassName="h-11 bg-white/5 border-white/10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Type</Label>
                <Combobox
                  options={attendeeTypeOptions}
                  value={attendeeTypeCodes.registrations}
                  onValueChange={(val) => setAttendeeTypeCodes((prev: Record<string, string>) => ({ ...prev, registrations: val }))}
                  placeholder="Select"
                  emptyMessage="No attendee types found"
                  triggerClassName="h-11 bg-white/5 border-white/10 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Upload File (.xlsx, .csv)</Label>
              <Input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile('registrations', e.target.files?.[0] || null)} className="bg-white/5 border-white/10 h-11 rounded-xl cursor-pointer file:bg-blue-500/10 file:text-blue-500 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-3 file:font-bold file:text-[10px]" />
            </div>
            <div className="flex gap-2 mt-auto pt-4">
              <Button className="flex-1 btn-aurora rounded-xl font-bold h-11 shadow-lg shadow-primary/20" onClick={() => void runImport('registrations')} disabled={loading.registrations}>
                {loading.registrations ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import
              </Button>
              <Button asChild variant="outline" className="rounded-xl h-11 border-white/10 bg-white/5 hover:bg-white/10 font-bold px-4">
                <a href={TEMPLATE_LINKS.registrations} target="_blank" rel="noreferrer">
                  <FileDown className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Staff */}
        <Card className="glass shadow-xl shadow-primary/5 border-white/10 flex flex-col transition-all hover:shadow-primary/10">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <ShieldCheck className="h-5 w-5 text-purple-500" />
              </div>
              <CardTitle className="text-lg font-display">Import Staff</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Upload File (.xlsx, .xls)</Label>
              <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile('staff', e.target.files?.[0] || null)} className="bg-white/5 border-white/10 h-11 rounded-xl cursor-pointer file:bg-purple-500/10 file:text-purple-500 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-3 file:font-bold file:text-[10px]" />
            </div>
            <div className="flex gap-2 mt-auto pt-4">
              <Button className="flex-1 btn-aurora rounded-xl font-bold h-11 shadow-lg shadow-primary/20" onClick={() => void runImport('staff')} disabled={loading.staff}>
                {loading.staff ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import
              </Button>
              <Button asChild variant="outline" className="rounded-xl h-11 border-white/10 bg-white/5 hover:bg-white/10 font-bold px-4">
                <a href={TEMPLATE_LINKS.staff} target="_blank" rel="noreferrer">
                  <FileDown className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Conferences */}
        <Card className="glass shadow-xl shadow-primary/5 border-white/10 flex flex-col transition-all hover:shadow-primary/10">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <CalendarDays className="h-5 w-5 text-amber-500" />
              </div>
              <CardTitle className="text-lg font-display">Import Conferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Event Selection</Label>
              <Combobox
                options={eventOptions}
                value={eventUuids.conferences}
                onValueChange={(val) => setEventUuids(prev => ({ ...prev, conferences: val }))}
                placeholder="Select event"
                emptyMessage="No events found"
                triggerClassName="h-11 bg-white/5 border-white/10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Upload File (.xlsx, .xls)</Label>
              <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile('conferences', e.target.files?.[0] || null)} className="bg-white/5 border-white/10 h-11 rounded-xl cursor-pointer file:bg-amber-500/10 file:text-amber-500 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-3 file:font-bold file:text-[10px]" />
            </div>
            <div className="flex gap-2 mt-auto pt-4">
              <Button className="flex-1 btn-aurora rounded-xl font-bold h-11 shadow-lg shadow-primary/20" onClick={() => void runImport('conferences')} disabled={loading.conferences}>
                {loading.conferences ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import
              </Button>
              <Button asChild variant="outline" className="rounded-xl h-11 border-white/10 bg-white/5 hover:bg-white/10 font-bold px-4">
                <a href={TEMPLATE_LINKS.conferences} target="_blank" rel="noreferrer">
                  <FileDown className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Invite Codes */}
        <Card className="glass shadow-xl shadow-primary/5 border-white/10 flex flex-col transition-all hover:shadow-primary/10">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Ticket className="h-5 w-5 text-rose-500" />
              </div>
              <CardTitle className="text-lg font-display">Import Invite Codes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Upload File (.xlsx, .xls)</Label>
              <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile('invite-codes', e.target.files?.[0] || null)} className="bg-white/5 border-white/10 h-11 rounded-xl cursor-pointer file:bg-rose-500/10 file:text-rose-500 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-3 file:font-bold file:text-[10px]" />
            </div>
            <div className="flex gap-2 mt-auto pt-4">
              <Button className="flex-1 btn-aurora rounded-xl font-bold h-11 shadow-lg shadow-primary/20" onClick={() => void runImport('invite-codes')} disabled={loading['invite-codes']}>
                {loading['invite-codes'] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import
              </Button>
              <Button asChild variant="outline" className="rounded-xl h-11 border-white/10 bg-white/5 hover:bg-white/10 font-bold px-4">
                <a href={TEMPLATE_LINKS.inviteCodes} target="_blank" rel="noreferrer">
                  <FileDown className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-display">Import History</CardTitle>
              <CardDescription className="font-medium italic">Tracking system-wide data ingestion events.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest pl-6">Type</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Temporal Node</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">File Identity</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Success</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Failed</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {histories.length > 0 ? (
                  histories.map((h) => (
                    <TableRow key={h.import_uuid} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="pl-6">
                        <Badge variant="outline" className="font-bold text-[9px] border-white/10 uppercase bg-white/5">{h.import_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold opacity-60 uppercase">{format(new Date(h.created_at), 'MMM d, yyyy')}</span>
                          <span className="text-[9px] font-mono font-medium opacity-30 tracking-widest">{format(new Date(h.created_at), 'HH:mm:ss')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[240px] truncate" title={h.original_file_name}>
                          <a href={h.original_file_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary/80 hover:text-primary transition-colors">
                            {h.original_file_name}
                          </a>
                          <div className="text-[10px] text-muted-foreground/40 font-mono uppercase tracking-tighter mt-0.5">ROWS: {h.total_rows}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-display font-black text-emerald-500">{h.success_count}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn("text-sm font-display font-black", h.failed_count > 0 ? 'text-red-500' : 'text-muted-foreground/20')}>{h.failed_count}</span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:bg-primary/10 hover:text-primary transition-all"
                            title="View Details"
                            onClick={async () => {
                              setViewDetailUuid(h.import_uuid)
                              setDetailLoading(true)
                              const res = await getImportHistory(h.import_uuid)
                              if (res.success) {
                                setDetailData(res.data!)
                              } else {
                                toast.error(res.error || 'Failed to fetch details')
                              }
                              setDetailLoading(false)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {h.import_type === 'registrations' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 px-4 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 font-bold text-[10px] uppercase tracking-widest"
                                onClick={async () => {
                                  setViewCodesUuid(h.import_uuid)
                                  setViewSearch('')
                                  setViewLoading(true)
                                  const codesRes = await getImportHistoryCodes(h.import_uuid)
                                  if (codesRes.success) {
                                    setViewCodesData(codesRes.data)
                                  } else {
                                    toast.error(codesRes.error || 'Failed to fetch codes')
                                  }
                                  setViewLoading(false)
                                }}
                              >
                                Codes
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-bold transition-all"
                                onClick={() => void handleExportCodes(h.import_uuid)}
                                disabled={exportingCodesUuid === h.import_uuid}
                                title="Export Codes"
                              >
                                {exportingCodesUuid === h.import_uuid ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                              </Button>
                            </>
                          )}
                        </div>
                        <div className="group-hover:hidden flex justify-end">
                           <Badge variant="outline" className="text-[8px] font-black tracking-widest opacity-20 border-white/10">ANALYSIS</Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center py-24 glass m-6 rounded-3xl border-dashed">
                      <div className="flex flex-col items-center gap-2">
                        <History className="h-10 w-10 text-primary/20" />
                        <p className="font-display font-bold text-muted-foreground">No ingestion history captured.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      <Dialog open={!!viewDetailUuid} onOpenChange={(open) => !open && setViewDetailUuid(null)}>
        <DialogContent className="glass sm:max-w-[480px] border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Import Intelligence</DialogTitle>
                <DialogDescription className="font-medium italic">Deep analysis of the ingestion pipeline.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8">
            {detailLoading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="text-xs font-bold tracking-widest uppercase opacity-40">Decrypting metadata...</span>
              </div>
            ) : detailData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Protocol Type</Label>
                    <p className="font-bold text-sm capitalize">{detailData.import_type}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Temporal Node</Label>
                    <p className="font-bold text-sm">{format(new Date(detailData.created_at), 'dd MMM yyyy HH:mm')}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Payload Volume</Label>
                    <p className="font-display font-black text-2xl text-primary">{detailData.total_rows}</p>
                  </div>
                  <div className="flex gap-6">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60">Success</Label>
                      <p className="font-display font-black text-2xl text-emerald-500">{detailData.success_count}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-rose-500/60">Failed</Label>
                      <p className={cn("font-display font-black text-2xl", detailData.failed_count > 0 ? "text-rose-500" : "text-muted-foreground/20")}>{detailData.failed_count}</p>
                    </div>
                  </div>
                </div>
                <Separator className="bg-white/5" />
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Artifact ID</Label>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group transition-all hover:bg-white/10">
                    <p className="text-xs font-mono font-bold break-all leading-relaxed">{detailData.original_file_name}</p>
                    <Button variant="link" className="px-0 h-auto text-primary text-[10px] font-bold uppercase tracking-widest mt-2 group-hover:pl-1 transition-all" asChild>
                      <a href={detailData.original_file_url} target="_blank" rel="noreferrer">
                        Access Source File <ChevronRight className="inline h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Operator</Label>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary/60" />
                    <p className="text-sm font-bold opacity-80">{detailData.created_by}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-10 w-10 text-red-500/20 mx-auto mb-3" />
                <p className="text-sm font-bold opacity-40">Pipeline failure: Metadata unreachable.</p>
              </div>
            )}
          </div>
          <DialogFooter className="p-6 bg-white/5 border-t border-white/10">
            <Button variant="ghost" className="rounded-2xl h-11 w-full font-bold text-xs uppercase tracking-widest" onClick={() => setViewDetailUuid(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewCodesUuid} onOpenChange={(open) => !open && setViewCodesUuid(null)}>
        <DialogContent className="glass sm:max-w-5xl border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden flex flex-col h-[85vh]">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Imported Intelligence</DialogTitle>
                <DialogDescription className="font-medium italic">
                  Showing <span className="text-foreground font-bold">{filteredCodes.length} nodes</span> synthesized in this operation.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="px-8 py-4 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="relative flex-1 w-full sm:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search Matrix: Name, Email, Code..." 
                className="pl-11 h-11 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 transition-all text-sm"
                value={viewSearch} 
                onChange={(e) => setViewSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 glass rounded-xl border-white/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span className="text-foreground">
                  {Math.min(filteredCodes.length, (viewPage - 1) * viewLimit + 1)}-{Math.min(filteredCodes.length, viewPage * viewLimit)}
                </span> / {filteredCodes.length}
              </div>
              {viewCodesUuid && (
                <Button 
                  size="sm"
                  className="btn-aurora rounded-xl h-10 px-5 font-bold text-xs shadow-lg shadow-primary/20"
                  onClick={() => void handleExportCodes(viewCodesUuid)}
                  disabled={exportingCodesUuid === viewCodesUuid}
                >
                  {exportingCodesUuid === viewCodesUuid ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                  {exportingCodesUuid === viewCodesUuid ? 'Exporting...' : 'Export All'}
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-white/5">
            <div className="overflow-auto flex-1 scrollbar-hide">
              <Table>
                <TableHeader className="sticky top-0 bg-background/50 backdrop-blur-md z-10 border-b border-white/10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[200px] font-bold text-[10px] uppercase tracking-widest pl-8">Participant Identity</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Communication Channel</TableHead>
                    <TableHead className="w-[180px] font-bold text-[10px] uppercase tracking-widest pr-8">Synthesized Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-64 text-center py-24">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          <p className="text-xs font-bold tracking-widest uppercase opacity-40 animate-pulse">Scanning records...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedCodes.length > 0 ? (
                    paginatedCodes.map((d) => (
                      <TableRow key={d.code} className="group border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="pl-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">
                              {d.first_name[0]}{d.last_name[0]}
                            </div>
                            <span className="font-bold text-sm group-hover:text-primary transition-colors">{d.first_name} {d.last_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-medium italic">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 opacity-40" />
                            {d.email}
                          </div>
                        </TableCell>
                        <TableCell className="pr-8">
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-black tracking-widest border border-primary/20 group-hover:shadow-glow-sm transition-all tabular-nums uppercase">
                            {d.code}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-64 text-center py-24">
                        <div className="flex flex-col items-center justify-center gap-4 glass m-8 rounded-3xl border-dashed">
                          <Search className="h-10 w-10 text-primary/20" />
                          <p className="font-display font-bold opacity-40">No records found in current matrix.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination UI */}
            <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between bg-white/5 gap-4 shrink-0">
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white/5 border-white/10" 
                  onClick={() => setViewPage(1)} disabled={viewPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white/5 border-white/10" 
                  onClick={() => setViewPage(p => Math.max(1, p - 1))} disabled={viewPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-2 mx-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">Page</span>
                  <span className="text-sm font-black text-foreground">
                    {viewPage}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">of {totalPages || 1}</span>
                </div>

                <Button 
                  variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white/5 border-white/10" 
                  onClick={() => setViewPage(p => Math.min(totalPages, p + 1))} disabled={viewPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white/5 border-white/10" 
                  onClick={() => setViewPage(totalPages)} disabled={viewPage === totalPages || totalPages === 0}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="ghost" className="rounded-xl h-10 px-8 font-bold text-xs uppercase tracking-widest" onClick={() => setViewCodesUuid(null)}>
                Close Matrix
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ImportsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <ImportsContent />
    </Suspense>
  )
}

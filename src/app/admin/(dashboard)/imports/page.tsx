"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Loader2, FileDown, Eye, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
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

export default function ImportsPage() {
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

  const setFile = (kind: ImportKind, file: File | null) => {
    setFiles((prev) => ({ ...prev, [kind]: file }))
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Imports</h1>
        <p className="text-muted-foreground">Bulk import data by template for admin project.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Import Exhibitors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Event</Label>
            <Select value={eventUuids.exhibitors} onValueChange={(val) => setEventUuids(prev => ({ ...prev, exhibitors: val }))}>
              <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
              <SelectContent>{events.map((e) => <SelectItem key={e.event_uuid} value={e.event_uuid}>{e.event_name}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile('exhibitors', e.target.files?.[0] || null)} />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => void runImport('exhibitors')} disabled={loading.exhibitors}>
                {loading.exhibitors ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import
              </Button>
              <Button asChild variant="outline"><a href={TEMPLATE_LINKS.exhibitors} target="_blank" rel="noreferrer"><FileDown className="mr-2 h-4 w-4" />Template</a></Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Exhibitor Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Exhibitor</Label>
            <Select value={exhibitorUuids['exhibitor-members']} onValueChange={(val) => setExhibitorUuids(prev => ({ ...prev, 'exhibitor-members': val }))}>
              <SelectTrigger><SelectValue placeholder="Select exhibitor" /></SelectTrigger>
              <SelectContent>{exhibitorOptions.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile('exhibitor-members', e.target.files?.[0] || null)} />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => void runImport('exhibitor-members')} disabled={loading['exhibitor-members']}>
                {loading['exhibitor-members'] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import
              </Button>
              <Button asChild variant="outline"><a href={TEMPLATE_LINKS.exhibitorMembers} target="_blank" rel="noreferrer"><FileDown className="mr-2 h-4 w-4" />Template</a></Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Registrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Event</Label>
            <Select value={eventUuids.registrations} onValueChange={(val) => setEventUuids(prev => ({ ...prev, registrations: val }))}>
              <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
              <SelectContent>{events.map((e) => <SelectItem key={e.event_uuid} value={e.event_uuid}>{e.event_name}</SelectItem>)}</SelectContent>
            </Select>

            <Label>Attendee Type</Label>
            <Select value={attendeeTypeCodes.registrations} onValueChange={(val) => setAttendeeTypeCodes((prev: Record<string, string>) => ({ ...prev, registrations: val }))}>
              <SelectTrigger><SelectValue placeholder="Select attendee type" /></SelectTrigger>
              <SelectContent>
                {attendeeTypes.map((t) => (
                  <SelectItem key={t.type_code} value={t.type_code}>
                    {t.type_name} ({t.type_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile('registrations', e.target.files?.[0] || null)} />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => void runImport('registrations')} disabled={loading.registrations}>
                {loading.registrations ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import
              </Button>
              <Button asChild variant="outline"><a href={TEMPLATE_LINKS.registrations} target="_blank" rel="noreferrer"><FileDown className="mr-2 h-4 w-4" />Template</a></Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Staff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile('staff', e.target.files?.[0] || null)} />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => void runImport('staff')} disabled={loading.staff}>
                {loading.staff ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import
              </Button>
              <Button asChild variant="outline"><a href={TEMPLATE_LINKS.staff} target="_blank" rel="noreferrer"><FileDown className="mr-2 h-4 w-4" />Template</a></Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Conferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Event</Label>
            <Select value={eventUuids.conferences} onValueChange={(val) => setEventUuids(prev => ({ ...prev, conferences: val }))}>
              <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
              <SelectContent>{events.map((e) => <SelectItem key={e.event_uuid} value={e.event_uuid}>{e.event_name}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile('conferences', e.target.files?.[0] || null)} />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => void runImport('conferences')} disabled={loading.conferences}>
                {loading.conferences ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import
              </Button>
              <Button asChild variant="outline"><a href={TEMPLATE_LINKS.conferences} target="_blank" rel="noreferrer"><FileDown className="mr-2 h-4 w-4" />Template</a></Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Invite Codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile('invite-codes', e.target.files?.[0] || null)} />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => void runImport('invite-codes')} disabled={loading['invite-codes']}>
                {loading['invite-codes'] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import
              </Button>
              <Button asChild variant="outline"><a href={TEMPLATE_LINKS.inviteCodes} target="_blank" rel="noreferrer"><FileDown className="mr-2 h-4 w-4" />Template</a></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Import History</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Rows</TableHead>
                <TableHead>Success</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {histories.length > 0 ? (
                histories.map((h) => (
                  <TableRow key={h.import_uuid}>
                    <TableCell className="font-medium capitalize text-xs">
                      {h.import_type}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={h.original_file_name}>
                      <a href={h.original_file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {h.original_file_name}
                      </a>
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(h.created_at), 'dd MMM yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{h.total_rows}</TableCell>
                    <TableCell className="text-emerald-600 font-medium">{h.success_count}</TableCell>
                    <TableCell className="text-rose-600 font-medium">{h.failed_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
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
                              variant="outline" 
                              size="sm" 
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
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                window.open(`/api/export/import-history-codes?uuid=${h.import_uuid}`, '_blank')
                              }}
                            >
                              <FileDown className="mr-2 h-4 w-4" />
                              Export
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No import history found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>


      <Dialog open={!!viewDetailUuid} onOpenChange={(open) => !open && setViewDetailUuid(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Details</DialogTitle>
            <DialogDescription>Full summary of the import operation.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {detailLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : detailData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase">Type</Label>
                    <p className="font-medium capitalize">{detailData.import_type}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase">Date</Label>
                    <p className="font-medium">{format(new Date(detailData.created_at), 'dd MMM yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase">Total Rows</Label>
                    <p className="font-medium text-lg">{detailData.total_rows}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase text-emerald-600">Success</Label>
                      <p className="font-medium text-lg text-emerald-600">{detailData.success_count}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase text-rose-600">Failed</Label>
                      <p className="font-medium text-lg text-rose-600">{detailData.failed_count}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <Label className="text-xs text-muted-foreground uppercase">Original File</Label>
                  <p className="font-medium break-all">{detailData.original_file_name}</p>
                  <Button variant="link" className="px-0 h-auto text-primary" asChild>
                    <a href={detailData.original_file_url} target="_blank" rel="noreferrer">Download original file</a>
                  </Button>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Created By</Label>
                  <p className="font-medium">{detailData.created_by}</p>
                </div>
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">Failed to load details.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDetailUuid(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewCodesUuid} onOpenChange={(open) => !open && setViewCodesUuid(null)}>
        <DialogContent className="sm:max-w-5xl p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">Imported Codes</DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1">
                  Showing {filteredCodes.length} codes generated for this session.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email, or code..." 
                className="pl-9 bg-background shadow-sm border-muted-foreground/20 focus-visible:ring-primary/30 transition-all"
                value={viewSearch} 
                onChange={(e) => setViewSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span>Showing</span>
              <span className="text-foreground font-semibold">
                {Math.min(filteredCodes.length, (viewPage - 1) * viewLimit + 1)} - {Math.min(filteredCodes.length, viewPage * viewLimit)}
              </span>
              <span>of</span>
              <span className="text-foreground font-semibold">{filteredCodes.length}</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="overflow-auto max-h-[50vh] min-h-[400px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[200px] font-semibold">First Name</TableHead>
                    <TableHead className="w-[200px] font-semibold">Last Name</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="w-[180px] font-semibold">Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground animate-pulse">Loading codes...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedCodes.length > 0 ? (
                    paginatedCodes.map((d) => (
                      <TableRow key={d.code} className="group hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{d.first_name}</TableCell>
                        <TableCell className="font-medium">{d.last_name}</TableCell>
                        <TableCell className="text-muted-foreground">{d.email}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground font-mono text-xs tabular-nums group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {d.code}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <div className="p-3 rounded-full bg-muted">
                            <Search className="h-6 w-6 opacity-20" />
                          </div>
                          <p className="font-medium text-foreground">No codes found</p>
                          <p className="text-sm">Try adjusting your search criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination UI */}
            <div className="p-4 border-t flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="outline" size="icon" className="h-8 w-8" 
                  onClick={() => setViewPage(1)} disabled={viewPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" size="icon" className="h-8 w-8" 
                  onClick={() => setViewPage(p => Math.max(1, p - 1))} disabled={viewPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1 px-2 mx-1">
                  <span className="text-sm font-medium">Page</span>
                  <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-0.5 rounded min-w-[24px] text-center">
                    {viewPage}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">of {totalPages || 1}</span>
                </div>

                <Button 
                  variant="outline" size="icon" className="h-8 w-8" 
                  onClick={() => setViewPage(p => Math.min(totalPages, p + 1))} disabled={viewPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" size="icon" className="h-8 w-8" 
                  onClick={() => setViewPage(totalPages)} disabled={viewPage === totalPages || totalPages === 0}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setViewCodesUuid(null)}>
                  Close
                </Button>
                {viewCodesUuid && (
                  <Button 
                    size="sm"
                    className="shadow-lg shadow-primary/20"
                    onClick={() => {
                      window.open(`/api/export/import-history-codes?uuid=${viewCodesUuid}`, '_blank')
                    }}
                  >
                    <FileDown className="mr-2 h-4 w-4" /> Export All
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

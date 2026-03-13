"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Loader2, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import {
  getImportEvents,
  getImportExhibitors,
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

  // Export Dialog State
  const [exportHistoryUuid, setExportHistoryUuid] = useState<string | null>(null)
  const [exportAttendeeType, setExportAttendeeType] = useState<string>('')

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
      console.error(error)
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
            <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile('registrations', e.target.files?.[0] || null)} />
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
                      {h.import_type === 'registrations' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setExportHistoryUuid(h.import_uuid)
                            setExportAttendeeType('')
                          }}
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          Download Codes
                        </Button>
                      )}
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

      <Dialog open={!!exportHistoryUuid} onOpenChange={(open) => !open && setExportHistoryUuid(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Codes</DialogTitle>
            <DialogDescription>Select attendee type to include in the exported codes file.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Attendee Type <span className="text-red-500">*</span></Label>
              <Select value={exportAttendeeType} onValueChange={setExportAttendeeType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {attendeeTypes.map((t) => (
                    <SelectItem key={t.type_code} value={t.type_code}>
                      {t.type_name} ({t.type_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportHistoryUuid(null)}>Cancel</Button>
            <Button 
              disabled={!exportAttendeeType} 
              onClick={() => {
                if (!exportHistoryUuid || !exportAttendeeType) return
                window.open(`/api/export/import-history-codes?uuid=${exportHistoryUuid}&attendee_type_code=${exportAttendeeType}`, '_blank')
                setExportHistoryUuid(null)
              }}
            >
              <FileDown className="mr-2 h-4 w-4" /> Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

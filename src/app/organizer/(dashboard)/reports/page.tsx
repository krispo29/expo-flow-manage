"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Calendar as CalendarIcon, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react"
import { format } from "date-fns"
import { organizerAdvancedSearch, exportOrganizerAdvancedSearch, getEventsForReport, type AdvancedSearchResult, type AdvancedSearchResponse, type Event as ReportEvent } from "@/app/actions/report"
import { getAllAttendeeTypes, type AttendeeType } from "@/app/actions/participant"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import * as XLSX from "xlsx"
import { CountrySelector } from "@/components/CountrySelector"
import { countries } from "@/lib/countries"
import { toast } from "sonner"

export default function ReportsPage() {
  // ─── Filter state ────────────────────────────────────────────────────────────
  const [keyword, setKeyword] = useState("")
  const [country, setCountry] = useState("")
  const [dateStart, setDateStart] = useState<Date>()
  const [dateEnd, setDateEnd] = useState<Date>()
  const [selectedTypeCodes, setSelectedTypeCodes] = useState<string[]>([])
  const [includeQuestionnaire, setIncludeQuestionnaire] = useState(false)
  const [includeStaff, setIncludeStaff] = useState(false)

  // ─── Pagination ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  // ─── Results ─────────────────────────────────────────────────────────────────
  const [results, setResults] = useState<AdvancedSearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [searched, setSearched] = useState(false)

  // ─── Attendee types & Events from API ─────────────────────────────────────────
  const [attendeeTypes, setAttendeeTypes] = useState<AttendeeType[]>([])
  const [events, setEvents] = useState<ReportEvent[]>([])
  const [selectedEventUuid, setSelectedEventUuid] = useState<string>("")

  // Fetch attendee types and events on mount
  useEffect(() => {
    getAllAttendeeTypes().then(res => {
      if (res.success && res.data) setAttendeeTypes(res.data)
    })
    getEventsForReport().then(res => {
      if (res.success && res.events) {
        setEvents(res.events)
        if (res.events.length > 0) setSelectedEventUuid(res.events[0].event_uuid)
      }
    })
  }, [])

  // ─── Excel Preview State & Logic ─────────────────────────────────────────────
  const [showPreview, setShowPreview] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewType, setPreviewType] = useState<string>("")
  const [previewData, setPreviewData] = useState<any[]>([])
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([])

  const handlePreview = async (type: string) => {
    if (!selectedEventUuid) return
    
    setPreviewType(type)
    setIsPreviewing(true)
    setShowPreview(true)
    setPreviewData([])
    setPreviewHeaders([])

    try {
      const response = await fetch(`/api/export/${type}?event_uuid=${selectedEventUuid}`)
      if (!response.ok) throw new Error('Failed to fetch Excel file')
      
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      
      // Parse with xlsx
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // Convert to array of objects
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" })
      
      if (jsonData.length > 0) {
        setPreviewHeaders(Object.keys(jsonData[0] as object))
        setPreviewData(jsonData)
      }
    } catch (error) {
      console.error("Preview error:", error)
      // Could show a toast here if needed
    } finally {
      setIsPreviewing(false)
    }
  }

  // ─── Search handler ──────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (searchPage = 1) => {
    setLoading(true)
    setSearched(true)
    setPage(searchPage)

    try {
      const res = await organizerAdvancedSearch({
        start_date: dateStart ? format(dateStart, "yyyy-MM-dd") : undefined,
        end_date: dateEnd ? format(dateEnd, "yyyy-MM-dd") : undefined,
        attendee_type_codes: selectedTypeCodes.length > 0 ? selectedTypeCodes : undefined,
        country: country ? countries.find(c => c.code === country)?.name : undefined,
        keyword: keyword || undefined,
        page: searchPage,
        limit,
        include_questionnaire: includeQuestionnaire,
        is_include_staff: includeStaff
      })

      if (res.success && res.data) {
        const searchData = res.data as AdvancedSearchResponse
        setResults(searchData.data || [])
        setTotal(searchData.total || 0)
      } else {
        setResults([])
        setTotal(0)
      }
    } catch {
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [dateStart, dateEnd, selectedTypeCodes, country, keyword, limit, includeQuestionnaire, includeStaff])

  // ─── Export handler ──────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await exportOrganizerAdvancedSearch({
        start_date: dateStart ? format(dateStart, "yyyy-MM-dd") : undefined,
        end_date: dateEnd ? format(dateEnd, "yyyy-MM-dd") : undefined,
        attendee_type_codes: selectedTypeCodes.length > 0 ? selectedTypeCodes : undefined,
        country: country ? countries.find(c => c.code === country)?.name : undefined,
        keyword: keyword || undefined,
        include_questionnaire: includeQuestionnaire,
        is_include_staff: includeStaff
      })

      if (res.success && res.data) {
        const blob = new Blob([res.data], { type: res.contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `advanced-search-export-${format(new Date(), 'yyyyMMdd-HHmm')}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Report exported successfully")
      } else {
        toast.error(res.error || "Failed to export report")
      }
    } catch (error) {
      console.error("Export error:", error)
      toast.error("An error occurred during export")
    } finally {
      setExporting(false)
    }
  }

  // ─── Reset handler ───────────────────────────────────────────────────────────
  const handleReset = () => {
    setKeyword("")
    setCountry("")
    setDateStart(undefined)
    setDateEnd(undefined)
    setSelectedTypeCodes([])
    setIncludeQuestionnaire(false)
    setIncludeStaff(false)
    setPage(1)
    setResults([])
    setTotal(0)
    setSearched(false)
  }

  // ─── Type checkbox toggle ────────────────────────────────────────────────────
  const toggleTypeCode = (code: string) => {
    setSelectedTypeCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Advanced search across participants, companies, and registration data.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Export Reports                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 
      <Card className="border-none shadow-md bg-muted/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Download className="h-5 w-5 text-primary" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download comprehensive registration and attendee reports by selecting an event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Select Event:</span>
              <div className="w-[240px]">
                <Select value={selectedEventUuid} onValueChange={setSelectedEventUuid}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((e) => (
                      <SelectItem key={e.event_uuid} value={e.event_uuid}>
                        {e.event_code} - {e.event_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 flex-1 md:justify-end">
              <Button 
                variant="outline" 
                className="bg-background shadow-sm border-primary/20 hover:bg-primary/5" 
                onClick={() => handlePreview('registrations-by-country')}
                disabled={!selectedEventUuid || isPreviewing}
              >
                {isPreviewing && previewType === 'registrations-by-country' ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" /> : <Search className="h-4 w-4 mr-2 text-primary" />}
                Preview Registrations By Country
              </Button>
              <Button 
                variant="outline" 
                className="bg-background shadow-sm border-primary/20 hover:bg-primary/5" 
                onClick={() => handlePreview('questionnaires')}
                disabled={!selectedEventUuid || isPreviewing}
              >
                {isPreviewing && previewType === 'questionnaires' ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" /> : <Search className="h-4 w-4 mr-2 text-primary" />}
                Preview Questionnaires
              </Button>
              <Button 
                variant="outline" 
                className="bg-background shadow-sm border-primary/20 hover:bg-primary/5" 
                onClick={() => handlePreview('attendees-summary')}
                disabled={!selectedEventUuid || isPreviewing}
              >
                {isPreviewing && previewType === 'attendees-summary' ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" /> : <Search className="h-4 w-4 mr-2 text-primary" />}
                Preview Attendees Summary
              </Button>
              <Button 
                variant="outline" 
                className="bg-background shadow-sm border-primary/20 hover:bg-primary/5" 
                onClick={() => handlePreview('edm-visitors')}
                disabled={!selectedEventUuid || isPreviewing}
              >
                {isPreviewing && previewType === 'edm-visitors' ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" /> : <Search className="h-4 w-4 mr-2 text-primary" />}
                Preview EDM Visitors
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      */}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Excel Preview Modal                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Excel Data Preview</DialogTitle>
            <DialogDescription>
              Previewing the first 100 rows of the selected report.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-md relative bg-background">
            {isPreviewing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm font-medium">Fetching and parsing Excel data...</p>
              </div>
            ) : previewData.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    {previewHeaders.map((header, i) => (
                      <TableHead key={i} className="whitespace-nowrap font-semibold">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 100).map((row, rowIndex) => (
                    <TableRow key={rowIndex} className="hover:bg-muted/50">
                      {previewHeaders.map((header, colIndex) => (
                        <TableCell key={colIndex} className="whitespace-nowrap text-sm">
                          {row[header] !== undefined && row[header] !== null ? String(row[header]) : '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No data available in this report.
              </div>
            )}
          </div>
          <DialogFooter className="mt-4 flex sm:justify-between items-center bg-muted/30 p-4 rounded-lg border border-muted">
            <div className="text-sm text-muted-foreground">
              {previewData.length > 100 ? (
                <span>Showing 100 of {previewData.length.toLocaleString()} rows</span>
              ) : (
                <span>Showing all {previewData.length} rows</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => window.open(`/api/export/${previewType}?event_uuid=${selectedEventUuid}`, '_blank')}
                disabled={isPreviewing}
                className="bg-primary hover:bg-primary/90"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Full Excel
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Advanced Search Filters                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Card className="border-none shadow-md bg-muted/30">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Search className="h-5 w-5 text-primary" />
            Advanced Search
          </CardTitle>
          <CardDescription>
            Filter across participants, companies, and registration metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Main Search Bar & Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by Name, Company, or ID..."
                  className="pl-10 h-12 text-base bg-background shadow-sm"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch(1)}
                />
              </div>
              <div className="flex gap-2">
                <Button size="lg" className="h-12 px-6" onClick={() => handleSearch(1)} disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Search className="h-5 w-5 mr-2" />}
                  Search
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-4 shadow-sm" onClick={handleReset}>
                  Reset
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-4 shadow-sm" onClick={handleExport} disabled={exporting || results.length === 0}>
                  {exporting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2 text-primary" />}
                  Export
                </Button>
              </div>
            </div>

            {/* Secondary Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 p-4 rounded-lg bg-background/50 border border-border/50">
              {/* Country Filter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="country" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Country</Label>
                  {country && (
                    <button 
                      onClick={() => setCountry("")}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center"
                    >
                      Clear <X className="h-3 w-3 ml-0.5" />
                    </button>
                  )}
                </div>
                <CountrySelector
                  value={country}
                  onChange={setCountry}
                  placeholder="Select country"
                />
              </div>

              {/* Registration Date Start */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date Start</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-background">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {dateStart ? format(dateStart, "PPP") : <span className="text-muted-foreground">Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateStart} onSelect={setDateStart} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Registration Date End */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date End</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-background">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {dateEnd ? format(dateEnd, "PPP") : <span className="text-muted-foreground">Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateEnd} onSelect={setDateEnd} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Attendee Type Popover */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attendee Types</Label>
                  {selectedTypeCodes.length > 0 && (
                    <button 
                      onClick={() => setSelectedTypeCodes([])}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center"
                    >
                      Clear <X className="h-3 w-3 ml-0.5" />
                    </button>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal bg-background">
                      <span className="truncate">
                        {selectedTypeCodes.length === 0 
                          ? <span className="text-muted-foreground">All Types</span>
                          : `${selectedTypeCodes.length} type${selectedTypeCodes.length > 1 ? 's' : ''} selected`}
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-50 rotate-90" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="p-3 border-b border-border">
                      <h4 className="font-medium text-sm">Select Attendee Types</h4>
                    </div>
                    <div className="p-3 max-h-[300px] overflow-y-auto space-y-3 flex flex-col">
                      {attendeeTypes.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Loading types...</span>
                      ) : (
                        attendeeTypes.map(t => (
                          <label key={t.type_code} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded-md -mx-1 px-2">
                            <Checkbox
                              checked={selectedTypeCodes.includes(t.type_code)}
                              onCheckedChange={() => toggleTypeCode(t.type_code)}
                            />
                            <span className="text-sm flex-1">{t.type_name}</span>
                            <Badge variant="secondary" className="text-[10px] font-normal">{t.type_code}</Badge>
                          </label>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Questionnaire Checkbox */}
              <div className="flex items-center justify-start sm:justify-center h-[38px] mt-1.5 sm:mt-6 space-x-2">
                <Checkbox 
                  id="include_questionnaire" 
                  checked={includeQuestionnaire}
                  onCheckedChange={(checked) => setIncludeQuestionnaire(!!checked)}
                />
                <Label htmlFor="include_questionnaire" className="text-sm font-medium leading-none cursor-pointer">
                  Include Questionnaire
                </Label>
              </div>

              {/* Include Staff Checkbox */}
              <div className="flex items-center justify-start sm:justify-center h-[38px] mt-1.5 sm:mt-6 space-x-2">
                <Checkbox 
                  id="is_include_staff" 
                  checked={includeStaff}
                  onCheckedChange={(checked) => setIncludeStaff(!!checked)}
                />
                <Label htmlFor="is_include_staff" className="text-sm font-medium leading-none cursor-pointer">
                  Include Staff
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Search Results                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">Search Results</CardTitle>
              <CardDescription>
                {searched
                  ? `Found ${total.toLocaleString()} participant${total !== 1 ? 's' : ''} matching your filters.`
                  : 'Use the filters above and click Search to find participants.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
              <Search className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {searched ? 'No results found. Try adjusting your filters.' : 'Enter your search criteria above.'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[130px]">Reg. Code</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Registered At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r, i) => (
                      <TableRow key={`${r.registration_uuid}-${i}`} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-xs text-muted-foreground">{r.registration_code || '-'}</TableCell>
                        <TableCell className="font-medium">{[r.first_name, r.last_name].filter(Boolean).join(' ') || '-'}</TableCell>
                        <TableCell>{r.company_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">{r.attendee_type_code || '-'}</Badge>
                        </TableCell>
                        <TableCell>{r.residence_country || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.registered_at ? format(new Date(r.registered_at), 'yyyy-MM-dd HH:mm') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} · {total.toLocaleString()} total
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(page - 1)}
                    disabled={page <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(page + 1)}
                    disabled={page >= totalPages || loading}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}





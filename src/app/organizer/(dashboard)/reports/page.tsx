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
import { Search, Download, Calendar as CalendarIcon, Loader2, ChevronLeft, ChevronRight, X, FileBarChart } from "lucide-react"
import { format } from "date-fns"
import { organizerAdvancedSearch, exportOrganizerAdvancedSearch, getOrganizerConferenceSummary, type AdvancedSearchResult, type AdvancedSearchResponse, type ConferenceSummaryResponse } from "@/app/actions/report"
import { getAllAttendeeTypes, type AttendeeType } from "@/app/actions/participant"
import { toast } from "sonner"

type ReportView = 'advanced-search' | 'conference-summary';

export default function ReportsPage() {
  const [activeView, setActiveView] = useState<ReportView>('advanced-search')

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
  const [searched, setSearched] = useState(false)

  // ─── Attendee types ──────────────────────────────────────────────────────────
  const [attendeeTypes, setAttendeeTypes] = useState<AttendeeType[]>([])

  // Fetch attendee types on mount
  useEffect(() => {
    getAllAttendeeTypes().then(res => {
      if (res.success && res.data) setAttendeeTypes(res.data)
    })
  }, [])

  // ─── Conference Summary State & Logic ──────────────────────────────────────────
  const [conferenceSummary, setConferenceSummary] = useState<ConferenceSummaryResponse[]>([])
  const [conferenceKeyword, setConferenceKeyword] = useState("")
  const [loadingSummary, setLoadingSummary] = useState(false)

  const fetchConferenceSummary = useCallback(async () => {
    setLoadingSummary(true)
    try {
      const res = await getOrganizerConferenceSummary()
      setConferenceSummary(res.success ? res.data : [])
    } catch {
      setConferenceSummary([])
    } finally {
      setLoadingSummary(false)
    }
  }, [])

  useEffect(() => {
    if (activeView === 'conference-summary') {
      fetchConferenceSummary()
    }
  }, [activeView, fetchConferenceSummary])

  // ─── Export Advanced Search Logic ──────────────────────────────────────────────
  const [exportingAdvanced, setExportingAdvanced] = useState(false)

  const handleExportAdvancedSearch = async () => {
    try {
      setExportingAdvanced(true)
      const res = await exportOrganizerAdvancedSearch({
        start_date: dateStart ? format(dateStart, "yyyy-MM-dd") : undefined,
        end_date: dateEnd ? format(dateEnd, "yyyy-MM-dd") : undefined,
        attendee_type_codes: selectedTypeCodes.length > 0 ? selectedTypeCodes : undefined,
        country: country || undefined,
        keyword: keyword || undefined,
        include_questionnaire: includeQuestionnaire,
        is_include_staff: includeStaff
      })

      if (res.success && res.data) {
        const blob = new Blob([res.data], { type: res.contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `advanced_search_export_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Report exported successfully")
      } else {
        toast.error(res.error || "Failed to export report")
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error("An error occurred during export")
    } finally {
      setExportingAdvanced(false)
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
        country: country || undefined,
        keyword: keyword || undefined,
        page: searchPage,
        limit,
        include_questionnaire: includeQuestionnaire,
        is_include_staff: includeStaff,
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

  const toggleTypeCode = (code: string) => {
    setSelectedTypeCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          View and export conference analysis data.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* Left Sidebar Menu                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="w-full md:w-64 shrink-0 space-y-8">
          
          <div className="space-y-2">
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Views</h3>
            <Button 
              variant={activeView === 'advanced-search' ? 'secondary' : 'ghost'} 
              className="w-full justify-start text-[11px] font-bold tracking-tight px-3" 
              onClick={() => setActiveView('advanced-search')}
            >
              <Search className="mr-2 h-4 w-4" /> Advanced Search
            </Button>
            <Button 
              variant={activeView === 'conference-summary' ? 'secondary' : 'ghost'} 
              className="w-full justify-start text-[11px] font-bold tracking-tight px-3" 
              onClick={() => setActiveView('conference-summary')}
            >
              <FileBarChart className="mr-2 h-4 w-4" /> Conference Summary
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* Right Content Area                                                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 w-full overflow-hidden space-y-6">
          
          {/* ────── Advanced Search View ────── */}
          {activeView === 'advanced-search' && (
            <>
              <Card className="border-none shadow-md bg-muted/30">
                <CardHeader className="pb-4 border-b border-border/50">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        Advanced Search
                      </CardTitle>
                      <CardDescription>
                        Filter across participants, companies, and registration metadata.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* Main Search Bar & Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search by Name, Company, or ID..."
                          className="pl-10 h-11 text-sm bg-background shadow-sm"
                          value={keyword}
                          onChange={e => setKeyword(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSearch(1)}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="default" className="h-11 px-6" onClick={() => handleSearch(1)} disabled={loading}>
                          {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Search className="h-5 w-5 mr-2" />}
                          Search
                        </Button>
                        <Button variant="outline" size="default" className="h-11 px-4 shadow-sm" onClick={handleReset}>
                          Reset
                        </Button>
                        <Button variant="outline" size="default" className="h-11 px-4 shadow-sm" onClick={handleExportAdvancedSearch} disabled={exportingAdvanced || results.length === 0}>
                          {exportingAdvanced ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2 text-primary" />}
                          Export
                        </Button>
                      </div>
                    </div>

                    {/* Secondary Filters Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 p-4 rounded-lg bg-background/50 border border-border/50">
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
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger className="w-full bg-background h-10">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="local">Local</SelectItem>
                            <SelectItem value="oversea">Oversea</SelectItem>
                            <SelectItem value="others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Registration Date Start */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date Start</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal bg-background">
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
                            <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal bg-background">
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
                            <Button variant="outline" size="sm" className="w-full justify-between font-normal bg-background">
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

                      {/* Include Questionnaire */}
                      <div className="flex items-center justify-start sm:justify-center h-[38px] mt-1.5 sm:mt-6 space-x-2">
                        <Checkbox
                          id="include_questionnaire"
                          checked={includeQuestionnaire}
                          onCheckedChange={(checked) => setIncludeQuestionnaire(!!checked)}
                        />
                        <Label htmlFor="include_questionnaire" className="text-xs font-medium leading-none cursor-pointer">
                          Include Questionnaire
                        </Label>
                      </div>

                      {/* Include Staff */}
                      <div className="flex items-center justify-start sm:justify-center h-[38px] mt-1.5 sm:mt-6 space-x-2">
                        <Checkbox
                          id="is_include_staff"
                          checked={includeStaff}
                          onCheckedChange={(checked) => setIncludeStaff(!!checked)}
                        />
                        <Label htmlFor="is_include_staff" className="text-xs font-medium leading-none cursor-pointer">
                          Include Staff
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Search Results */}
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
                      <div className="rounded-md border overflow-x-auto">
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3">
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
            </>
          )}

          {/* ────── Conference Summary View ────── */}
          {activeView === 'conference-summary' && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Conference Summary</CardTitle>
                    <CardDescription>
                      Summary of attendance for each conference session.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-60">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                      <Input
                        placeholder="Search title or room..."
                        className="pl-8 h-8 text-xs bg-background shadow-none border-muted-foreground/20 focus-visible:ring-1"
                        value={conferenceKeyword}
                        onChange={(e) => setConferenceKeyword(e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('/api/export/conference-summary', '_blank')}
                      disabled={loadingSummary} 
                      className="h-9 px-3 gap-2 bg-background border-muted-foreground/20 hover:bg-primary/5 shadow-sm shrink-0"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingSummary ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-3" />
                    <p className="text-sm">Loading summary...</p>
                  </div>
                ) : conferenceSummary.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
                    <FileBarChart className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No conference data available.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border max-h-[600px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                        <TableRow className="bg-muted/30">
                          <TableHead className="min-w-[200px] text-[10px] font-bold uppercase tracking-wider h-10">Conference Title</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Date</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Time</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Room</TableHead>
                          <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider h-10">Quota</TableHead>
                          <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider h-10">Pre-Reg</TableHead>
                          <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider h-10">On Show</TableHead>
                          <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider h-10">Pre-Reg Show</TableHead>
                          <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider h-10">Walk-in</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conferenceSummary
                          .filter(c => 
                            c.title.toLowerCase().includes(conferenceKeyword.toLowerCase()) || 
                            c.room_name.toLowerCase().includes(conferenceKeyword.toLowerCase())
                          )
                          .map((c, i) => (
                          <TableRow key={`${c.conference_uuid}-${i}`} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{c.title}</TableCell>
                            <TableCell className="whitespace-nowrap">{c.show_date}</TableCell>
                            <TableCell className="whitespace-nowrap">{c.start_time.substring(0, 5)} - {c.end_time.substring(0, 5)}</TableCell>
                            <TableCell>{c.room_name}</TableCell>
                            <TableCell className="text-right">{c.quota}</TableCell>
                            <TableCell className="text-right">{c.pre_registration}</TableCell>
                            <TableCell className="text-right font-bold text-primary">{c.total_on_show}</TableCell>
                            <TableCell className="text-right">{c.pre_registration_show_up}</TableCell>
                            <TableCell className="text-right">{c.walk_in}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

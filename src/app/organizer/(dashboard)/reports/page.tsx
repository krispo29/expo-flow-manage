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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Search, Download, Calendar as CalendarIcon, Loader2, ChevronLeft, ChevronRight, X, FileBarChart, Filter } from "lucide-react"
import { format } from "date-fns"
import { organizerAdvancedSearch, exportOrganizerAdvancedSearch, getOrganizerConferenceSummary, type AdvancedSearchResult, type AdvancedSearchResponse, type ConferenceSummaryResponse } from "@/app/actions/report"
import { getAllAttendeeTypes, type AttendeeType } from "@/app/actions/participant"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

  useEffect(() => {
    getAllAttendeeTypes().then(res => {
      if (res.success && res.data) setAttendeeTypes(res.data)
    })
  }, [])

  // ─── Conference Summary State & Logic ────────────────────────────────────────
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

  // ─── Export Advanced Search Logic ────────────────────────────────────────────
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
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `advanced_search_export_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`
        document.body.appendChild(a)
        a.click()
        URL.revokeObjectURL(url)
        a.remove()
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
  const recordPlural = total !== 1 ? "s" : ""
  const searchResultsDescription = searched
    ? `Visualizing ${total.toLocaleString()} record${recordPlural} with active filtering.`
    : "Configure filters above to generate data report."

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Reports</h1>
          <p className="text-muted-foreground mt-1">View and export conference analysis data.</p>
        </div>
      </div>

      {/* ── View Tabs ── */}
      <div className="glass p-2 rounded-2xl border-white/10 shadow-lg inline-flex gap-2 flex-wrap">
        <Button
          variant={activeView === 'advanced-search' ? 'default' : 'ghost'}
          className={cn(
            "rounded-xl px-5 h-11 transition-all duration-300 font-semibold",
            activeView === 'advanced-search' ? 'btn-aurora shadow-lg shadow-primary/20' : 'hover:bg-white/5'
          )}
          onClick={() => setActiveView('advanced-search')}
        >
          <Search className="mr-2 h-4 w-4 shrink-0" /> Advanced Search
        </Button>
        <Button
          variant={activeView === 'conference-summary' ? 'default' : 'ghost'}
          className={cn(
            "rounded-xl px-5 h-11 transition-all duration-300 font-semibold",
            activeView === 'conference-summary' ? 'btn-aurora shadow-lg shadow-primary/20' : 'hover:bg-white/5'
          )}
          onClick={() => setActiveView('conference-summary')}
        >
          <FileBarChart className="mr-2 h-4 w-4 shrink-0" /> Conference Summary
        </Button>
      </div>

      {/* ── Content Area ── */}
      <div className="w-full space-y-6">

        {/* ── Advanced Search View ── */}
        {activeView === 'advanced-search' && (
          <>
            <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-white/10 pb-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl font-display">
                      <Filter className="h-6 w-6 text-primary" />
                      Search Filters
                    </CardTitle>
                    <CardDescription className="font-medium">
                      Refine your participant list with dynamic metadata filtering.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Search by Name, Company, or ID..."
                      className="pl-12 h-14 text-base bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 focus-visible:ring-primary/30 transition-all"
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch(1)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button className="btn-aurora h-14 px-8 rounded-2xl font-bold shadow-lg shadow-primary/20" onClick={() => handleSearch(1)} disabled={loading}>
                      {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Search className="h-5 w-5 mr-2" />}
                      Run Search
                    </Button>
                    <Button variant="outline" className="h-14 px-6 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold" onClick={handleReset}>
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14 px-6 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold text-primary"
                      onClick={handleExportAdvancedSearch}
                      disabled={exportingAdvanced || results.length === 0}
                    >
                      {exportingAdvanced ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
                      Export Result
                    </Button>
                  </div>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 rounded-3xl bg-white/5 border border-white/10">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Origin/Country</Label>
                      {country && (
                        <button onClick={() => setCountry("")} className="text-[10px] font-bold text-muted-foreground hover:text-destructive flex items-center transition-colors">
                          CLEAR <X className="h-3 w-3 ml-1" />
                        </button>
                      )}
                    </div>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger className="w-full bg-white/5 border-white/10 h-12 rounded-xl">
                        <SelectValue placeholder="All Origins" />
                      </SelectTrigger>
                      <SelectContent className="glass border-white/10">
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="oversea">Oversea</SelectItem>
                        <SelectItem value="others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Registration Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-medium bg-white/5 border-white/10 h-12 rounded-xl text-xs px-3">
                            <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-60" />
                            {dateStart ? format(dateStart, "MMM d") : "Start"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 glass border-white/10" align="start">
                          <Calendar mode="single" selected={dateStart} onSelect={setDateStart} />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-medium bg-white/5 border-white/10 h-12 rounded-xl text-xs px-3">
                            <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-60" />
                            {dateEnd ? format(dateEnd, "MMM d") : "End"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 glass border-white/10" align="start">
                          <Calendar mode="single" selected={dateEnd} onSelect={setDateEnd} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Attendee Categories</Label>
                      {selectedTypeCodes.length > 0 && (
                        <button onClick={() => setSelectedTypeCodes([])} className="text-[10px] font-bold text-muted-foreground hover:text-destructive flex items-center transition-colors">
                          CLEAR <X className="h-3 w-3 ml-1" />
                        </button>
                      )}
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-medium bg-white/5 border-white/10 h-12 rounded-xl px-4">
                          <span className="truncate text-xs">
                            {selectedTypeCodes.length === 0 ? "All Categories" : `${selectedTypeCodes.length} selected`}
                          </span>
                          <ChevronRight className="h-4 w-4 opacity-40 rotate-90 ml-2" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 glass border-white/10 rounded-2xl shadow-2xl" align="start">
                        <div className="p-4 border-b border-white/10 bg-white/5">
                          <h4 className="font-display font-bold text-sm">Select Categories</h4>
                        </div>
                        <div className="p-3 max-h-[300px] overflow-y-auto space-y-1.5 scrollbar-hide">
                          {attendeeTypes.length === 0 ? (
                            <div className="p-4 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto opacity-40" /></div>
                          ) : (
                            attendeeTypes.map(t => (
                              <label key={t.type_code} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors">
                                <Checkbox checked={selectedTypeCodes.includes(t.type_code)} onCheckedChange={() => toggleTypeCode(t.type_code)} />
                                <span className="text-sm font-medium flex-1">{t.type_name}</span>
                                <Badge variant="outline" className="text-[9px] font-bold border-white/10 opacity-60 uppercase">{t.type_code}</Badge>
                              </label>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex flex-col justify-center space-y-3 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <Checkbox id="include_questionnaire" checked={includeQuestionnaire} onCheckedChange={(checked) => setIncludeQuestionnaire(!!checked)} />
                      <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-tight">Questionnaires</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <Checkbox id="is_include_staff" checked={includeStaff} onCheckedChange={(checked) => setIncludeStaff(!!checked)} />
                      <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-tight">Include Staff</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Table */}
            <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-white/10 py-6">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-display">Result</CardTitle>
                  <CardDescription className="font-medium">{searchResultsDescription}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-sm font-bold tracking-widest uppercase opacity-40">Analyzing database...</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                    <div className="bg-white/5 p-6 rounded-full border border-white/5 mb-6">
                      <Search className="h-10 w-10 text-primary/20" />
                    </div>
                    <p className="text-lg font-display font-bold">No results captured</p>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2 italic">
                      {searched ? 'No participants matched the specified filter matrix.' : 'Perform a search to populate this analytics grid.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-white/5">
                          <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="w-[140px] font-bold text-[10px] uppercase tracking-widest pl-6">Reg. Code</TableHead>
                            <TableHead className="w-[180px] font-bold text-[10px] uppercase tracking-widest">Participant</TableHead>
                            <TableHead className="w-[250px] font-bold text-[10px] uppercase tracking-widest">Company Organization</TableHead>
                            <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-widest">Type</TableHead>
                            <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-widest">Origin</TableHead>
                            <TableHead className="w-[140px] font-bold text-[10px] uppercase tracking-widest pr-6">Registered At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {results.map((r, i) => (
                            <TableRow key={`${r.registration_uuid}-${i}`} className="border-white/5 hover:bg-white/5 transition-colors group">
                              <TableCell className="pl-6">
                                <code className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{r.registration_code || '---'}</code>
                              </TableCell>
                              <TableCell className="max-w-[180px]">
                                <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">{[r.first_name, r.last_name].filter(Boolean).join(' ') || '---'}</p>
                              </TableCell>
                              <TableCell className="max-w-[250px]">
                                <TooltipProvider delayDuration={300}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="text-sm font-medium text-muted-foreground truncate cursor-help">{r.company_name || '---'}</p>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[300px] glass border-white/10 p-3 bg-slate-900/95 backdrop-blur-xl">
                                      <p className="text-sm font-medium text-black dark:text-white">{r.company_name || '---'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-bold text-[9px] border-white/10 uppercase bg-white/5 truncate max-w-[120px]">
                                  {r.attendee_type_name || r.attendee_type_code || '---'}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[120px]">
                                <p className="text-sm font-medium italic opacity-70 truncate">{r.residence_country || '---'}</p>
                              </TableCell>
                              <TableCell className="pr-6">
                                <span className="text-[10px] font-mono font-bold opacity-40">
                                  {r.registered_at ? format(new Date(r.registered_at), 'yyyy-MM-dd HH:mm') : '---'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4 border-t border-white/10 bg-white/5">
                      <p className="text-sm text-muted-foreground italic font-medium">
                        Page <span className="text-foreground">{page}</span> of <span className="text-foreground">{totalPages}</span> results
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-full h-9 px-4 bg-white/5 border-white/10" onClick={() => handleSearch(page - 1)} disabled={page <= 1 || loading}>
                          <ChevronLeft className="h-4 w-4 mr-1.5" /> Prev
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full h-9 px-4 bg-white/5 border-white/10" onClick={() => handleSearch(page + 1)} disabled={page >= totalPages || loading}>
                          Next <ChevronRight className="h-4 w-4 ml-1.5" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Conference Summary View ── */}
        {activeView === 'conference-summary' && (
          <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/10 py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-display">Conferences</CardTitle>
                  <CardDescription className="font-medium">
                    Live attendance summary and capacity metrics for all sessions.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-80 group">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Search title or room..."
                      className="pl-10 h-11 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 transition-all text-sm"
                      value={conferenceKeyword}
                      onChange={(e) => setConferenceKeyword(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open('/api/export/conference-summary', '_blank')}
                    disabled={loadingSummary}
                    className="h-11 rounded-2xl px-5 gap-2 bg-white/5 border-white/10 hover:bg-primary/10 transition-all shrink-0 font-bold text-xs"
                  >
                    <Download className="h-4 w-4" />
                    <span>EXPORT</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSummary ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-sm font-bold tracking-widest uppercase opacity-40">Calculating attendance...</p>
                </div>
              ) : conferenceSummary.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                  <div className="bg-white/5 p-6 rounded-full border border-white/5 mb-6">
                    <FileBarChart className="h-10 w-10 text-primary/20" />
                  </div>
                  <p className="text-lg font-display font-bold">No active sessions</p>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2 italic">
                    Session data will be available once the event timeline begins.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="w-[300px] font-bold text-[10px] uppercase tracking-widest pl-6">Session Title</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest">Timeline</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest">Venue/Room</TableHead>
                        <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Capacity</TableHead>
                        <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Pre-Reg</TableHead>
                        <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Total Present</TableHead>
                        <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Matched</TableHead>
                        <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-6">Walk-in</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conferenceSummary
                        .filter(c =>
                          c.title.toLowerCase().includes(conferenceKeyword.toLowerCase()) ||
                          c.room_name.toLowerCase().includes(conferenceKeyword.toLowerCase())
                        )
                        .map((c, i) => (
                          <TableRow key={`${c.conference_uuid}-${i}`} className="border-white/5 hover:bg-white/5 transition-colors group">
                            <TableCell className="pl-6 max-w-[300px]">
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-tight truncate cursor-help">
                                      {c.title}
                                    </p>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[400px] glass border-white/10 p-3 bg-slate-900/95 backdrop-blur-xl">
                                    <p className="text-sm font-medium leading-relaxed text-black dark:text-white">{c.title}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold opacity-60">{c.show_date}</span>
                                <span className="text-[10px] font-mono font-medium opacity-40">{c.start_time.substring(0, 5)} - {c.end_time.substring(0, 5)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium opacity-70 italic">{c.room_name}</TableCell>
                            <TableCell className="text-right font-bold text-xs opacity-40">{c.quota}</TableCell>
                            <TableCell className="text-right font-medium text-xs">{c.pre_registration}</TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm font-display font-black text-primary">{c.total_on_show}</span>
                            </TableCell>
                            <TableCell className="text-right text-xs font-medium text-emerald-500">{c.pre_registration_show_up}</TableCell>
                            <TableCell className="text-right pr-6 text-xs font-medium text-amber-500">{c.walk_in}</TableCell>
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
  )
}

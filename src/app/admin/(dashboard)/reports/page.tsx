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
import { Search, Download, Calendar as CalendarIcon, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { advancedSearch, type AdvancedSearchResult, type AdvancedSearchResponse } from "@/app/actions/report"
import { getAllAttendeeTypes, type AttendeeType } from "@/app/actions/participant"

export default function ReportsPage() {
  // ─── Filter state ────────────────────────────────────────────────────────────
  const [keyword, setKeyword] = useState("")
  const [country, setCountry] = useState("")
  const [dateStart, setDateStart] = useState<Date>()
  const [dateEnd, setDateEnd] = useState<Date>()
  const [selectedTypeCodes, setSelectedTypeCodes] = useState<string[]>([])

  // ─── Pagination ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  // ─── Results ─────────────────────────────────────────────────────────────────
  const [results, setResults] = useState<AdvancedSearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // ─── Attendee types from API ─────────────────────────────────────────────────
  const [attendeeTypes, setAttendeeTypes] = useState<AttendeeType[]>([])

  // Fetch attendee types on mount
  useEffect(() => {
    getAllAttendeeTypes().then(res => {
      if (res.success && res.data) setAttendeeTypes(res.data)
    })
  }, [])

  // ─── Search handler ──────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (searchPage = 1) => {
    setLoading(true)
    setSearched(true)
    setPage(searchPage)

    try {
      const res = await advancedSearch({
        start_date: dateStart ? format(dateStart, "yyyy-MM-dd") : undefined,
        end_date: dateEnd ? format(dateEnd, "yyyy-MM-dd") : undefined,
        attendee_type_codes: selectedTypeCodes.length > 0 ? selectedTypeCodes : undefined,
        country: country || undefined,
        keyword: keyword || undefined,
        page: searchPage,
        limit,
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
  }, [dateStart, dateEnd, selectedTypeCodes, country, keyword, limit])

  // ─── Reset handler ───────────────────────────────────────────────────────────
  const handleReset = () => {
    setKeyword("")
    setCountry("")
    setDateStart(undefined)
    setDateEnd(undefined)
    setSelectedTypeCodes([])
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
      {/* Advanced Search Filters                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Card className="border-none shadow-md bg-muted/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Search className="h-5 w-5 text-primary" />
                Advanced Search
              </CardTitle>
              <CardDescription>
                Filter across participants, companies, and registration metadata.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>Reset</Button>
              <Button size="sm" onClick={() => handleSearch(1)} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Search
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4">

            {/* Keyword Search */}
            <div className="space-y-2">
              <Label htmlFor="keyword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keyword</Label>
              <Input
                id="keyword"
                placeholder="Name, Company, or ID..."
                className="bg-background"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch(1)}
              />
            </div>

            {/* Country Filter */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Country</Label>
              <Input
                id="country"
                placeholder="e.g. Thailand"
                className="bg-background"
                value={country}
                onChange={e => setCountry(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch(1)}
              />
            </div>

            {/* Registration Date Start */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reg. Date Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-background">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateStart ? format(dateStart, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateStart} onSelect={setDateStart} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Registration Date End */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reg. Date End</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-background">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateEnd ? format(dateEnd, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateEnd} onSelect={setDateEnd} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Attendee Type Multi-Select (Checkboxes) */}
            <div className="space-y-2 lg:col-span-2 xl:col-span-4">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attendee Types</Label>
              <div className="flex flex-wrap gap-3 p-3 rounded-lg border bg-background">
                {attendeeTypes.length === 0 ? (
                  <span className="text-sm text-muted-foreground">Loading types...</span>
                ) : (
                  attendeeTypes.map(t => (
                    <label key={t.type_code} className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={selectedTypeCodes.includes(t.type_code)}
                        onCheckedChange={() => toggleTypeCode(t.type_code)}
                      />
                      <span className="text-sm">{t.type_name} ({t.type_code})</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Action row */}
            <div className="flex items-center lg:col-span-1 xl:col-span-4 justify-end pt-2 gap-3">
              <Button variant="secondary" className="bg-background shadow-sm" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Search Results                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Search Results</CardTitle>
          <CardDescription>
            {searched
              ? `Found ${total.toLocaleString()} participant${total !== 1 ? 's' : ''} matching your filters.`
              : 'Use the filters above and click Search to find participants.'}
          </CardDescription>
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
                      <TableRow key={r.registration_uuid || i} className="hover:bg-muted/50 transition-colors">
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

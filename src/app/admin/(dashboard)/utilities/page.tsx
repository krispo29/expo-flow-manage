"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Printer, Loader2, Search, List, Globe, UserCheck, Phone, Timer } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { searchParticipantsByCodes, printParticipantBadgesBulk, Participant as RealParticipant } from "@/app/actions/participant"
import { getCountries, getNationalities, getMobilePrefixes, getTimezones, Country, Nationality, MobilePrefix, Timezone } from "@/app/actions/project"
import { toast } from "sonner"
import { BadgePrint } from "@/components/badge-print"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { printBadges } from "@/utils/print-badge"

function UtilitiesContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId') || ""
  
  const [printSearch, setPrintSearch] = useState("")
  const [participants, setParticipants] = useState<RealParticipant[]>([])
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false)

  const [countries, setCountries] = useState<Country[]>([])
  const [nationalities, setNationalities] = useState<Nationality[]>([])
  const [prefixes, setPrefixes] = useState<MobilePrefix[]>([])
  const [timezones, setTimezones] = useState<Timezone[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [listSearch, setListSearch] = useState("")

  useEffect(() => {
    fetchSystemLists(projectId)
  }, [projectId])


  async function fetchSystemLists(uuid: string) {
    setIsLoadingLists(true)
    try {
      const [cRes, nRes, pRes, tRes] = await Promise.all([
        getCountries(uuid),
        getNationalities(uuid),
        getMobilePrefixes(uuid),
        getTimezones(uuid)
      ])

      if (cRes.success) setCountries(cRes.data || [])
      if (nRes.success) setNationalities(nRes.data || [])
      if (pRes.success) setPrefixes(pRes.data || [])
      if (tRes.success) setTimezones(tRes.data || [])
    } catch (error) {
      console.error("Error fetching system lists:", error)
    } finally {
      setIsLoadingLists(false)
    }
  }

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(listSearch.toLowerCase()) || 
    c.code.toLowerCase().includes(listSearch.toLowerCase()) ||
    c.nationality.toLowerCase().includes(listSearch.toLowerCase())
  )

  const filteredNationalities = nationalities.filter(n => 
    n.nationality.toLowerCase().includes(listSearch.toLowerCase()) || 
    n.code.toLowerCase().includes(listSearch.toLowerCase())
  )

  const filteredPrefixes = prefixes.filter(p => 
    p.name.toLowerCase().includes(listSearch.toLowerCase()) || 
    p.prefix.toLowerCase().includes(listSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(listSearch.toLowerCase())
  )

  const filteredTimezones = timezones.filter(t => 
    t.label.toLowerCase().includes(listSearch.toLowerCase()) || 
    t.value.toLowerCase().includes(listSearch.toLowerCase())
  )

  async function handleSearch() {
    if (!printSearch.trim()) return
    
    setIsSearching(true)
    setParticipants([])
    setSelectedParticipantId(null)
    
    try {
      const codes = printSearch.split(/[\n,]/).map(c => c.trim()).filter(Boolean)
      const result = await searchParticipantsByCodes(projectId, codes)
      
      if (result.success && result.data) {
        const foundParticipants = result.data as RealParticipant[]
        setParticipants(foundParticipants)
        if (foundParticipants.length > 0) {
          setSelectedParticipantId(foundParticipants[0].registration_uuid)
          toast.success(`Found ${foundParticipants.length} participant(s)`)
        } else {
          toast.error("No participants found")
        }
      } else {
        toast.error(result.error || "Search failed")
      }
    } catch (error) {
      console.error("Search error in handleSearch:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSearching(false)
    }
  }

  async function handleBulkPrint() {
    if (participants.length === 0) return
    setIsSubmittingBulk(true)
    try {
      const codes = participants.map(p => p.registration_code)
      const result = await printParticipantBadgesBulk(projectId, codes)
      if (result.success) {
        toast.success(`Successfully submitted ${codes.length} badge(s) to print queue`)
        
        const badgeData = participants.map(p => {
          const participantFull = p as any
          return {
            firstName: p.first_name || '',
            lastName: p.last_name || '',
            companyName: p.company_name || '',
            country: participantFull.residence_country || 'THAILAND',
            registrationCode: p.registration_code,
            category: p.attendee_type_code || 'VISITOR',
          }
        })
        
        printBadges(badgeData)
      } else {
        toast.error(result.error || "Failed to bulk print")
      }
    } catch (error) {
      console.error("Print error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmittingBulk(false)
    }
  }



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utilities</h1>
          <p className="text-muted-foreground">
            System tools and operational utilities.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        
        {/* Print Badge Utility */}
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Printer className="h-5 w-5" />
                    Print Badge
                </CardTitle>
                <CardDescription>
                    Manually search and print a badge for a participant.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <div className="space-y-2">
                    <Label>Participant Code(s)</Label>
                    <div className="flex flex-col gap-2">
                        <Textarea 
                            placeholder="Enter Code(s) separated by comma or new line" 
                            value={printSearch}
                            onChange={(e) => setPrintSearch(e.target.value)}
                            rows={3}
                        />
                        <Button type="button" onClick={handleSearch} disabled={isSearching} className="w-full">
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            <span className="ml-2">Search & Preview</span>
                        </Button>
                    </div>
                </div>

                {participants.length > 0 && (
                    <div className="mt-4 p-4 border rounded-md bg-muted/20 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-semibold text-lg">{participants.length} Participant(s) Found</h4>
                                <p className="text-sm text-muted-foreground">Previewing selected badge</p>
                            </div>
                            <Badge variant="outline" className="bg-background">Found</Badge>
                        </div>
                        
                        <div className="border rounded-lg bg-white shadow-inner overflow-hidden h-[450px] relative mb-4">
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 scale-[0.65] origin-top print-area">
                                <BadgePrint participant={(participants.find(p => p.registration_uuid === selectedParticipantId) || participants[0]) as RealParticipant & { title_other?: string }} />
                            </div>
                        </div>

                        {participants.length > 1 && (
                            <div className="max-h-32 overflow-y-auto mb-4 border rounded-md divide-y custom-scrollbar">
                                {participants.map(p => (
                                    <div 
                                      key={p.registration_uuid} 
                                      className={`p-2 text-sm flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors ${selectedParticipantId === p.registration_uuid ? 'bg-muted/50 font-medium' : 'bg-white'}`}
                                      onClick={() => setSelectedParticipantId(p.registration_uuid)}
                                    >
                                        <span>{p.first_name} {p.last_name}</span>
                                        <Badge variant="secondary" className="text-xs">{p.registration_code}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button className="w-full mt-4" onClick={handleBulkPrint} disabled={isSubmittingBulk}>
                            {isSubmittingBulk ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
                            Submit Bulk Print
                        </Button>
                    </div>
                )}
                
                {participants.length === 0 && !isSearching && (
                    <div className="mt-8 flex flex-col items-center justify-center text-center text-muted-foreground h-32 border-2 border-dashed rounded-md">
                        <Printer className="h-8 w-8 mb-2 opacity-20" />
                        <span className="text-sm">Enter codes to preview and submit print job</span>
                    </div>
                )}
            </CardContent>
        </Card>

      </div>

      {/* System Lists Utility */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  System Lists
              </CardTitle>
              <CardDescription>
                  View global system configurations and reference data.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                      placeholder="Search system lists..." 
                      className="pl-10"
                      value={listSearch}
                      onChange={(e) => setListSearch(e.target.value)}
                  />
              </div>

              <Tabs defaultValue="countries" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                      <TabsTrigger value="countries" className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <span className="hidden sm:inline">Countries</span>
                      </TabsTrigger>
                      <TabsTrigger value="nationalities" className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          <span className="hidden sm:inline">Nationalities</span>
                      </TabsTrigger>
                      <TabsTrigger value="prefixes" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span className="hidden sm:inline">Mobile Prefixes</span>
                      </TabsTrigger>
                      <TabsTrigger value="timezones" className="flex items-center gap-2">
                          <Timer className="h-4 w-4" />
                          <span className="hidden sm:inline">Timezones</span>
                      </TabsTrigger>
                  </TabsList>

                  <div className="border rounded-md min-h-[400px]">
                      {isLoadingLists ? (
                          <div className="flex flex-col items-center justify-center h-[400px]">
                              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                              <p className="text-sm text-muted-foreground">Loading system data...</p>
                          </div>
                      ) : (
                          <>
                              <TabsContent value="countries" className="m-0">
                                  <div className="max-h-[500px] overflow-auto">
                                      <Table>
                                          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                              <TableRow>
                                                  <TableHead className="w-[100px]">Code</TableHead>
                                                  <TableHead>Country Name</TableHead>
                                                  <TableHead>Nationality</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {filteredCountries.map((c) => (
                                                  <TableRow key={c.code}>
                                                      <TableCell className="font-mono text-xs">{c.code}</TableCell>
                                                      <TableCell className="font-medium">{c.name}</TableCell>
                                                      <TableCell className="text-muted-foreground">{c.nationality}</TableCell>
                                                  </TableRow>
                                              ))}
                                              {filteredCountries.length === 0 && (
                                                  <TableRow>
                                                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No countries found</TableCell>
                                                  </TableRow>
                                              )}
                                          </TableBody>
                                      </Table>
                                  </div>
                              </TabsContent>

                              <TabsContent value="nationalities" className="m-0">
                                  <div className="max-h-[500px] overflow-auto">
                                      <Table>
                                          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                              <TableRow>
                                                  <TableHead className="w-[100px]">Code</TableHead>
                                                  <TableHead>Nationality</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {filteredNationalities.map((n) => (
                                                  <TableRow key={n.code}>
                                                      <TableCell className="font-mono text-xs">{n.code}</TableCell>
                                                      <TableCell className="font-medium">{n.nationality}</TableCell>
                                                  </TableRow>
                                              ))}
                                              {filteredNationalities.length === 0 && (
                                                  <TableRow>
                                                      <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No nationalities found</TableCell>
                                                  </TableRow>
                                              )}
                                          </TableBody>
                                      </Table>
                                  </div>
                              </TabsContent>

                              <TabsContent value="prefixes" className="m-0">
                                  <div className="max-h-[500px] overflow-auto">
                                      <Table>
                                          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                              <TableRow>
                                                  <TableHead className="w-[100px]">Code</TableHead>
                                                  <TableHead className="w-[120px]">Prefix</TableHead>
                                                  <TableHead>Country</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {filteredPrefixes.map((p) => (
                                                  <TableRow key={p.code}>
                                                      <TableCell className="font-mono text-xs">{p.code}</TableCell>
                                                      <TableCell className="font-semibold text-primary">{p.prefix}</TableCell>
                                                      <TableCell className="font-medium">{p.name}</TableCell>
                                                  </TableRow>
                                              ))}
                                              {filteredPrefixes.length === 0 && (
                                                  <TableRow>
                                                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No prefixes found</TableCell>
                                                  </TableRow>
                                              )}
                                          </TableBody>
                                      </Table>
                                  </div>
                              </TabsContent>

                              <TabsContent value="timezones" className="m-0">
                                  <div className="max-h-[500px] overflow-auto">
                                      <Table>
                                          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                              <TableRow>
                                                  <TableHead>Label</TableHead>
                                                  <TableHead>Value (TZ Database Name)</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {filteredTimezones.map((t, idx) => (
                                                  <TableRow key={`${t.value}-${idx}`}>
                                                      <TableCell className="font-medium">{t.label}</TableCell>
                                                      <TableCell className="font-mono text-xs text-muted-foreground">{t.value}</TableCell>
                                                  </TableRow>
                                              ))}
                                              {filteredTimezones.length === 0 && (
                                                  <TableRow>
                                                      <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No timezones found</TableCell>
                                                  </TableRow>
                                              )}
                                          </TableBody>
                                      </Table>
                                  </div>
                              </TabsContent>
                          </>
                      )}
                  </div>
              </Tabs>
          </CardContent>
      </Card>

    </div>
  )
}

export default function UtilitiesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[200px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <UtilitiesContent />
    </Suspense>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Printer, Upload, FileText, CheckCircle, Clock, Loader2, Search } from "lucide-react"
import { useState, useEffect, useRef, Suspense } from "react"
import { searchParticipantByCode, processScannerData, getRecentScannerImports, Participant as RealParticipant } from "@/app/actions/participant"
import { toast } from "sonner"
import { ImportHistory } from "@/lib/mock-service"
import { BadgePrint } from "@/components/badge-print"
import { useSearchParams } from "next/navigation"

function UtilitiesContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId') || ""
  
  const [printSearch, setPrintSearch] = useState("")
  const [participant, setParticipant] = useState<RealParticipant | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  
  const [isImporting, setIsImporting] = useState(false)
  const [history, setHistory] = useState<ImportHistory[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    const result = await getRecentScannerImports()
    if (result.success && result.data) {
      setHistory(result.data)
    }
  }

  async function handleSearch() {
    if (!printSearch.trim()) return
    
    setIsSearching(true)
    setParticipant(null)
    
    try {
      console.log("Searching for code:", printSearch)
      const result = await searchParticipantByCode(printSearch)
      console.log("Search result:", result)
      
      if (result.success) {
        if (result.data) {
          setParticipant(result.data as RealParticipant)
          toast.success("Participant found")
        } else {
          setParticipant(null)
          toast.error("Participant not found")
        }
      } else {
        setParticipant(null)
        toast.error(result.error || "Search failed")
      }
    } catch (error) {
      console.error("Search error in handleSearch:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSearching(false)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!projectId) {
      toast.error("Project ID is missing. Please select a project first.")
      return
    }

    setIsImporting(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)

    try {
      const result = await processScannerData(formData)
      if (result.success) {
        toast.success(`Processed ${result.processed} codes. Updated ${result.updated} records.`)
        // In a real app we'd refresh history, here we just show success
        if (fileInputRef.current) fileInputRef.current.value = ""
      } else {
        toast.error(result.error || "Import failed")
      }
    } catch (error) {
      console.error("Import error:", error)
      toast.error("An error occurred during import")
    } finally {
      setIsImporting(false)
    }
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      globalThis.print()
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

      <div className="grid gap-6 md:grid-cols-2">
        
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
                    <Label>Participant Code</Label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Enter Code (e.g., VIP-001)" 
                            value={printSearch}
                            onChange={(e) => setPrintSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button type="button" onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            <span className="ml-2">Search</span>
                        </Button>
                    </div>
                </div>

                {participant && (
                    <div className="mt-4 p-4 border rounded-md bg-muted/20 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-semibold text-lg">{participant.first_name} {participant.last_name}</h4>
                                <p className="text-sm text-muted-foreground">{participant.attendee_type_code} - {participant.company_name || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground mt-1">Code: {participant.registration_code}</p>
                            </div>
                            <Badge variant="outline" className="bg-background">Found</Badge>
                        </div>
                        
                        <div className="border rounded-lg bg-white shadow-inner overflow-hidden h-[340px] relative">
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 scale-[0.52] origin-top print-area">
                                <BadgePrint participant={participant as any} />
                            </div>
                        </div>

                        <Button className="w-full mt-4" onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print Badge
                        </Button>
                    </div>
                )}
                
                {!participant && !isSearching && (
                    <div className="mt-8 flex flex-col items-center justify-center text-center text-muted-foreground h-32 border-2 border-dashed rounded-md">
                        <Printer className="h-8 w-8 mb-2 opacity-20" />
                        <span className="text-sm">Enter a code to preview and print badge</span>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Import Scanner Data Utility */}
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import Scanner Data
                </CardTitle>
                <CardDescription>
                    Import .CSV files from scanner devices to sync attendance.
                </CardDescription>
            </CardHeader>
             <CardContent className="flex-1 space-y-6">
                <div 
                    className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef}
                      accept=".csv,.txt"
                      onChange={handleFileChange}
                    />
                    {isImporting ? (
                      <>
                        <Loader2 className="h-8 w-8 text-primary mb-4 animate-spin" />
                        <h3 className="font-semibold italic">Processing File...</h3>
                        <p className="text-sm text-muted-foreground">Updating attendance records</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                        <h3 className="font-semibold">Click to select CSV Scanner File</h3>
                        <p className="text-sm text-muted-foreground mb-4">Supports .csv and .txt (newline separated codes)</p>
                        <Button variant="outline" size="sm">Select File</Button>
                      </>
                    )}
                </div>

                <div>
                    <h4 className="font-semibold text-sm mb-3">Recent Imports (Mock)</h4>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">File</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium text-xs">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-3 w-3 text-blue-500" />
                                                {item.filename}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-right text-muted-foreground">{item.date}</TableCell>
                                        <TableCell className="text-right">
                                            {item.status === "Success" ? (
                                                <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-yellow-500 ml-auto" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>

      </div>
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

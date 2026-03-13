"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Printer, Loader2, Search, UserCheck, ZoomIn, ZoomOut, CheckSquare, Square, Trash2 } from "lucide-react"
import { useState, Suspense } from "react"
import { searchParticipantsByCodes, printParticipantBadgesBulk, Participant as RealParticipant } from "@/app/actions/participant"
import { toast } from "sonner"
import { BadgePrint } from "@/components/badge-print"
import { useSearchParams } from "next/navigation"
import { printBadges } from "@/utils/print-badge"

function UtilitiesContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId') || ""
  
  const [printSearch, setPrintSearch] = useState("")
  const [participants, setParticipants] = useState<RealParticipant[]>([])
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(0.2)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false)

  function handleRemoveParticipant(id: string) {
    setParticipants(prev => prev.filter(p => p.registration_uuid !== id))
    const newSelected = new Set(selectedIds)
    newSelected.delete(id)
    setSelectedIds(newSelected)
    if (selectedParticipantId === id) {
      setSelectedParticipantId(null)
    }
  }

  async function handleSearch() {
    if (!printSearch.trim()) return
    
    setIsSearching(true)
    setParticipants([])
    setSelectedParticipantId(null)
    setSelectedIds(new Set())
    
    try {
      const codes = printSearch.split(/[\n,]/).map(c => c.trim()).filter(Boolean)
      const result = await searchParticipantsByCodes(projectId, codes)
      
      if (result.success && result.data) {
        const foundParticipants = result.data as RealParticipant[]
        setParticipants(foundParticipants)
        if (foundParticipants.length > 0) {
          setSelectedParticipantId(foundParticipants[0].registration_uuid)
          setSelectedIds(new Set(foundParticipants.map(p => p.registration_uuid)))
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
    const selectedParticipants = participants.filter(p => selectedIds.has(p.registration_uuid))
    if (selectedParticipants.length === 0) {
      toast.error("Please select at least one participant to print")
      return
    }

    setIsSubmittingBulk(true)
    try {
      const codes = selectedParticipants.map(p => p.registration_code)
      const result = await printParticipantBadgesBulk(projectId, codes)
      if (result.success) {
        toast.success(`Successfully submitted ${codes.length} badge(s) to print queue`)
        
        const badgeData = selectedParticipants.map(p => {
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
        <Card className="h-full flex flex-col shadow-lg border-primary/5">
            <CardHeader className="bg-muted/50 pb-6 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Printer className="h-6 w-6 text-primary" />
                    Batch Preview Workstation
                </CardTitle>
                <CardDescription>
                    Manually search and batch print badges for participants.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider opacity-70">Participant Code(s)</Label>
                        <Textarea 
                            placeholder="Enter Code(s) separated by comma or new line" 
                            value={printSearch}
                            onChange={(e) => setPrintSearch(e.target.value)}
                            className="min-h-[100px] font-mono text-sm shadow-inner transition-all focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <Button 
                        type="button" 
                        onClick={handleSearch} 
                        disabled={isSearching} 
                        className="h-[100px] w-full md:w-48 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 border-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isSearching ? <Loader2 className="h-7 w-7 animate-spin" /> : <Search className="h-7 w-7" />}
                        <div className="flex flex-col items-start ml-3 text-left">
                            <span className="font-bold text-lg leading-none">Search</span>
                            <span className="text-xs opacity-70 mt-1">Generate Proof Sheet</span>
                        </div>
                    </Button>
                </div>

                {participants.length > 0 && (
                    <div className="pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Master: Proof Sheet (Grid) */}
                            <div className="flex-1 space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center bg-background p-4 rounded-2xl border shadow-sm gap-4">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 border-r pr-4">
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Found</span>
                                            <Badge variant="secondary" className="font-mono text-primary bg-primary/5 border-primary/10">{participants.length}</Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Selected</span>
                                            <Badge variant="default" className="bg-primary font-mono shadow-sm">{selectedIds.size}</Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="hidden lg:flex items-center gap-3 mr-4 bg-muted/30 px-4 py-2 rounded-xl border">
                                            <ZoomOut className="h-4 w-4 text-muted-foreground" />
                                            <input 
                                                type="range" 
                                                min="0.1" 
                                                max="0.4" 
                                                step="0.05" 
                                                value={zoom}
                                                onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
                                                className="w-28 h-2 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                            <ZoomIn className="h-4 w-4 text-muted-foreground" />
                                        </div>

                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="flex-1 sm:flex-none text-xs h-9 gap-2 transition-all hover:bg-muted"
                                                onClick={() => setSelectedIds(new Set(participants.map(p => p.registration_uuid)))}
                                            >
                                                <CheckSquare className="h-4 w-4 text-primary" />
                                                All
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="flex-1 sm:flex-none text-xs h-9 gap-2 transition-all hover:bg-muted"
                                                onClick={() => setSelectedIds(new Set())}
                                            >
                                                <Square className="h-4 w-4 text-muted-foreground" />
                                                None
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div 
                                    className="grid gap-6 max-h-[800px] overflow-y-auto p-6 border rounded-3xl bg-muted/5 custom-scrollbar shadow-inner"
                                    style={{ 
                                        gridTemplateColumns: `repeat(auto-fill, minmax(${zoom * 500 + 40}px, 1fr))` 
                                    }}
                                >
                                    {participants.map(p => (
                                        <div 
                                            key={p.registration_uuid}
                                            role="button"
                                            tabIndex={0}
                                            className={`
                                                relative group cursor-pointer rounded-2xl border-2 transition-all duration-300 outline-none
                                                ${selectedParticipantId === p.registration_uuid ? 'border-primary ring-8 ring-primary/5 z-10 scale-[1.02]' : 'border-transparent hover:border-primary/20 hover:scale-[1.01]'}
                                                ${selectedIds.has(p.registration_uuid) ? 'bg-primary/5 shadow-md border-primary/10' : 'bg-background shadow-sm'}
                                            `}
                                            onClick={() => setSelectedParticipantId(p.registration_uuid)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    setSelectedParticipantId(p.registration_uuid);
                                                }
                                            }}
                                        >
                                            {/* Thumbnail Container */}
                                            <div className="relative overflow-hidden rounded-xl m-1.5 bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center p-2" style={{ aspectRatio: '500/700' }}>
                                                <div 
                                                    className="transition-transform duration-500 origin-center pointer-events-none flex-shrink-0"
                                                    style={{ 
                                                        transform: `scale(${zoom})`,
                                                        width: '500px',
                                                        height: '700px'
                                                    }}
                                                >
                                                    <BadgePrint participant={p as RealParticipant & { title_other?: string }} />
                                                </div>
                                                
                                                {/* Selection Overlay */}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors duration-300" />
                                                
                                                {/* Selection Checkbox */}
                                                <div 
                                                    role="checkbox"
                                                    aria-checked={selectedIds.has(p.registration_uuid)}
                                                    tabIndex={0}
                                                    className={`absolute top-3 right-3 h-7 w-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-sm ${selectedIds.has(p.registration_uuid) ? 'bg-primary border-primary scale-110' : 'bg-white/90 border-gray-200 hover:border-primary/50'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newSelected = new Set(selectedIds);
                                                        if (newSelected.has(p.registration_uuid)) {
                                                            newSelected.delete(p.registration_uuid);
                                                        } else {
                                                            newSelected.add(p.registration_uuid);
                                                        }
                                                        setSelectedIds(newSelected);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            const newSelected = new Set(selectedIds);
                                                            if (newSelected.has(p.registration_uuid)) {
                                                                newSelected.delete(p.registration_uuid);
                                                            } else {
                                                                newSelected.add(p.registration_uuid);
                                                            }
                                                            setSelectedIds(newSelected);
                                                        }
                                                    }}
                                                >
                                                    {selectedIds.has(p.registration_uuid) && (
                                                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>

                                                {/* Remove Action */}
                                                <button
                                                    className="absolute bottom-3 right-3 h-8 w-8 bg-destructive/10 text-destructive border-2 border-destructive/20 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-destructive hover:text-white hover:scale-110 active:scale-90"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveParticipant(p.registration_uuid);
                                                    }}
                                                    title="Remove from results"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            
                                            {zoom > 0.15 && (
                                                <div className="px-3 py-2 border-t bg-muted/5 rounded-b-2xl">
                                                    <p className="text-[11px] font-bold truncate leading-tight text-foreground">
                                                        {p.first_name} {p.last_name}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5 opacity-60">
                                                        {p.registration_code}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Detail: Inspector Panel */}
                            <div className="w-full lg:w-[400px] space-y-6">
                                <div className="sticky top-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            <UserCheck className="h-5 w-5 text-primary" />
                                            Badge Inspector
                                        </h3>
                                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold">Proof Ready</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-6">Inspecting high-fidelity render for verification.</p>
                                    
                                    <div className="border shadow-2xl rounded-[2.5rem] bg-white overflow-hidden aspect-[3/4.5] relative group ring-1 ring-black/5 flex items-start justify-center pt-8">
                                        <div className="transition-transform group-hover:scale-[1.05] duration-700 origin-top pointer-events-none" style={{ transform: 'scale(0.78)' }}>
                                            <BadgePrint participant={(participants.find(p => p.registration_uuid === selectedParticipantId) || participants[0]) as RealParticipant & { title_other?: string }} />
                                        </div>
                                        
                                        {/* Info Overlay */}
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-10 text-white transform translate-y-full group-hover:translate-y-0 transition-all duration-500 ease-out">
                                            <div className="space-y-1">
                                                <p className="font-black text-2xl leading-tight">{(participants.find(p => p.registration_uuid === selectedParticipantId) || participants[0])?.first_name} {(participants.find(p => p.registration_uuid === selectedParticipantId) || participants[0])?.last_name}</p>
                                                <p className="text-base font-mono opacity-80 tracking-widest">{(participants.find(p => p.registration_uuid === selectedParticipantId) || participants[0])?.registration_code || '---'}</p>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-white/20">
                                                <p className="text-xs uppercase tracking-tighter opacity-60">Company</p>
                                                <p className="text-sm font-semibold truncate leading-none">{(participants.find(p => p.registration_uuid === selectedParticipantId) || participants[0])?.company_name || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-4">
                                        <Button 
                                            className="w-full h-16 text-xl font-bold shadow-2xl shadow-primary/30 group relative overflow-hidden rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]" 
                                            onClick={handleBulkPrint} 
                                            disabled={isSubmittingBulk || selectedIds.size === 0}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-foreground group-hover:rotate-12 group-hover:scale-150 transition-all duration-700 opacity-90" />
                                            <div className="relative flex items-center justify-center gap-3">
                                                {isSubmittingBulk ? <Loader2 className="w-6 h-6 animate-spin" /> : <Printer className="w-6 h-6 transition-transform group-hover:scale-110" />}
                                                {selectedIds.size > 0 ? `Print ${selectedIds.size} Badges` : 'None Selected'}
                                            </div>
                                        </Button>
                                        
                                        <div className="bg-muted/30 rounded-2xl p-4 border border-dashed text-center">
                                            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60 px-2 mb-2">
                                                <span>Workload</span>
                                                <span>{Math.round((selectedIds.size / Math.max(participants.length, 1)) * 100)}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary transition-all duration-1000 ease-out"
                                                    style={{ width: `${(selectedIds.size / Math.max(participants.length, 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {participants.length === 0 && !isSearching && (
                    <div className="mt-8 flex flex-col items-center justify-center text-center text-muted-foreground min-h-[450px] border-[6px] border-dashed rounded-[3rem] bg-muted/5 transition-all hover:bg-muted/10 group cursor-default">
                        <div className="bg-background p-10 rounded-[2rem] shadow-xl mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500 border-t border-l">
                            <Printer className="h-20 w-20 opacity-10 text-primary group-hover:opacity-30 transition-opacity" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground mb-2 mt-4">Empty Workstation</h3>
                        <p className="text-base max-w-[340px] leading-relaxed opacity-70">
                            Paste registration codes into the console above to populate your proof sheet.
                        </p>
                        <div className="mt-8 flex gap-3 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
                             <div className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold font-mono">CODE_123</div>
                             <div className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold font-mono">CODE_456</div>
                             <div className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold font-mono">CODE_789</div>
                        </div>
                    </div>
                )}
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

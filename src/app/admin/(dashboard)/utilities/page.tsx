"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Printer, Loader2, Search, UserCheck, ZoomIn, ZoomOut, Trash2, Cpu, Ticket } from "lucide-react"
import { useState, Suspense } from "react"
import { searchParticipantsByCodes, printParticipantBadgesBulk, Participant as RealParticipant } from "@/app/actions/participant"
import { toast } from "sonner"
import { BadgePrint } from "@/components/badge-print"
import { useSearchParams } from "next/navigation"
import { printBadges } from "@/utils/print-badge"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

function UtilitiesContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId') || ""
  
  const [printSearch, setPrintSearch] = useState("")
  const [participants, setParticipants] = useState<RealParticipant[]>([])
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(0.2)
  const [resultSearch, setResultSearch] = useState("")
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

  const filteredResults = participants.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(resultSearch.toLowerCase()) ||
    p.registration_code?.toLowerCase().includes(resultSearch.toLowerCase()) ||
    p.company_name?.toLowerCase().includes(resultSearch.toLowerCase())
  )

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
            position: p.job_position || '',
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Utilities</h1>
          <p className="text-muted-foreground mt-1 font-sans">
            System tools and operational utilities.
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden flex flex-col">
            <CardHeader className="bg-white/5 border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                        <Printer className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-display">Batch Preview Workstation</CardTitle>
                        <CardDescription className="font-medium italic">
                            Manually search and batch print badges for participants.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="p-8 space-y-8">
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 space-y-2.5 w-full">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Participant Code(s)</Label>
                            <Textarea 
                                placeholder="Enter Code(s) separated by comma or new line" 
                                value={printSearch}
                                onChange={(e) => setPrintSearch(e.target.value)}
                                className="min-h-[120px] font-mono text-sm bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 transition-all focus-visible:ring-primary/30"
                            />
                        </div>
                        <Button 
                            type="button" 
                            onClick={handleSearch} 
                            disabled={isSearching} 
                            className="btn-aurora h-[120px] w-full md:w-56 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] px-6"
                        >
                            {isSearching ? <Loader2 className="h-8 w-8 animate-spin" /> : <Search className="h-8 w-8 shrink-0" />}
                            <div className="flex flex-col items-start ml-4 text-left">
                                <span className="font-black text-xl leading-none tracking-tight">SEARCH</span>
                                <span className="text-[10px] font-bold opacity-70 mt-2 uppercase tracking-widest leading-tight">Generate Proof Sheet</span>
                            </div>
                        </Button>
                    </div>

                    {participants.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
                            <div className="flex flex-col lg:flex-row gap-8 items-start">
                                {/* Master: Proof Sheet (Grid) */}
                                <div className="flex-1 space-y-6 w-full overflow-hidden">
                                    <div className="flex flex-col sm:flex-row justify-between items-center glass p-4 rounded-3xl border-white/10 gap-4">
                                        <div className="flex flex-wrap items-center gap-4 min-w-0">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Source</span>
                                                <Badge variant="secondary" className="font-mono font-black text-primary bg-primary/10 border-0">{participants.length}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Match</span>
                                                <Badge variant="outline" className="font-mono font-black border-white/10">{filteredResults.length}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Selected</span>
                                                <Badge variant="default" className="bg-primary font-mono font-black shadow-glow-sm border-0">{selectedIds.size}</Badge>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto min-w-0">
                                            <div className="relative flex-1 min-w-[180px] group">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                                                <input 
                                                    type="text"
                                                    placeholder="Search"
                                                    value={resultSearch}
                                                    onChange={(e) => setResultSearch(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:bg-white/10 transition-all font-medium"
                                                />
                                            </div>

                                            <div className="hidden xl:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                                <ZoomOut className="h-3.5 w-3.5 text-muted-foreground/60" />
                                                <input 
                                                    type="range" 
                                                    min="0.1" 
                                                    max="0.4" 
                                                    step="0.05" 
                                                    value={zoom}
                                                    onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
                                                    className="w-24 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                                <ZoomIn className="h-3.5 w-3.5 text-muted-foreground/60" />
                                            </div>

                                            <div className="flex gap-1.5">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-9 bg-white/5 hover:bg-white/10"
                                                    onClick={() => setSelectedIds(new Set(participants.map(p => p.registration_uuid)))}
                                                >
                                                    All
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-9 bg-white/5 hover:bg-white/10"
                                                    onClick={() => setSelectedIds(new Set())}
                                                >
                                                    None
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div 
                                        className="grid gap-6 max-h-[750px] overflow-y-auto p-8 rounded-[2rem] bg-white/5 border border-white/10 custom-scrollbar shadow-inner"
                                        style={{ 
                                            gridTemplateColumns: `repeat(auto-fill, minmax(${zoom * 500 + 40}px, 1fr))` 
                                        }}
                                    >
                                        {filteredResults.map((p, idx) => (
                                            <div 
                                                key={p.registration_uuid}
                                                role="button"
                                                tabIndex={0}
                                                className={cn(
                                                    "relative group cursor-pointer rounded-2xl border-2 transition-all duration-500 outline-none overflow-hidden",
                                                    selectedParticipantId === p.registration_uuid 
                                                        ? 'border-primary shadow-glow-sm scale-[1.02] z-10' 
                                                        : 'border-white/5 hover:border-primary/20 hover:bg-white/5'
                                                )}
                                                onClick={() => setSelectedParticipantId(p.registration_uuid)}
                                            >
                                                {/* Sequence Node */}
                                                <div className="absolute top-2 left-2 h-5 min-w-[20px] px-1 bg-primary text-white text-[9px] font-black rounded-md flex items-center justify-center shadow-lg z-20 border border-white/20">
                                                    {idx + 1}
                                                </div>

                                                {/* Thumbnail Matrix */}
                                                <div className="relative overflow-hidden m-1.5 bg-white rounded-xl shadow-sm flex items-center justify-center p-2 group-hover:scale-[0.98] transition-transform duration-500" style={{ aspectRatio: '500/700' }}>
                                                    <div 
                                                        className="transition-transform duration-700 origin-center pointer-events-none flex-shrink-0"
                                                        style={{ 
                                                            transform: `scale(${zoom})`,
                                                            width: '500px',
                                                            height: '700px'
                                                        }}
                                                    >
                                                        <BadgePrint participant={p as RealParticipant & { title_other?: string }} />
                                                    </div>
                                                    
                                                    {/* Interactive Overlay */}
                                                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.03] transition-colors duration-500" />
                                                    
                                                    {/* Binary Selector */}
                                                    <div 
                                                        role="checkbox"
                                                        aria-checked={selectedIds.has(p.registration_uuid)}
                                                        className={cn(
                                                            "absolute top-3 right-3 h-8 w-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-xl z-30",
                                                            selectedIds.has(p.registration_uuid) 
                                                                ? 'bg-primary border-primary scale-110 shadow-[0_0_15px_-3px_var(--color-primary)]' 
                                                                : 'bg-background/80 border-primary/20 backdrop-blur-md hover:border-primary/50'
                                                        )}
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
                                                    >
                                                        {selectedIds.has(p.registration_uuid) && (
                                                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>

                                                    {/* Purge Button */}
                                                    <button
                                                        className="absolute bottom-3 right-3 h-8 w-8 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-red-500 hover:text-white hover:scale-110"
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
                                                    <div className="px-3 py-2.5 border-t border-white/5 bg-white/5">
                                                        <p className="text-[11px] font-bold truncate text-foreground leading-none">
                                                            {p.first_name} {p.last_name}
                                                        </p>
                                                        <p className="text-[9px] text-primary/60 truncate font-mono font-bold mt-1.5 uppercase tracking-tighter">
                                                            {p.registration_code}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Detail: Inspector Panel */}
                                <div className="w-full lg:w-[420px] shrink-0 space-y-6">
                                    <div className="sticky top-8">
                                        <div className="glass p-8 rounded-[2.5rem] border-white/10 shadow-2xl relative overflow-hidden">
                                            {/* Glow effect */}
                                            <div className="absolute -top-24 -right-24 size-48 bg-primary/10 blur-3xl rounded-full" />
                                            
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-display font-bold text-xl flex items-center gap-3">
                                                    <UserCheck className="h-6 w-6 text-primary" />
                                                    Badge Inspector
                                                </h3>
                                                <Badge variant="outline" className="bg-white/5 border-white/10 text-[9px] font-black uppercase tracking-[0.2em]">Verified</Badge>
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground italic mb-8">Inspecting high-fidelity render for verification.</p>
                                            
                                            <div className="shadow-2xl rounded-3xl bg-white overflow-hidden aspect-[3/4.2] relative group ring-4 ring-white/5 flex items-start justify-center pt-10">
                                                <div className="transition-transform group-hover:scale-[1.03] duration-1000 origin-top pointer-events-none" style={{ transform: 'scale(0.82)' }}>
                                                    <BadgePrint participant={(participants.find(p => p.registration_uuid === selectedParticipantId) || participants[0]) as RealParticipant & { title_other?: string }} />
                                                </div>
                                                
                                                {/* Intelligence Overlay */}
                                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-10 text-white transform translate-y-full group-hover:translate-y-0 transition-all duration-700 ease-out">
                                                    <div className="space-y-1">
                                                        <p className="font-display font-black text-2xl leading-tight">{(participants.find(p => p.registration_uuid === selectedParticipantId) || participants[0])?.first_name} {(participants.find(p => p.registration_uuid === selectedParticipantId) || participants[0])?.last_name}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Ticket className="size-4 text-white/60" />
                                                            <p className="text-sm font-mono font-bold tracking-[0.3em] text-white/90">{(participants.find(p => p.registration_uuid === selectedParticipantId) || participants[0])?.registration_code || '---'}</p>
                                                        </div>
                                                    </div>
                                                    <Separator className="my-6 bg-white/10" />
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Affiliation</p>
                                                        <p className="text-sm font-bold truncate italic">{(participants.find(p => p.registration_uuid === selectedParticipantId) || participants[0])?.company_name || 'Individual'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-10 space-y-6">
                                                <Button 
                                                    className="btn-aurora w-full h-16 rounded-2xl shadow-xl shadow-primary/20 relative overflow-hidden transition-all active:scale-[0.98]" 
                                                    onClick={handleBulkPrint} 
                                                    disabled={isSubmittingBulk || selectedIds.size === 0}
                                                >
                                                    <div className="relative flex items-center justify-center gap-4">
                                                        {isSubmittingBulk ? <Loader2 className="w-7 h-7 animate-spin" /> : <Printer className="w-7 h-7" />}
                                                        <span className="font-display font-black text-xl tracking-tight">
                                                            {selectedIds.size > 0 ? `Print ${selectedIds.size} Badges` : 'None Selected'}
                                                        </span>
                                                    </div>
                                                </Button>
                                                
                                                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] opacity-40 px-1 mb-3">
                                                        <span className="flex items-center gap-2"><Cpu className="size-3" /> Matrix Workload</span>
                                                        <span>{Math.round((selectedIds.size / Math.max(participants.length, 1)) * 100)}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-primary transition-all duration-1000 ease-out shadow-glow-sm"
                                                            style={{ width: `${(selectedIds.size / Math.max(participants.length, 1)) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {participants.length === 0 && !isSearching && (
                        <div className="mt-4 flex flex-col items-center justify-center text-center min-h-[500px] border-4 border-dashed rounded-[3rem] border-white/10 bg-white/[0.02] transition-all hover:bg-white/[0.04] group cursor-default">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
                                <div className="relative glass p-12 rounded-[2.5rem] border-white/10 shadow-2xl mb-8 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-700">
                                    <Printer className="h-24 w-24 opacity-20 text-primary" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-display font-black text-foreground mb-3">Empty Workstation</h3>
                            <p className="text-muted-foreground max-w-[380px] leading-relaxed italic font-medium">
                                Paste registration codes into the console above to initialize your badge synthesized proof sheet.
                            </p>
                            <div className="mt-10 flex gap-4 opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000">
                                 <Badge variant="outline" className="px-4 py-1.5 rounded-full text-[10px] font-mono font-black border-white/10">EX123</Badge>
                                 <Badge variant="outline" className="px-4 py-1.5 rounded-full text-[10px] font-mono font-black border-white/10">VI456</Badge>
                                 <Badge variant="outline" className="px-4 py-1.5 rounded-full text-[10px] font-mono font-black border-white/10">VG789</Badge>
                            </div>
                        </div>
                    )}
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
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            <span className="text-xs font-black uppercase tracking-[0.3em] opacity-20 animate-pulse">Initializing Tools</span>
        </div>
      </div>
    }>
      <UtilitiesContent />
    </Suspense>
  )
}

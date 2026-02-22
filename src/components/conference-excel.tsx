'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Conference, importConferences } from '@/app/actions/conference'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

interface ConferenceExcelOperationsProps {
  conferences: Conference[]
  projectId: string
}

function downloadTemplate() {
  const template = [{
    Title: 'Future of AI',
    SpeakerName: 'John Doe',
    SpeakerInfo: 'CEO of Tech Corp',
    ShowDate: '2024-12-01',
    StartTime: '09:00',
    EndTime: '10:00',
    Location: 'room-uuid-here',
    Quota: 100,
    ConferenceType: 'public'
  }]
  
  const worksheet = XLSX.utils.json_to_sheet(template)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template")
  XLSX.writeFile(workbook, "Conference_Template.xlsx")
}

export function ConferenceExcelOperations({ conferences: initialConferences, projectId }: Readonly<ConferenceExcelOperationsProps>) {
  const router = useRouter()
  
  // Deduplicate conferences based on conference_uuid to prevent duplicate entries in export
  const conferences = Array.from(
    new Map(initialConferences.map(c => [c.conference_uuid, c])).values()
  )

  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  function handleExport() {
    try {
      // Prepare data for export
      const data = conferences.map(conf => ({
        Title: conf.title,
        SpeakerName: conf.speaker_name,
        SpeakerInfo: conf.speaker_info,
        ShowDate: conf.show_date,
        StartTime: conf.start_time?.substring(0, 5),
        EndTime: conf.end_time?.substring(0, 5),
        Location: conf.location,
        Quota: conf.quota,
        RemainingSeats: conf.remaining_seats,
        ReservedCount: conf.reserved_count,
        ConferenceType: conf.conference_type,
        Status: conf.status,
        CanBook: conf.can_book ? 'Yes' : 'No'
      }))

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Conferences")
      
      XLSX.writeFile(workbook, `Conferences_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Export successful')
    } catch (error) {
      console.error(error)
      toast.error('Export failed')
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const worksheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[worksheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // Transform data
      const payload = jsonData.map((row: any) => ({
        title: row.Title || 'Untitled',
        speaker_name: row.SpeakerName || '',
        speaker_info: row.SpeakerInfo || '',
        show_date: row.ShowDate || new Date().toISOString().split('T')[0],
        start_time: row.StartTime || '09:00',
        end_time: row.EndTime || '10:00',
        location: row.Location || '',
        quota: Number.parseInt(row.Quota || '0'),
        conference_type: (row.ConferenceType === 'private' ? 'private' : 'public') as 'public' | 'private'
      }))

      const result = await importConferences(payload)
      
      if (result.success) {
        toast.success(`Imported ${result.count} conferences successfully`)
        setIsDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Import failed')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error processing file')
    } finally {
      setLoading(false)
      // Reset input
      e.target.value = ''
    }
  }

  return (
    <>
      <Button variant="outline" onClick={downloadTemplate} title="Download Template">
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Download Template
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" title="Import from Excel">
            <Download className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Conferences</DialogTitle>
            <DialogDescription>
              Upload an Excel file to bulk create conferences.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Need a template?</span>
              <Button variant="link" size="sm" onClick={downloadTemplate} className="h-auto p-0">
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Template
              </Button>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="file">Excel File</Label>
              <Input id="file" type="file" accept=".xlsx, .xls" onChange={handleImport} disabled={loading} />
            </div>
          </div>
          <DialogFooter>
            {loading && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="outline" onClick={handleExport} title="Export to Excel">
        <Download className="h-4 w-4 mr-2" />
        Export Excel
      </Button>
    </>
  )
}

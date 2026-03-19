'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Conference } from '@/app/actions/conference'
import { toast } from 'sonner'

interface ConferenceExcelOperationsProps {
  conferences: Conference[]
}


export function ConferenceExcelOperations({ conferences: initialConferences }: Readonly<ConferenceExcelOperationsProps>) {
  
  // Deduplicate conferences based on conference_uuid to prevent duplicate entries in export
  const conferences = Array.from(
    new Map(initialConferences.map(c => [c.conference_uuid, c])).values()
  )

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


  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      title="Export to Excel"
      className="rounded-full px-6 border-white/10 bg-white/5 hover:bg-white/10"
    >
      <Download className="h-4 w-4 mr-2" />
      Export Excel
    </Button>
  )
}

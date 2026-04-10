'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { exportConferenceReservationSummary } from '@/app/actions/conference'
import { exportOrganizerConferenceReservationSummary } from '@/app/actions/organizer-conference'

interface ConferenceExcelOperationsProps {
  projectId: string
  userRole?: string | null
}


export function ConferenceExcelOperations({ projectId, userRole }: Readonly<ConferenceExcelOperationsProps>) {
  async function handleExport() {
    try {
      const result = userRole === 'ORGANIZER'
        ? await exportOrganizerConferenceReservationSummary(projectId)
        : await exportConferenceReservationSummary(projectId)

      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: result.contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Conference_Reservation_Summary_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Export successful')
      } else {
        toast.error(result.error || 'Export failed')
      }
    } catch (error) {
      console.error(error)
      toast.error('Export failed')
    }
  }


  return (
    <Button
      variant="outline"
      onClick={handleExport}
      title="Export Conferences"
      className="rounded-full px-6 border-white/10 bg-white/5 hover:bg-white/10"
    >
      <Download className="h-4 w-4 mr-2" />
      Export Conferences
    </Button>
  )
}

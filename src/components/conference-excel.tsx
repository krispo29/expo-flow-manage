'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { exportConferenceReservationSummary } from '@/app/actions/conference'
import { exportOrganizerConferenceReservationSummary } from '@/app/actions/organizer-conference'

interface ConferenceExcelOperationsProps {
  projectId: string
  userRole?: string | null
}


export function ConferenceExcelOperations({ projectId, userRole }: Readonly<ConferenceExcelOperationsProps>) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    if (isExporting) return

    setIsExporting(true)
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
    } finally {
      setIsExporting(false)
    }
  }


  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
      title="Export Conferences"
      className="rounded-full px-6 border-white/10 bg-white/5 hover:bg-white/10"
    >
      {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {isExporting ? 'Exporting...' : 'Export Conferences'}
    </Button>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { exportConferenceSummary, exportOrganizerConferenceSummary } from '@/app/actions/report'

interface ConferenceExcelOperationsProps {
  userRole?: string
}


export function ConferenceExcelOperations({ userRole }: Readonly<ConferenceExcelOperationsProps>) {
  
  async function handleExport() {
    try {
      const result = userRole === 'ORGANIZER' 
        ? await exportOrganizerConferenceSummary()
        : await exportConferenceSummary()

      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: result.contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Conference_Summary_${new Date().toISOString().split('T')[0]}.xlsx`
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


  return (<></>
    // <Button 
    //   variant="outline" 
    //   onClick={handleExport} 
    //   title="Export to Excel"
    //   className="rounded-full px-6 border-white/10 bg-white/5 hover:bg-white/10"
    // >
    //   <Download className="h-4 w-4 mr-2" />
    //   Export Excel
    // </Button>
  )
}

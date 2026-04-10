'use client'

import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { exportInvitations } from '@/app/actions/settings'
import { exportOrganizerInvitations } from '@/app/actions/organizer-invitation'

interface InvitationExcelOperationsProps {
  projectId: string
  userRole?: string | null
}

export function InvitationExcelOperations({ projectId, userRole }: Readonly<InvitationExcelOperationsProps>) {
  async function handleExport() {
    try {
      const result = userRole === 'ORGANIZER'
        ? await exportOrganizerInvitations(projectId)
        : await exportInvitations(projectId)

      if (result.success && result.data) {
        const blob = new Blob([result.data], {
          type: result.contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Invitations_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Export successful')
      } else {
        toast.error(result.error || 'Export failed')
      }
    } catch (error) {
      console.error('Failed to export invitations:', error)
      toast.error('Export failed')
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      title="Export Invitations"
      className="rounded-full px-6 border-white/10 bg-white/5 hover:bg-white/10"
    >
      <Download className="mr-2 h-4 w-4" />
      Export Invitations
    </Button>
  )
}

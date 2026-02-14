'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Download, 
  Upload, 
  FileSpreadsheet,
  Loader2,
  AlertCircle
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { importParticipants } from '@/app/actions/participant'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ParticipantImportProps {
  projectId: string
}

export function ParticipantExcelOperations({ projectId }: ParticipantImportProps) {
  const [loading, setLoading] = useState(false)
  const [defaultType, setDefaultType] = useState('INDIVIDUAL')

  function handleDownloadTemplate() {
    const template = [
      {
        Type: 'INDIVIDUAL',
        Code: 'VIP0001',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john@example.com',
        Mobile: '0812345678',
        Company: 'Example Corp',
        Position: 'Manager',
        Room: 'Room A'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Participants")
    XLSX.writeFile(wb, "participant_template.xlsx")
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws) as any[]

        // Transform data
        const transformedData = data.map((row) => ({
          projectId,
          type: row.Type || defaultType, // Use default type if not specified
          firstName: row.FirstName,
          lastName: row.LastName,
          email: row.Email,
          mobile: row.Mobile,
          company: row.Company,
          position: row.Position,
          code: row.Code,
          room: row.Room
        }))

        const result = await importParticipants(transformedData)
        if (result.success) {
          toast.success(`Successfully imported ${result.count} participants`)
        } else {
          toast.error(result.error)
        }
      } catch (error) {
        console.error('Import Error:', error)
        toast.error('Failed to parse Excel file')
      } finally {
        setLoading(false)
        // Reset file input
        e.target.value = ''
      }
    }

    reader.readAsBinaryString(file)
  }

  return (
    <div className="border rounded-lg p-6 bg-muted/20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <Download className="h-4 w-4" />
            Download Template
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get the standard Excel template for bulk importing participants.
          </p>
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        <div>
           <h3 className="font-semibold flex items-center gap-2 mb-2">
            <Upload className="h-4 w-4" />
            Import Participants
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload your filled template.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Default Type (if missing in file)</Label>
               <Select value={defaultType} onValueChange={setDefaultType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="GROUP">Group</SelectItem>
                  <SelectItem value="ONSITE">Onsite</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="BUY">Buyer (BY)</SelectItem>
                  <SelectItem value="SPEAKER">Speaker</SelectItem>
                  <SelectItem value="PRESS">Press</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleImport}
                disabled={loading}
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

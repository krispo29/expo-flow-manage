'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  Upload, 
  FileSpreadsheet,
  Loader2
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"

interface ParticipantImportProps {
  projectId: string
}

export function ParticipantExcelOperations({ projectId }: ParticipantImportProps) {
  const [loading, setLoading] = useState(false)
  const [defaultType, setDefaultType] = useState('VI')
  const [confirmData, setConfirmData] = useState<any[] | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  function handleDownloadTemplate() {
    const template = [
      {
        EventUUID: '6109decb-d4e4-44e2-bb16-22eb0548e414',
        Title: 'Mr',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john@example.com',
        MobileCountryCode: '+66',
        MobileNumber: '812345678',
        Company: 'Example Corp',
        Position: 'Manager',
        ResidenceCountry: 'Thailand',
        AttendeeTypeCode: 'VI',
        InvitationCode: ''
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
        const data = XLSX.utils.sheet_to_json(ws)

        // Transform data
        const transformedData = data.map((row: any) => ({
          event_uuid: row.EventUUID || '6109decb-d4e4-44e2-bb16-22eb0548e414',
          title: row.Title || 'Mr',
          title_other: row.TitleOther || '',
          first_name: row.FirstName,
          last_name: row.LastName,
          email: row.Email,
          mobile_country_code: row.MobileCountryCode || '+66',
          mobile_number: row.MobileNumber,
          company_name: row.Company,
          job_position: row.Position,
          residence_country: row.ResidenceCountry || 'Thailand',
          attendee_type_code: row.AttendeeTypeCode || defaultType,
          invitation_Code: row.InvitationCode || ''
        }))

          setConfirmData(transformedData)
          setShowConfirm(true)
        } catch (error) {
          console.error('Import Error:', error)
          toast.error('Failed to parse Excel file')
        } finally {
          setLoading(false)
          e.target.value = ''
        }
      }

      reader.readAsBinaryString(file)
    }

    async function executeImport() {
      if (!confirmData) return

      setLoading(true)
      try {
        const result = await importParticipants(confirmData)
        if (result.success) {
          toast.success(`Successfully imported ${result.count} participants`)
          setShowConfirm(false)
          setConfirmData(null)
        } else {
          toast.error(result.error)
        }
      } catch (error) {
        console.error('Execute Import Error:', error)
        toast.error('An unexpected error occurred during import')
      } finally {
        setLoading(false)
      }
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
                  <SelectItem value="VI">Visitor (VI)</SelectItem>
                  <SelectItem value="VP">VIP (VP)</SelectItem>
                  <SelectItem value="EX">Exhibitor (EX)</SelectItem>
                  <SelectItem value="VG">VIP Group (VG)</SelectItem>
                  <SelectItem value="BY">Buyer (BY)</SelectItem>
                  <SelectItem value="SP">Speaker (SP)</SelectItem>
                  <SelectItem value="PR">Press (PR)</SelectItem>
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

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Confirm Participant Import</DialogTitle>
            <DialogDescription>
              We found {confirmData?.length || 0} participants in the file. Please review the preview below before confirming the import.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto border rounded-md my-4">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmData?.slice(0, 10).map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Badge variant="secondary">{row.attendee_type_code}</Badge></TableCell>
                    <TableCell className="font-medium text-xs">{row.first_name} {row.last_name}</TableCell>
                    <TableCell className="text-xs">{row.email}</TableCell>
                    <TableCell className="text-xs">{row.company_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {confirmData && confirmData.length > 10 && (
              <div className="p-3 text-center text-xs text-muted-foreground border-t bg-muted/5">
                And {confirmData.length - 10} more rows...
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirm(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={executeImport}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Confirm Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

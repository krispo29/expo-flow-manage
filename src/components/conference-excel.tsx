'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Upload, Loader2, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Conference } from '@/lib/mock-service'
import { toast } from 'sonner'
import { importConferences } from '@/app/actions/conference'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ConferenceExcelOperationsProps {
  conferences: Conference[]
  projectId: string
}

export function ConferenceExcelOperations({ conferences, projectId }: ConferenceExcelOperationsProps) {
  const [importing, setImporting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  function handleExport() {
    try {
      // Prepare data for export
      const data = conferences.map(conf => ({
        Topic: conf.topic,
        Date: new Date(conf.date).toLocaleDateString(),
        StartTime: conf.startTime,
        EndTime: conf.endTime,
        Room: conf.room,
        Capacity: conf.capacity,
        Details: conf.detail,
        SpeakerInfo: conf.speakerInfo,
        IsPublic: conf.isPublic ? 'Yes' : 'No',
        ShowOnReg: conf.showOnReg ? 'Yes' : 'No',
        AllowPreReg: conf.allowPreReg ? 'Yes' : 'No'
      }))

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Conferences")
      
      XLSX.writeFile(workbook, `Conferences_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Exported successfully')
    } catch (error) {
      console.error(error)
      toast.error('Failed to export')
    }
  }

  function handleDownloadTemplate() {
     const template = [{
        Topic: 'Future of AI',
        Date: '2024-12-01',
        StartTime: '09:00',
        EndTime: '10:00',
        Room: 'Hall A',
        Capacity: 100,
        Details: 'Description here',
        SpeakerInfo: 'Speaker Bio',
        IsPublic: 'Yes',
        ShowOnReg: 'Yes',
        AllowPreReg: 'No'
     }]
     
     const worksheet = XLSX.utils.json_to_sheet(template)
     const workbook = XLSX.utils.book_new()
     XLSX.utils.book_append_sheet(workbook, worksheet, "Template")
     XLSX.writeFile(workbook, "Conference_Template.xlsx")
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const worksheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[worksheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

      // Transform data
      const payload = jsonData.map(row => ({
        projectId,
        topic: row.Topic || 'Untitled',
        date: row.Date ? new Date(row.Date) : new Date(),
        startTime: row.StartTime || '09:00',
        endTime: row.EndTime || '10:00',
        room: row.Room || '',
        capacity: parseInt(row.Capacity || '0'),
        detail: row.Details || '',
        speakerInfo: row.SpeakerInfo || '',
        isPublic: row.IsPublic === 'Yes',
        showOnReg: row.ShowOnReg === 'Yes',
        allowPreReg: row.AllowPreReg === 'Yes'
      }))

      const result = await importConferences(payload)
      
      if (result.success) {
        toast.success(`Imported ${result.count} conferences`)
        setIsDialogOpen(false)
      } else {
        toast.error('Import failed')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error processing file')
    } finally {
      setImporting(false)
      // Reset input
      e.target.value = ''
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleExport} title="Export to Excel">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" title="Import from Excel">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Conferences</DialogTitle>
            <DialogDescription>
              Upload an Excel file to bulk create conferences.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Button variant="secondary" size="sm" onClick={handleDownloadTemplate} className="w-full">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Template
            </Button>
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file">Excel File</Label>
              <Input id="file" type="file" accept=".xlsx, .xls" onChange={handleImport} disabled={importing} />
            </div>
            
            {importing && (
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processsing...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

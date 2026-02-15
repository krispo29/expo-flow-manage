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
import { useRouter } from 'next/navigation'

interface ConferenceExcelOperationsProps {
  conferences: Conference[]
  projectId: string
}

function downloadTemplate() {
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

export function ConferenceExcelOperations({ conferences, projectId }: Readonly<ConferenceExcelOperationsProps>) {
  const router = useRouter()
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
      toast.success('ส่งออกข้อมูลสำเร็จ')
    } catch (error) {
      console.error(error)
      toast.error('ส่งออกข้อมูลล้มเหลว')
    }
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
        capacity: Number.parseInt(row.Capacity || '0'),
        detail: row.Details || '',
        speakerInfo: row.SpeakerInfo || '',
        isPublic: row.IsPublic === 'Yes',
        showOnReg: row.ShowOnReg === 'Yes',
        allowPreReg: row.AllowPreReg === 'Yes'
      }))

      const result = await importConferences(payload)
      
      if (result.success) {
        toast.success(`นำเข้า ${result.count} conferences สำเร็จ`)
        setIsDialogOpen(false)
        router.refresh()
      } else {
        toast.error('นำเข้าข้อมูลล้มเหลว')
      }
    } catch (error) {
      console.error(error)
      toast.error('เกิดข้อผิดพลาดในการประมวลผลไฟล์')
    } finally {
      setImporting(false)
      // Reset input
      e.target.value = ''
    }
  }

  return (
    <>
      <Button variant="outline" onClick={downloadTemplate} title="ดาวน์โหลด Template">
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        ดาวน์โหลด Template
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" title="นำเข้าจาก Excel">
            <Upload className="h-4 w-4 mr-2" />
            นำเข้า Excel
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>นำเข้า Conferences</DialogTitle>
            <DialogDescription>
              อัปโหลดไฟล์ Excel เพื่อสร้าง Conferences แบบจำนวนมาก
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Button variant="secondary" size="sm" onClick={downloadTemplate} className="w-full">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> ดาวน์โหลด Template
            </Button>
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file">ไฟล์ Excel</Label>
              <Input id="file" type="file" accept=".xlsx, .xls" onChange={handleImport} disabled={importing} />
            </div>
            
            {importing && (
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังประมวลผล...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="outline" onClick={handleExport} title="ส่งออกเป็น Excel">
        <Download className="h-4 w-4 mr-2" />
        ส่งออก Excel
      </Button>
    </>
  )
}

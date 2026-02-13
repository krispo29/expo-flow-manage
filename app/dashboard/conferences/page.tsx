"use client"

import { useState } from "react"
import { useConferenceStore } from "@/lib/conference-store"
import { Button } from "@/components/ui/button"
import { Plus, FileSpreadsheet, Download, Pencil, Trash2, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ConferenceForm } from "@/components/conference-form"

import * as XLSX from "xlsx"

export default function ConferencesPage() {
  const { conferences, deleteConference, addConference } = useConferenceStore()
  const [open, setOpen] = useState(false)

  // Group by Date
  const groupedConferences = conferences.reduce((groups, conference) => {
    const date = conference.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(conference);
    return groups;
  }, {} as Record<string, typeof conferences>);

  // Sort dates
  const sortedDates = Object.keys(groupedConferences).sort();

  const handleAddConference = (values: any) => {
    // Transform date to string
    const formattedDate = format(values.date, "yyyy-MM-dd")
    
    // Mock photo URL if file exists
    let photoUrl = ""
    if (values.photo instanceof File) {
        photoUrl = URL.createObjectURL(values.photo)
    }

    addConference({
        ...values,
        date: formattedDate,
        photo: photoUrl
    })
    setOpen(false)
  }

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        topic: "Sample Conference",
        date: "2026-05-20",
        timeStart: "09:00",
        timeEnd: "10:30",
        room: "Main Hall",
        limitSeats: 100,
        showOnRegPage: "TRUE",
        publicSession: "FALSE",
        learnMore: "Add description here",
        speakerInfo: "Add speaker bio here"
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Conferences")
    XLSX.writeFile(workbook, "conference_template.xlsx")
  }

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const bstr = event.target?.result
      const workbook = XLSX.read(bstr, { type: 'binary' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const data = XLSX.utils.sheet_to_json(worksheet) as any[]

      data.forEach((item) => {
        // Basic validation and transformation
        if (item.topic && item.date) {
            addConference({
                topic: String(item.topic),
                date: String(item.date),
                timeStart: String(item.timeStart || "09:00"),
                timeEnd: String(item.timeEnd || "10:00"),
                room: String(item.room || "Room A"),
                limitSeats: Number(item.limitSeats || 50),
                showOnRegPage: String(item.showOnRegPage).toUpperCase() === "TRUE",
                publicSession: String(item.publicSession).toUpperCase() === "TRUE",
                learnMore: item.learnMore ? String(item.learnMore) : "",
                speakerInfo: item.speakerInfo ? String(item.speakerInfo) : "",
                photo: ""
            })
        }
      })
      // Clear input
      e.target.value = ""
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Manage Conferences</h2>
          <p className="text-muted-foreground">
            Create and manage event sessions.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Template
            </Button>
            
            <div className="relative">
                <input 
                    type="file" 
                    id="excel-import" 
                    className="hidden" 
                    accept=".xlsx, .xls" 
                    onChange={handleImportExcel}
                />
                <Button variant="outline" onClick={() => document.getElementById('excel-import')?.click()}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Import Excel
                </Button>
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Conference
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="overflow-y-auto sm:max-w-xl w-full">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-2xl font-bold">Add New Conference</SheetTitle>
                        <SheetDescription>
                            Fill in the details for the new session. Click save when you're done.
                        </SheetDescription>
                    </SheetHeader>
                    <ConferenceForm onSubmit={handleAddConference} />
                </SheetContent>
            </Sheet>
        </div>
      </div>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {sortedDates.map((date) => (
            <Card key={date} className="overflow-hidden border-l-4 border-l-indigo-500 shadow-sm">
                <CardHeader className="bg-muted/50 py-3 border-b">
                    <CardTitle className="text-lg font-semibold flex items-center">
                        <CalendarIcon className="mr-2 h-5 w-5 text-indigo-500" />
                        {tryFormatDate(date)}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[120px]">Time</TableHead>
                                <TableHead className="w-[80px]">Photo</TableHead>
                                <TableHead>Topic (Room)</TableHead>
                                <TableHead className="text-center">Capacity</TableHead>
                                <TableHead className="text-center">Public</TableHead>
                                <TableHead className="text-center">On Reg</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groupedConferences[date].map((conf) => (
                                <TableRow key={conf.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium whitespace-nowrap text-xs text-muted-foreground align-top py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-foreground font-bold">{conf.timeStart}</span>
                                            <span>to {conf.timeEnd}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top py-4">
                                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border shadow-sm">
                                           {conf.photo ? (
                                            <img src={conf.photo} alt="Conf" className="h-full w-full object-cover" />
                                           ) : (
                                            <span className="text-[10px] text-muted-foreground p-1 text-center leading-none">No Img</span>
                                           )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-base line-clamp-2 text-indigo-900 dark:text-indigo-100">{conf.topic}</span>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Badge variant="outline" className="mr-2 rounded-sm font-normal text-xs">{conf.room}</Badge>
                                                {/* <span className="line-clamp-1">{conf.speakerInfo}</span> */}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center align-top py-4">
                                        <span className="font-mono text-sm">{conf.limitSeats}</span>
                                    </TableCell>
                                    <TableCell className="text-center align-top py-4">
                                         {conf.publicSession ? <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Public</Badge> : <span className="text-[10px] text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell className="text-center align-top py-4">
                                         {conf.showOnRegPage ? <div className="h-2 w-2 rounded-full bg-green-500 mx-auto" title="Visible" /> : <div className="h-2 w-2 rounded-full bg-gray-300 mx-auto" title="Hidden" />}
                                    </TableCell>
                                    <TableCell className="text-right align-top py-4">
                                        <div className="flex justify-end gap-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => deleteConference(conf.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        ))}
        {sortedDates.length === 0 && (
            <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-2">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No conferences scheduled</h3>
                <p className="text-sm text-muted-foreground mb-6">Get started by adding a new conference session.</p>
                <Button onClick={() => setOpen(true)}>Add Conference</Button>
            </div>
        )}
      </div>
    </div>
  )
}

function tryFormatDate(dateStr: string) {
    try {
        return format(new Date(dateStr), "EEEE, d MMMM yyyy");
    } catch {
        return dateStr;
    }
}

"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Printer, Upload, FileText, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function UtilitiesPage() {
  const [printSearch, setPrintSearch] = useState("")

  const mockRecentImports = [
    { id: 1, filename: "scanner_data_2025-02-14.csv", date: "2025-02-14 10:30 AM", records: 154, status: "Success" },
    { id: 2, filename: "scanner_data_2025-02-13.csv", date: "2025-02-13 04:15 PM", records: 89, status: "Success" },
    { id: 3, filename: "scanner_data_2025-02-12_part1.csv", date: "2025-02-12 09:00 AM", records: 210, status: "Pending" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Utilities</h1>
        <p className="text-muted-foreground">
          System tools and operational utilities.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Print Badge Utility */}
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Printer className="h-5 w-5" />
                    Print Badge
                </CardTitle>
                <CardDescription>
                    Manually search and print a badge for a participant.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <div className="space-y-2">
                    <Label>Participant Name or Code</Label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Enter Code (e.g., VIP-001)" 
                            value={printSearch}
                            onChange={(e) => setPrintSearch(e.target.value)}
                        />
                        <Button>Search</Button>
                    </div>
                </div>

                {printSearch && (
                    <div className="mt-4 p-4 border rounded-md bg-muted/20 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold">John Doe</h4>
                                <p className="text-sm text-muted-foreground">VIP - AgriCorp</p>
                                <p className="text-xs text-muted-foreground mt-1">Code: {printSearch}</p>
                            </div>
                            <Badge>Ready to Print</Badge>
                        </div>
                        <Button className="w-full mt-4" size="sm">
                            <Printer className="w-4 h-4 mr-2" />
                            Print Now
                        </Button>
                    </div>
                )}
                
                {!printSearch && (
                    <div className="mt-8 flex flex-col items-center justify-center text-center text-muted-foreground h-32 border-2 border-dashed rounded-md">
                        <Printer className="h-8 w-8 mb-2 opacity-20" />
                        <span className="text-sm">Enter a code to preview badge</span>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Import Scanner Data Utility */}
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import Scanner Data
                </CardTitle>
                <CardDescription>
                    Import .CSV files from scanner devices to sync attendance.
                </CardDescription>
            </CardHeader>
             <CardContent className="flex-1 space-y-6">
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                    <h3 className="font-semibold">Drag and drop CSV file here</h3>
                    <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                    <Button variant="outline" size="sm">Select File</Button>
                </div>

                <div>
                    <h4 className="font-semibold text-sm mb-3">Recent Imports</h4>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">File</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockRecentImports.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium text-xs">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-3 w-3 text-blue-500" />
                                                {item.filename}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-right text-muted-foreground">{item.date}</TableCell>
                                        <TableCell className="text-right">
                                            {item.status === "Success" ? (
                                                <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-yellow-500 ml-auto" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="mt-4 pt-2 border-t">
                         <Link href="/admin/scanner-import" className="text-sm text-primary hover:underline flex items-center justify-end">
                            Go to Full Import Tool &rarr;
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  )
}

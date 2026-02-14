"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Printer, Search, Download, Filter, RefreshCcw } from "lucide-react"

const reportData = [
  { name: "John Doe", company: "Tech Solutions", type: "Visitor", date: "2026-05-20", status: "Checked In" },
  { name: "Jane Smith", company: "Agri Global", type: "Exhibitor", date: "2026-05-20", status: "Pending" },
  { name: "Robert Johnson", company: "Farming Co.", type: "VIP", date: "2026-05-20", status: "Checked In" },
  { name: "Emily Davis", company: "Media Group", type: "Press", date: "2026-05-21", status: "Registered" },
  { name: "Michael Brown", company: "Innovation Labs", type: "Speaker", date: "2026-05-21", status: "Confirmed" },
]

export default function ReportsPage() {
  const [showResults, setShowResults] = React.useState(false)

  const handleExportCSV = (data: typeof reportData, filename: string) => {
    if (data.length === 0) return
    const headers = Object.keys(data[0]).join(",")
    const rows = data.map(row => Object.values(row).join(",")).join("\n")
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-in fade-in-up duration-500 print:animate-none print:space-y-0 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
            <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[hsl(180,25%,25%)] to-[hsl(180,25%,45%)]">Advanced Search & Reports</h2>
            <p className="text-muted-foreground mt-1">
            Generate detailed registration reports and manage badges.
            </p>
        </div>
        <Button 
          variant="outline" 
          className="hidden sm:flex hover:bg-muted"
          onClick={() => handleExportCSV(reportData, "history.csv")}
        >
            <Download className="mr-2 h-4 w-4" />
            Export History
        </Button>
      </div>

      <Card className="border-t-4 border-t-primary shadow-lg print:hidden">
        <CardHeader className="bg-muted/10 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Filter className="h-5 w-5" />
            </div>
            <div>
                <CardTitle className="text-lg">Search Criteria</CardTitle>
                <CardDescription>Filter members by event, type, date range, and other attributes.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Primary Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
                <Label htmlFor="event" className="font-semibold text-foreground/80">Event</Label>
                <Select defaultValue="ILDEX">
                    <SelectTrigger id="event" className="bg-background">
                        <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ILDEX">ILDEX</SelectItem>
                        <SelectItem value="HORTI">HORTI</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="keyword" className="font-semibold text-foreground/80">Keyword</Label>
                <Input id="keyword" placeholder="Name, company, or email..." className="bg-background" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="memberType" className="font-semibold text-foreground/80">Type of Member</Label>
                <Select>
                    <SelectTrigger id="memberType" className="bg-background">
                        <SelectValue placeholder="All Members" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Total Visitor">Total Visitor</SelectItem>
                        <SelectItem value="Preregister">Preregister</SelectItem>
                        <SelectItem value="Group">Group</SelectItem>
                        <SelectItem value="Onsite">Onsite</SelectItem>
                        <SelectItem value="Exhibitor">Exhibitor</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                        <SelectItem value="Buyer">Buyer</SelectItem>
                        <SelectItem value="Speaker">Speaker</SelectItem>
                        <SelectItem value="Press">Press</SelectItem>
                        <SelectItem value="Organizer">Organizer</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div className="space-y-2">
                <Label htmlFor="reportType" className="font-semibold text-foreground/80">Report Type</Label>
                <Select defaultValue="Total Visits">
                    <SelectTrigger id="reportType" className="bg-background">
                        <SelectValue placeholder="Report Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Print Badge">Print Badge</SelectItem>
                        <SelectItem value="Total Visits">Total Visits</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="dateStart" className="font-semibold text-foreground/80">Registration Start</Label>
                <Input id="dateStart" type="date" className="bg-background" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="dateEnd" className="font-semibold text-foreground/80">End</Label>
                <Input id="dateEnd" type="date" className="bg-background" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
                <Label htmlFor="invitation" className="font-semibold text-foreground/80">Invitation Code</Label>
                <Input id="invitation" placeholder="Enter code..." className="bg-background" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="country" className="font-semibold text-foreground/80">Country</Label>
                <Select>
                    <SelectTrigger id="country" className="bg-background">
                        <SelectValue placeholder="All Countries" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Thailand">Thailand</SelectItem>
                        <SelectItem value="Vietnam">Vietnam</SelectItem>
                        <SelectItem value="Singapore">Singapore</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="flex items-end pb-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="questionnaires" />
                    <Label htmlFor="questionnaires" className="font-normal cursor-pointer">Include Questionnaires data</Label>
                </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/40 px-6 py-4">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reset Filters
            </Button>
            <Button 
                className="bg-[hsl(180,25%,25%)] hover:bg-[hsl(180,25%,20%)] text-white shadow-md hover:shadow-xl transition-all"
                onClick={() => setShowResults(true)}
            >
                <Search className="mr-2 h-4 w-4" /> 
                Generate Report
            </Button>
        </CardFooter>
      </Card>

      <div className="grid gap-6 md:grid-cols-4 print:hidden">
          <Card className="bg-[hsl(180,25%,98%)] dark:bg-[hsl(180,25%,10%)] border-[hsl(180,25%,90%)] dark:border-[hsl(180,25%,20%)] shadow-sm">
             <CardHeader className="pb-2">
                 <CardDescription className="text-[hsl(180,25%,35%)] dark:text-[hsl(180,25%,60%)] font-medium">Total Found</CardDescription>
                 <CardTitle className="text-4xl font-extrabold text-[hsl(180,25%,25%)] dark:text-[hsl(180,25%,80%)]">{showResults ? "128" : "0"}</CardTitle>
             </CardHeader>
          </Card>
      </div>

      {!showResults ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10 rounded-xl border border-dashed border-2 print:hidden">
            <div className="bg-muted/30 p-4 rounded-full mb-4">
                <Printer className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground">No results generated yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Adjust the filters above and click &quot;Generate Report&quot; to see the data.
            </p>
        </div>
      ) : (
        <Card className="animate-in fade-in-up duration-500 border-none shadow-none print:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(180,25%,25%)] to-[hsl(180,25%,45%)]">Report Results</CardTitle>
                    <CardDescription>Generated on {new Date().toLocaleDateString()}</CardDescription>
                </div>
                <div className="flex gap-2 print:hidden">
                     <Button 
                       variant="outline"
                       onClick={handlePrint}
                     >
                       <Printer className="mr-2 h-4 w-4" /> Print All
                     </Button>
                     <Button 
                       variant="outline"
                       onClick={() => handleExportCSV(reportData, "report_results.csv")}
                     >
                       <Download className="mr-2 h-4 w-4" /> Export CSV
                     </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="rounded-md border">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b bg-muted/30">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground uppercase tracking-wider text-xs">Name</th>
                        <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground uppercase tracking-wider text-xs">Company</th>
                        <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground uppercase tracking-wider text-xs">Type</th>
                        <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground uppercase tracking-wider text-xs">Date</th>
                        <th className="h-12 px-4 text-right align-middle font-semibold text-muted-foreground uppercase tracking-wider text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {reportData.map((row, i) => (
                        <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">{row.name}</td>
                          <td className="p-4 align-middle">{row.company}</td>
                          <td className="p-4 align-middle">{row.type}</td>
                          <td className="p-4 align-middle">{row.date}</td>
                          <td className="p-4 align-middle text-right">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-800 shadow hover:bg-green-100/80">
                                {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  )
}

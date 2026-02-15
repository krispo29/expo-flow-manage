"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Printer, Filter, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"

export default function ReportsPage() {
  // Mock data for the "Check Print Badge" report
  const printStats = {
    total: 3500,
    printed: 2100,
    pending: 1400,
    percentage: 60,
  }

  // Mock data for "Advance Search" results
  const mockSearchResults = [
    { id: "P-1001", name: "John Doe", company: "Tech Corp", type: "VIP", status: "Printed", checkIn: "Yes" },
    { id: "P-1002", name: "Jane Smith", company: "Innovate Ltd", type: "Speaker", status: "Pending", checkIn: "No" },
    { id: "P-1003", name: "Bob Johnson", company: "Future Inc", type: "Exhibitor", status: "Printed", checkIn: "Yes" },
    { id: "P-1004", name: "Alice Brown", company: "Media Group", type: "Press", status: "Printed", checkIn: "Yes" },
    { id: "P-1005", name: "Charlie Davis", company: "Startups Co", type: "Visitor", status: "Pending", checkIn: "No" },
  ]

    const [dateStart, setDateStart] = useState<Date>()
    const [dateEnd, setDateEnd] = useState<Date>()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Analyze participant data and system usage.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Check Print Badge Report */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Badge Print Status
            </CardTitle>
            <CardDescription>
              Real-time overview of badge printing progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Printed Badges</span>
                  <span className="font-medium">{printStats.printed} / {printStats.total}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${printStats.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">{printStats.percentage}% Completed</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{printStats.printed}</div>
                  <div className="text-xs text-muted-foreground">Printed</div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{printStats.pending}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Placeholder */}
        <Card className="md:col-span-1">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Quick Statistics
            </CardTitle>
            <CardDescription>Summary of major categories.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Total Visitors</span>
                    <span className="text-xl font-bold">12,450</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Preregistered</span>
                    <span className="text-xl font-bold">8,200</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Exhibitors</span>
                    <span className="text-xl font-bold">450</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">VIPs</span>
                    <span className="text-xl font-bold">120</span>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Advance Search Section */}
      <Card className="border-none shadow-md bg-muted/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Search className="h-5 w-5 text-primary" />
                Advanced Search
              </CardTitle>
              <CardDescription>
                Filter across participants, companies, and registration metadata.
              </CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm">Reset</Button>
                <Button size="sm"><Search className="h-4 w-4 mr-2" />Search</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4">
            {/* Event Filter */}
            <div className="space-y-2">
                <Label htmlFor="event" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event</Label>
                <Select defaultValue="all">
                    <SelectTrigger id="event" className="w-full bg-background">
                        <SelectValue placeholder="Select Event" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="ildex">ILDEX</SelectItem>
                        <SelectItem value="horti">HORTI</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Keyword Search */}
            <div className="space-y-2">
                <Label htmlFor="keyword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keyword</Label>
                <Input id="keyword" placeholder="Name, Company, or ID..." className="bg-background" />
            </div>

            {/* Member Type Filter */}
            <div className="space-y-2">
                <Label htmlFor="memberType" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type of Member</Label>
                <Select defaultValue="all">
                    <SelectTrigger id="memberType" className="w-full bg-background">
                        <SelectValue placeholder="Select Member Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Visitors</SelectItem>
                        <SelectItem value="preregister">Preregister</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="onsite">Onsite</SelectItem>
                        <SelectItem value="exhibitor">Exhibitor</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="speaker">Speaker</SelectItem>
                        <SelectItem value="press">Press</SelectItem>
                        <SelectItem value="organizer">Organizer</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Report Type Filter */}
            <div className="space-y-2">
                <Label htmlFor="reportType" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</Label>
                <Select defaultValue="print">
                    <SelectTrigger id="reportType" className="w-full bg-background">
                        <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="print">Print Badge</SelectItem>
                        <SelectItem value="visits">Total Visits</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Registration Date Range (Combined Label approach or clear separate) */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reg. Date Start</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-background">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateStart ? format(dateStart, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateStart}
                            onSelect={setDateStart}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reg. Date End</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-background">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateEnd ? format(dateEnd, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateEnd}
                            onSelect={setDateEnd}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Invitation Code */}
            <div className="space-y-2">
                <Label htmlFor="inviteCode" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invitation Code</Label>
                <Input id="inviteCode" placeholder="Enter code..." className="bg-background" />
            </div>

            {/* Country Filter */}
            <div className="space-y-2">
                <Label htmlFor="country" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Country</Label>
                <Select defaultValue="all">
                    <SelectTrigger id="country" className="w-full bg-background">
                        <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        <SelectItem value="thailand">Thailand</SelectItem>
                        <SelectItem value="vietnam">Vietnam</SelectItem>
                        <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Questionnaire Toggle and Actions */}
            <div className="flex items-center space-x-2 lg:col-span-2 xl:col-span-1 pt-2 lg:pt-8 min-h-[40px]">
                <Checkbox id="includeQuestions" />
                <Label htmlFor="includeQuestions" className="text-sm font-medium leading-none cursor-pointer">
                    Include Questionnaires
                </Label>
            </div>

            <div className="flex items-center lg:col-span-1 xl:col-span-3 justify-end pt-2 lg:pt-8 gap-3">
                <Button variant="secondary" className="bg-background shadow-sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results Section */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Search Results</CardTitle>
          <CardDescription>Found {mockSearchResults.length} participants matching your filters.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Badge</TableHead>
                  <TableHead>Check-In</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSearchResults.map((result) => (
                  <TableRow key={result.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">{result.id}</TableCell>
                    <TableCell className="font-medium">{result.name}</TableCell>
                    <TableCell>{result.company}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{result.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={result.status === "Printed" ? "default" : "secondary"} className="rounded-full px-2 py-0">
                        {result.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${result.checkIn === "Yes" ? "bg-green-500" : "bg-muted"}`} />
                            <span className={result.checkIn === "Yes" ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                {result.checkIn}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

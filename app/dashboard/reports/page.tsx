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
import { Checkbox } from "@/components/ui/checkbox" // Need to add checkbox? 
import { Printer, Search, Download } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Advanced Search & Reports</h2>
        <p className="text-muted-foreground">
          Generate registration reports and print badges.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
          <CardDescription>Filter members by event, type, and date.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label htmlFor="event">Event</Label>
                <Select defaultValue="ILDEX">
                    <SelectTrigger id="event">
                        <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ILDEX">ILDEX</SelectItem>
                        <SelectItem value="HORTI">HORTI</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="keyword">Keyword</Label>
                <Input id="keyword" placeholder="Search by name, company, email..." />
            </div>
             <div className="space-y-2">
                <Label htmlFor="memberType">Type of Member</Label>
                <Select>
                    <SelectTrigger id="memberType">
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
             <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select defaultValue="Total Visits">
                    <SelectTrigger id="reportType">
                        <SelectValue placeholder="Report Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Print Badge">Print Badge</SelectItem>
                        <SelectItem value="Total Visits">Total Visits</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="dateStart">Registration Start</Label>
                <Input id="dateStart" type="date" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="dateEnd">End</Label>
                <Input id="dateEnd" type="date" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="invitation">Invitation Code</Label>
                <Input id="invitation" placeholder="Code..." />
            </div>
             <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select>
                    <SelectTrigger id="country">
                        <SelectValue placeholder="All Countries" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Thailand">Thailand</SelectItem>
                        <SelectItem value="Vietnam">Vietnam</SelectItem>
                        <SelectItem value="Singapore">Singapore</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="flex items-center space-x-2 pt-8">
                {/* Need Checkbox component imported or just input type checkbox */}
                <input type="checkbox" id="questionnaires" className="accent-primary h-4 w-4" />
                <Label htmlFor="questionnaires">Include Questionnaires</Label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
            <Button variant="ghost" className="text-muted-foreground">Reset Filters</Button>
            <Button className="bg-primary"><Search className="mr-2 h-4 w-4" /> Generate Report</Button>
        </CardFooter>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         {/* Placeholder Stats */}
          <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
             <CardHeader className="pb-2">
                 <CardDescription>Total Found</CardDescription>
                 <CardTitle className="text-4xl">0</CardTitle>
             </CardHeader>
          </Card>
      </div>

      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
        <Printer className="mx-auto h-10 w-10 opacity-20 mb-3" />
        No results generated yet. Please adjust filters and search.
      </div>
    </div>
  )
}

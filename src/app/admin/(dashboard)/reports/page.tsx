import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Printer, Filter } from "lucide-react"

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

        {/* Quick Search / Filter Placeholder */}
        <Card className="md:col-span-1">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Quick Filters
            </CardTitle>
            <CardDescription>Filter report data by criteria.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start">Badge Printed (Yes)</Button>
                <Button variant="outline" className="justify-start">Badge Printed (No)</Button>
                <Button variant="outline" className="justify-start">Checked In (Yes)</Button>
                <Button variant="outline" className="justify-start">Checked In (No)</Button>
                <Button variant="outline" className="justify-start">VIP Only</Button>
                <Button variant="outline" className="justify-start">Press Only</Button>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Advance Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search Results
          </CardTitle>
          <CardDescription>
            Search across participants, companies, and registration types.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input placeholder="Search by name, company, or ID..." className="max-w-sm" />
            <Button>Search</Button>
            <Button variant="secondary">Export CSV</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Badge Status</TableHead>
                  <TableHead>Check-In</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSearchResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.id}</TableCell>
                    <TableCell>{result.name}</TableCell>
                    <TableCell>{result.company}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{result.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={result.status === "Printed" ? "default" : "secondary"}>
                        {result.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <span className={result.checkIn === "Yes" ? "text-green-600 font-medium" : "text-muted-foreground"}>
                            {result.checkIn}
                        </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Details</Button>
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

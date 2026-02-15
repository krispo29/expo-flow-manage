import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          View and export system reports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Check Print Badge Report */}
        <Card>
          <CardHeader>
            <CardTitle>Check Print Badge</CardTitle>
            <CardDescription>
              Verify which participants have printed their badges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* TODO: Implement Chart or Data Table */}
            <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-md border border-dashed">
              <span className="text-muted-foreground">Badge Print Stats Placeholder</span>
            </div>
            <div className="mt-4 flex justify-end">
                 <Button variant="outline">View Details</Button>
            </div>
          </CardContent>
        </Card>

        {/* Advance Search Report */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Search</CardTitle>
            <CardDescription>
              Deep search across all participants and data.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-md border border-dashed">
              <span className="text-muted-foreground">Search Tools Placeholder</span>
            </div>
             <div className="mt-4 flex justify-end">
                 <Button variant="outline">Open Search</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, Upload } from "lucide-react"
import Link from "next/link"

export default function UtilitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Utilities</h1>
        <p className="text-muted-foreground">
          System tools and data operations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Print Badge */}
        <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Printer className="h-5 w-5" />
                    Print Badge
                </CardTitle>
                <CardDescription>
                    Manually print a badge for a participant.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full" variant="secondary">Open Print Utility</Button>
            </CardContent>
        </Card>

        {/* Import Scanner Data */}
        <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import Scanner Data
                </CardTitle>
                <CardDescription>
                    Import .CSV files from scanner devices.
                </CardDescription>
            </CardHeader>
             <CardContent>
                <Button className="w-full" asChild>
                    <Link href="/admin/scanner-import">
                        Go to Import Tool
                    </Link>
                </Button>
            </CardContent>
        </Card>

      </div>
    </div>
  )
}

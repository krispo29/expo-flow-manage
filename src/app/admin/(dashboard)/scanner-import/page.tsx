"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"

export default function ScannerImportPage() {
  const [isUploading, setIsUploading] = useState(false)
  
  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsUploading(true)
    
    // Simulate upload delay
    setTimeout(() => {
        setIsUploading(false)
        toast.success("File imported successfully")
    }, 2000)
  }

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Scanner Import</h1>
        <p className="text-muted-foreground">
          Import data from handheld scanner devices.
        </p>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Import CSV</CardTitle>
            <CardDescription>Upload the .csv file exported from the scanner.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleUpload} className="space-y-4 max-w-sm">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="file">Scanner File</Label>
                    <Input id="file" type="file" accept=".csv" required />
                </div>
                <Button type="submit" disabled={isUploading}>
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importing...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Import Data
                        </>
                    )}
                </Button>
            </form>
        </CardContent>
       </Card>
    </div>
  )
}

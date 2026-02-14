'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Loader2, Upload, CheckCircle } from 'lucide-react'
import { processScannerData } from '@/app/actions/participant'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ScannerImport({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ processed: number, updated: number } | null>(null)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large (max 5MB)')
      return
    }

    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)

    try {
      const response = await processScannerData(formData)
      if (response.success) {
        setResult({ processed: response.processed || 0, updated: response.updated || 0 })
        toast.success(`Processed ${response.processed} records. Updated ${response.updated} participants.`)
      } else {
        toast.error(response.error || 'Failed to process file')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
      e.target.value = '' // Reset input
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Scanner Data Import
        </CardTitle>
        <CardDescription>
          Upload .csv or .txt files from badge scanners to update attendance status.
          Format: One barcode/QR code per line.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".csv, .txt"
            onChange={handleImport}
            disabled={loading}
            className="flex-1"
          />
          {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>

        {result && (
          <div className="mt-4 p-4 bg-secondary/50 rounded-lg flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-700">Import Successful</p>
              <p className="text-sm text-green-600">
                Processed {result.processed} codes. 
                Running total attendance updated for {result.updated} participants.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

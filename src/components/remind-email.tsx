'use client'

import { useMemo, useRef, useState } from 'react'
import { Loader2, Mail, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { remindEmailConfirmation } from '@/app/actions/participant'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface RemindEmailProps {
  projectId: string
}

function normalizeCode(value: string) {
  return value
    .replaceAll(/[\u0E00-\u0E7F]/g, '')
    .trim()
    .toUpperCase()
}

function parseCodes(value: string) {
  return value
    .split(/[,\n\r]+/)
    .map(normalizeCode)
    .filter(Boolean)
}

function hasCodeSeparator(value: string) {
  return /[,\n\r]/.test(value)
}

export function RemindEmail({ projectId }: RemindEmailProps) {
  const [rows, setRows] = useState<string[]>([''])
  const [submitting, setSubmitting] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const codes = useMemo(() => rows.map(normalizeCode).filter(Boolean), [rows])
  const codesPreview = useMemo(() => {
    if (codes.length === 0) {
      return 'No registration codes'
    }

    if (codes.length <= 8) {
      return codes.join(', ')
    }

    return `${codes.slice(0, 4).join(', ')} ... ${codes.slice(-2).join(', ')}`
  }, [codes])
  const canClear = rows.length > 1 || rows[0] !== ''

  const focusRow = (index: number) => {
    setTimeout(() => inputRefs.current[index]?.focus(), 0)
  }

  const replaceRowWithCodes = (index: number, value: string) => {
    const parsedCodes = parseCodes(value)
    const replacement = parsedCodes.length > 0 ? parsedCodes : ['']

    setRows((prev) => {
      const next = [...prev]
      next.splice(index, 1, ...replacement)

      if (next.length === 0 || next[next.length - 1]) {
        next.push('')
      }

      return next
    })

    focusRow(index + replacement.length)
  }

  const updateRow = (index: number, value: string) => {
    if (hasCodeSeparator(value)) {
      replaceRowWithCodes(index, value)
      return
    }

    setRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? normalizeCode(value) : row
      )
    )
  }

  const insertRowAfter = (index: number) => {
    setRows((prev) => {
      const next = [...prev]
      next.splice(index + 1, 0, '')
      return next
    })
    focusRow(index + 1)
  }

  const removeRow = (index: number) => {
    setRows((prev) => {
      if (prev.length === 1) {
        return ['']
      }

      return prev.filter((_, rowIndex) => rowIndex !== index)
    })
    focusRow(Math.max(0, index - 1))
  }

  const clearRows = () => {
    setRows([''])
    focusRow(0)
  }

  const sendReminders = async () => {
    if (codes.length === 0) {
      toast.error('Enter at least one registration code')
      focusRow(0)
      return
    }

    setSubmitting(true)

    try {
      const result = await remindEmailConfirmation(projectId, codes)

      if (result.success) {
        toast.success(
          `Reminder email sent to ${codes.length} code${codes.length === 1 ? '' : 's'}`
        )
        clearRows()
      } else {
        toast.error(result.error || 'Failed to send reminder email')
      }
    } catch (error) {
      console.error('Failed to send reminder email:', error)
      toast.error('Failed to send reminder email')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="glass shadow-primary/5 border-white/10 shadow-xl">
      <CardHeader className="border-b border-white/10 bg-white/5 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="font-display text-2xl">
              Remind email
            </CardTitle>
            <CardDescription className="font-medium">
              Email confirmation reminders by registration code.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="bg-background/40 w-fit border-white/10 text-[10px] font-black tracking-widest uppercase"
          >
            {codes.length} queued
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-inner shadow-black/5">
          <div className="flex max-h-[min(56vh,520px)] flex-col gap-1 overflow-y-auto pr-1">
            {rows.map((row, index) => (
              <div
                key={index}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-xl border border-transparent px-2 transition-colors',
                  row ? 'bg-white/5' : 'bg-transparent'
                )}
              >
                <span className="text-muted-foreground/70 w-8 shrink-0 text-right font-mono text-xs font-bold">
                  {index + 1}.
                </span>
                <Input
                  ref={(element) => {
                    inputRefs.current[index] = element
                  }}
                  value={row}
                  placeholder={index === 0 ? 'Registration code' : ''}
                  className="h-9 border-transparent bg-transparent px-2 font-mono text-sm shadow-none focus:border-transparent focus:bg-white/5 focus:ring-0"
                  onChange={(event) => updateRow(index, event.target.value)}
                  onPaste={(event) => {
                    const pastedText = event.clipboardData.getData('text')
                    if (!hasCodeSeparator(pastedText)) return

                    event.preventDefault()
                    replaceRowWithCodes(index, pastedText)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      insertRowAfter(index)
                    }

                    if (
                      event.key === 'Backspace' &&
                      row === '' &&
                      rows.length > 1
                    ) {
                      event.preventDefault()
                      removeRow(index)
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                  onClick={() => removeRow(index)}
                  aria-label={`Remove registration code row ${index + 1}`}
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground min-w-0 flex-1 text-xs font-medium">
          <span className="block truncate">
            {codes.length > 0
              ? `${codes.length.toLocaleString()} queued: `
              : ''}
            {codesPreview}
          </span>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={clearRows}
            disabled={!canClear || submitting}
          >
            <Trash2 />
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => void sendReminders()}
            disabled={codes.length === 0 || submitting}
          >
            {submitting ? <Loader2 className="animate-spin" /> : <Mail />}
            Send remind
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

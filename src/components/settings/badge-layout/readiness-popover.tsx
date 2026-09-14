'use client'

import { CheckCircle2, AlertTriangle, Printer, Info, ChevronDown } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ReadinessPopoverProps {
  validationSuccess: boolean
  canPublish: boolean
  dirty: boolean
  draftRevision: number
  publishedRevision: number
  onTestPrint: () => void
  disabled?: boolean
}

export function ReadinessPopover({
  validationSuccess,
  canPublish,
  dirty,
  draftRevision,
  publishedRevision,
  onTestPrint,
  disabled,
}: ReadinessPopoverProps) {
  const stateKey: 'invalid' | 'ready' | 'testRequired' = !validationSuccess
    ? 'invalid'
    : canPublish
    ? 'ready'
    : 'testRequired'

  const statusConfig = {
    invalid: {
      text: 'Invalid layout',
      pillClass:
        'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-950/40 dark:text-red-400',
      icon: <AlertTriangle className="size-3.5 text-red-600 dark:text-red-400" />,
    },
    ready: {
      text: 'Ready to publish',
      pillClass:
        'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
      icon: <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />,
    },
    testRequired: {
      text: 'Test print required',
      pillClass:
        'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
      icon: <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400" />,
    },
  }[stateKey]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${statusConfig.pillClass}`}
          aria-label="Publication readiness status"
        >
          {statusConfig.icon}
          <span>{statusConfig.text}</span>
          <ChevronDown className="size-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="font-semibold text-sm">Publication Checklist</h4>
          <Badge
            variant="outline"
            className={
              stateKey === 'ready'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px]'
                : 'border-amber-300 bg-amber-50 text-amber-700 text-[10px]'
            }
          >
            Draft r{draftRevision} · {publishedRevision ? `Live r${publishedRevision}` : 'Unpublished'}
          </Badge>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-start gap-2">
            {validationSuccess ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertTriangle className="size-4 shrink-0 text-red-600 mt-0.5" />
            )}
            <div>
              <p className="font-medium text-foreground">
                1. Layout geometry
              </p>
              <p className="text-muted-foreground">
                {validationSuccess
                  ? 'All fields remain strictly inside paper boundaries.'
                  : 'Fix layout errors shown on screen.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            {canPublish ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
            )}
            <div>
              <p className="font-medium text-foreground">
                2. Physical test print
              </p>
              <p className="text-muted-foreground">
                {canPublish
                  ? 'Current saved draft verified within last 24h.'
                  : dirty
                    ? 'Save draft and test print before publishing.'
                    : 'Test print this saved draft; editing requires another test.'}
              </p>
              {!canPublish && (
                <Button
                  size="xs"
                  variant="outline"
                  className="mt-1.5 gap-1 text-[11px] normal-case"
                  onClick={onTestPrint}
                  disabled={disabled || !validationSuccess}
                >
                  <Printer className="size-3" /> Run Test Print
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Info className="size-4 shrink-0 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                3. Print driver settings
              </p>
              <p className="text-muted-foreground">
                Scale 100%, matching driver paper size, 0 margins, headers/footers off.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Info className="size-4 shrink-0 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                4. Onsite calibration
              </p>
              <p className="text-muted-foreground">
                Uniform position shifts require workstation calibration. If size is wrong, fix driver scale.
              </p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground border-t pt-2">
          Test evidence is scoped locally to this browser and expires in 24 hours.
        </p>
      </PopoverContent>
    </Popover>
  )
}

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Clock, ChevronUp, ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface TimePicker24Props {
  value?: string          // "HH:mm" format
  onChange?: (value: string) => void
  name?: string
  id?: string
  required?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
}

function padZero(n: number): string {
  return n.toString().padStart(2, '0')
}

function parseTime(val: string | undefined): { hour: number; minute: number } {
  if (!val) return { hour: 0, minute: 0 }
  const parts = val.split(':')
  return {
    hour: Math.min(23, Math.max(0, parseInt(parts[0] || '0', 10) || 0)),
    minute: Math.min(59, Math.max(0, parseInt(parts[1] || '0', 10) || 0)),
  }
}

export function TimePicker24({
  value,
  onChange,
  name,
  id,
  required,
  placeholder = 'Select time',
  className,
  disabled,
}: TimePicker24Props) {
  const [open, setOpen] = React.useState(false)
  const { hour, minute } = parseTime(value)
  const hasValue = !!value

  const hourListRef = React.useRef<HTMLDivElement>(null)
  const minuteListRef = React.useRef<HTMLDivElement>(null)

  const scrollToSelected = React.useCallback((ref: React.RefObject<HTMLDivElement | null>, index: number) => {
    const el = ref.current
    if (!el) return
    const child = el.children[index] as HTMLElement | undefined
    if (child) {
      child.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  }, [])

  // Scroll to current selection when opened
  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        scrollToSelected(hourListRef, hour)
        scrollToSelected(minuteListRef, minute)
      })
    }
  }, [open, hour, minute, scrollToSelected])

  function setTime(h: number, m: number) {
    onChange?.(`${padZero(h)}:${padZero(m)}`)
  }

  function incrementHour() {
    setTime((hour + 1) % 24, minute)
  }

  function decrementHour() {
    setTime((hour - 1 + 24) % 24, minute)
  }

  function incrementMinute() {
    setTime(hour, (minute + 1) % 60)
  }

  function decrementMinute() {
    setTime(hour, (minute - 1 + 60) % 60)
  }

  const displayValue = hasValue ? `${padZero(hour)}:${padZero(minute)}` : ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          disabled={disabled}
          className={cn(
            'h-11 w-full justify-start text-left font-normal gap-2',
            !hasValue && 'text-muted-foreground',
            className
          )}
        >
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          {hasValue ? (
            <span className="font-mono text-base tracking-wider">{displayValue}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 overflow-hidden"
        align="start"
        sideOffset={4}
      >
        {/* Compact spinner-style header */}
        <div className="px-4 py-3 border-b bg-slate-50/80">
          <div className="flex items-center justify-center gap-1">
            {/* Hours spinner */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={incrementHour}
                className="p-1 rounded-md hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ChevronUp className="size-4" />
              </button>
              <div className="font-mono text-3xl font-bold tracking-tight text-primary tabular-nums min-w-[2.5rem] text-center">
                {padZero(hour)}
              </div>
              <button
                type="button"
                onClick={decrementHour}
                className="p-1 rounded-md hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>

            <span className="font-mono text-3xl font-bold text-slate-400 select-none mx-1">:</span>

            {/* Minutes spinner */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={incrementMinute}
                className="p-1 rounded-md hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ChevronUp className="size-4" />
              </button>
              <div className="font-mono text-3xl font-bold tracking-tight text-primary tabular-nums min-w-[2.5rem] text-center">
                {padZero(minute)}
              </div>
              <button
                type="button"
                onClick={decrementMinute}
                className="p-1 rounded-md hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>

            <span className="ml-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">hrs</span>
          </div>
        </div>

        {/* Scrollable grid: Hours + Minutes side by side */}
        <div className="flex divide-x">
          {/* Hours column */}
          <div className="flex flex-col">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center py-1.5 bg-slate-50/50 border-b">
              Hour
            </div>
            <div
              ref={hourListRef}
              className="h-[200px] overflow-y-auto scrollbar-thin py-1 px-1"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setTime(h, minute)}
                  className={cn(
                    'w-full px-4 py-1.5 text-sm font-mono tabular-nums text-center rounded-md transition-all',
                    hour === h
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'hover:bg-slate-100 text-slate-600'
                  )}
                >
                  {padZero(h)}
                </button>
              ))}
            </div>
          </div>

          {/* Minutes column */}
          <div className="flex flex-col">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center py-1.5 bg-slate-50/50 border-b">
              Min
            </div>
            <div
              ref={minuteListRef}
              className="h-[200px] overflow-y-auto scrollbar-thin py-1 px-1"
            >
              {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTime(hour, m)}
                  className={cn(
                    'w-full px-4 py-1.5 text-sm font-mono tabular-nums text-center rounded-md transition-all',
                    minute === m
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'hover:bg-slate-100 text-slate-600'
                  )}
                >
                  {padZero(m)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick presets */}
        <div className="border-t bg-slate-50/50 px-3 py-2">
          <div className="flex gap-1.5 flex-wrap justify-center">
            {['09:00', '10:00', '13:00', '14:00', '16:00', '18:00'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  const { hour: ph, minute: pm } = parseTime(preset)
                  setTime(ph, pm)
                }}
                className={cn(
                  'px-2.5 py-1 text-xs font-mono rounded-full border transition-all',
                  value === preset
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={displayValue} required={required} />
    </Popover>
  )
}

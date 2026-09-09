'use client'

import React, { useMemo } from 'react'

export interface CanvasRulersProps {
  widthMm: number
  heightMm: number
  selectedField?: {
    xMm: number
    yMm: number
    widthMm: number
    heightMm: number
  } | null
  cursorMm?: {
    x?: number
    y?: number
  } | null
  showRulers?: boolean
  children: React.ReactNode
}

export function CanvasRulers({
  widthMm,
  heightMm,
  selectedField,
  cursorMm,
  showRulers = true,
  children,
}: CanvasRulersProps) {
  const mmStepX = Math.max(1, Math.floor(widthMm))
  const mmStepY = Math.max(1, Math.floor(heightMm))

  const horizontalTicks = useMemo(() => {
    return Array.from({ length: mmStepX + 1 }).map((_, i) => {
      const isMajor = i % 10 === 0
      const isMedium = i % 5 === 0 && !isMajor
      const y1 = isMajor ? 8 : isMedium ? 12 : 15
      return (
        <g key={i}>
          <line
            x1={i}
            x2={i}
            y1={y1}
            y2={20}
            stroke="currentColor"
            strokeWidth={isMajor ? 0.5 : 0.25}
            className="text-muted-foreground/60"
          />
          {isMajor && i > 0 && i < widthMm - 2 && (
            <text
              x={i + 0.6}
              y={7}
              fontSize={5.5}
              fill="currentColor"
              className="text-muted-foreground font-mono"
              textAnchor="start"
            >
              {i}
            </text>
          )}
        </g>
      )
    })
  }, [mmStepX, widthMm])

  const verticalTicks = useMemo(() => {
    return Array.from({ length: mmStepY + 1 }).map((_, i) => {
      const isMajor = i % 10 === 0
      const isMedium = i % 5 === 0 && !isMajor
      const x1 = isMajor ? 8 : isMedium ? 12 : 15
      return (
        <g key={i}>
          <line
            x1={x1}
            x2={20}
            y1={i}
            y2={i}
            stroke="currentColor"
            strokeWidth={isMajor ? 0.5 : 0.25}
            className="text-muted-foreground/60"
          />
          {isMajor && i > 0 && i < heightMm - 2 && (
            <text
              x={2}
              y={i + 2.5}
              fontSize={5.5}
              fill="currentColor"
              className="text-muted-foreground font-mono"
              textAnchor="start"
            >
              {i}
            </text>
          )}
        </g>
      )
    })
  }, [mmStepY, heightMm])

  if (!showRulers) {
    return <>{children}</>
  }

  return (
    <div className="relative inline-flex flex-col select-none">
      {/* Top ruler header row */}
      <div className="flex">
        {/* Top-left corner unit square */}
        <div
          aria-hidden="true"
          className="w-5 h-5 flex items-center justify-center text-[9px] font-mono font-medium text-muted-foreground border-r border-b bg-muted/40 shrink-0"
        >
          mm
        </div>
        {/* Top horizontal ruler */}
        <div
          aria-label="Horizontal ruler"
          className="h-5 border-b bg-muted/25 overflow-hidden relative"
          style={{ width: `${widthMm}mm` }}
        >
          <svg
            className="w-full h-full block"
            viewBox={`0 0 ${widthMm} 20`}
            preserveAspectRatio="none"
          >
            {/* Highlighted range for selected field */}
            {selectedField && (
              <rect
                x={selectedField.xMm}
                y={0}
                width={selectedField.widthMm}
                height={20}
                className="fill-blue-500/20 stroke-blue-500/40"
                strokeWidth={0.3}
              />
            )}
            {/* Dynamic cursor tracking line */}
            {cursorMm?.x !== undefined && (
              <line
                x1={cursorMm.x}
                x2={cursorMm.x}
                y1={0}
                y2={20}
                stroke="#ef4444"
                strokeWidth={0.7}
              />
            )}
            {/* Millimeter ticks */}
            {horizontalTicks}
          </svg>
        </div>
      </div>

      {/* Main body row: Vertical ruler + Badge card */}
      <div className="flex">
        {/* Left vertical ruler */}
        <div
          aria-label="Vertical ruler"
          className="w-5 border-r bg-muted/25 overflow-hidden relative shrink-0"
          style={{ height: `${heightMm}mm` }}
        >
          <svg
            className="w-full h-full block"
            viewBox={`0 0 20 ${heightMm}`}
            preserveAspectRatio="none"
          >
            {/* Highlighted range for selected field */}
            {selectedField && (
              <rect
                x={0}
                y={selectedField.yMm}
                width={20}
                height={selectedField.heightMm}
                className="fill-blue-500/20 stroke-blue-500/40"
                strokeWidth={0.3}
              />
            )}
            {/* Dynamic cursor tracking line */}
            {cursorMm?.y !== undefined && (
              <line
                x1={0}
                x2={20}
                y1={cursorMm.y}
                y2={cursorMm.y}
                stroke="#ef4444"
                strokeWidth={0.7}
              />
            )}
            {/* Millimeter ticks */}
            {verticalTicks}
          </svg>
        </div>

        {/* Paper card / Canvas element */}
        <div className="relative shadow-md ring-1 ring-border/40 bg-card">
          {children}
        </div>
      </div>
    </div>
  )
}

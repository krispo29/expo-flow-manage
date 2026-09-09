'use client'
import { useLayoutEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  fieldKeys,
  type BadgeLayout,
  type BadgeRenderData,
  type Calibration,
} from '@/lib/badge-layout/schema'

export function LayoutBadgeCard({
  layout,
  data,
  calibration = { offsetXMm: 0, offsetYMm: 0 },
  onReady,
}: {
  layout: BadgeLayout
  data: BadgeRenderData
  calibration?: Calibration
  onReady?: () => void
}) {
  const root = useRef<HTMLElement>(null)
  const ready = useRef(onReady)
  useLayoutEffect(() => {
    ready.current = onReady
  }, [onReady])
  useLayoutEffect(() => {
    const page = root.current
    if (!page) return
    let cancelled = false
    const fit = async () => {
      await page.ownerDocument.fonts?.ready
      if (cancelled) return
      for (const key of fieldKeys) {
        const field = layout.fields[key]
        if (field.kind !== 'text' || !field.visible) continue
        const element = page.querySelector<HTMLElement>(
          '[data-text-field="' + key + '"]'
        )
        if (!element || !element.parentElement) continue
        element.style.maxHeight = 'none'
        const availableWidth = element.parentElement.clientWidth
        const availableHeight = element.parentElement.clientHeight
        const fits = (pt: number) => {
          element.style.fontSize = pt + 'pt'
          const linePx = ((pt * 96) / 72) * field.lineHeight
          return (
            element.scrollWidth <= availableWidth + 0.5 &&
            element.scrollHeight <=
              Math.min(availableHeight, linePx * field.maxLines) + 0.5
          )
        }
        let chosen = field.fontSizePt
        if (field.fitMode === 'shrink-then-clip' && !fits(chosen)) {
          let low = field.minFontSizePt,
            high = field.fontSizePt
          for (let i = 0; i < 12; i++) {
            const mid = (low + high) / 2
            if (fits(mid)) low = mid
            else high = mid
          }
          chosen = Math.max(field.minFontSizePt, Math.floor(low * 10) / 10)
        }
        element.dataset.overflow = String(!fits(chosen))
        element.style.fontSize = chosen + 'pt'
        element.style.maxHeight =
          Math.min(
            availableHeight,
            ((chosen * 96) / 72) * field.lineHeight * field.maxLines
          ) + 'px'
      }
      if (!cancelled) ready.current?.()
    }
    void fit()
    return () => {
      cancelled = true
    }
  }, [layout, data])
  return (
    <section
      ref={root}
      data-badge-page
      style={{
        width: layout.paper.widthMm + 'mm',
        height: layout.paper.heightMm + 'mm',
        position: 'relative',
        background: 'white',
        color: 'black',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
        breakAfter: 'page',
        breakInside: 'avoid',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform:
            'translate(' +
            calibration.offsetXMm +
            'mm,' +
            calibration.offsetYMm +
            'mm)',
        }}
      >
        {fieldKeys.map((key) => {
          const field = layout.fields[key]
          if (!field.visible) return null
          return (
            <div
              key={key}
              data-layout-field={key}
              style={{
                position: 'absolute',
                left: field.xMm + 'mm',
                top: field.yMm + 'mm',
                width: field.widthMm + 'mm',
                height: field.heightMm + 'mm',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              {field.kind === 'qr' ? (
                <BadgeQr value={data.registrationCode} />
              ) : (
                <div
                  data-text-field={key}
                  style={{
                    fontSize: field.fontSizePt + 'pt',
                    fontWeight: field.fontWeight,
                    lineHeight: field.lineHeight,
                    letterSpacing: field.letterSpacingPt + 'pt',
                    textAlign: field.textAlign,
                    textTransform: field.textTransform,
                    whiteSpace: field.maxLines === 1 ? 'nowrap' : 'normal',
                    overflowWrap: 'anywhere',
                    overflow: 'hidden',
                    margin: 0,
                  }}
                >
                  {data[key as keyof BadgeRenderData]}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
function BadgeQr({ value }: { value: string }) {
  return (
    <QRCodeSVG
      value={value || 'PREVIEW'}
      level="M"
      marginSize={4}
      size={256}
      style={{ width: '100%', height: '100%' }}
    />
  )
}

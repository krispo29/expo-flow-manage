'use client'
import { createRoot } from 'react-dom/client'
import { LayoutBadgeCard } from '@/components/print/layout-badge-card'
import {
  badgeLayoutSchema,
  renderDataSchema,
  type BadgeLayout,
  type BadgeRenderData,
} from './schema'

export function reserveLayoutPrintWindow() {
  const popup = window.open('', '_blank', 'popup=yes,width=1100,height=900')
  if (!popup) throw new Error('Allow popups to print badges.')
  popup.document.title = 'Preparing badge print'
  popup.document.body.textContent = 'Preparing badge print…'
  return popup
}

export function renderLayoutPrintWindow(
  popup: Window,
  layout: BadgeLayout,
  badges: BadgeRenderData[]
): Promise<void> {
  badgeLayoutSchema.parse(layout)
  badges.forEach((badge) => renderDataSchema.parse(badge))
  if (!badges.length || popup.closed)
    return Promise.reject(new Error('Print window is unavailable.'))
  popup.document.body.replaceChildren()
  const style = popup.document.createElement('style')
  style.textContent =
    '@page{size:' +
    layout.paper.widthMm +
    'mm ' +
    layout.paper.heightMm +
    'mm;margin:0}html,body{margin:0;padding:0}*{box-sizing:border-box}[data-badge-page]:last-child{break-after:auto!important}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'
  popup.document.head.append(style)
  const mount = popup.document.createElement('div')
  popup.document.body.append(mount)
  const root = createRoot(mount)
  return new Promise((resolve, reject) => {
    const ready = new Set<number>()
    let settled = false
    const timeout = window.setTimeout(() => {
      if (!settled) {
        settled = true
        root.unmount()
        popup.close()
        reject(new Error('Badge rendering timed out.'))
      }
    }, 15000)
    const cleanup = () => {
      window.clearTimeout(timeout)
      window.setTimeout(() => root.unmount(), 0)
    }
    popup.addEventListener(
      'afterprint',
      () => {
        cleanup()
        popup.close()
      },
      { once: true }
    )
    popup.addEventListener(
      'beforeunload',
      () => {
        cleanup()
        if (!settled) {
          settled = true
          reject(new Error('Print window closed.'))
        }
      },
      { once: true }
    )
    root.render(
      <>
        {badges.map((data, index) => (
          <LayoutBadgeCard
            key={index}
            data={data}
            layout={layout}
            onReady={() => {
              ready.add(index)
              if (ready.size === badges.length && !settled) {
                settled = true
                window.clearTimeout(timeout)
                popup.focus()
                popup.print()
                resolve()
              }
            }}
          />
        ))}
      </>
    )
  })
}

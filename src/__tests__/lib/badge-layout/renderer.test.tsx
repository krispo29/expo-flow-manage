import { render, waitFor } from '@testing-library/react'
import { LayoutBadgeCard } from '@/components/print/layout-badge-card'
import { getStarterLayout } from '@/lib/badge-layout/templates'
import { sampleBadge } from '@/lib/badge-layout/samples'

it('prints fields and inline QR without ever rendering reference artwork', async () => {
  const layout = getStarterLayout('PH')
  layout.referenceBackgroundUrl = 'https://example.com/reference-only.png'
  const ready = jest.fn()
  const { container } = render(
    <LayoutBadgeCard layout={layout} data={sampleBadge} onReady={ready} />
  )
  await waitFor(() => expect(ready).toHaveBeenCalled())
  expect(container.innerHTML).not.toContain('reference-only.png')
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('svg')).not.toBeNull()
  expect(container.querySelector('[data-badge-page]')).toHaveStyle({
    width: '105mm',
    height: '130mm',
  })
})

it('translates the inner content, preserves the page size, and hides disabled fields', async () => {
  const layout = getStarterLayout('PH')
  layout.fields.company.visible = false
  const ready = jest.fn()
  const { container } = render(
    <LayoutBadgeCard
      layout={layout}
      data={sampleBadge}
      calibration={{ offsetXMm: -2, offsetYMm: 3 }}
      onReady={ready}
    />
  )
  await waitFor(() => expect(ready).toHaveBeenCalled())
  const page = container.querySelector<HTMLElement>('[data-badge-page]')!
  expect(page.style.transform).toBe('')
  expect(page.firstElementChild).toHaveStyle({
    transform: 'translate(-2mm,3mm)',
  })
  expect(container.querySelector('[data-layout-field="company"]')).toBeNull()
})

it('applies vertical text alignment inside the selected field frame', async () => {
  const layout = getStarterLayout('PH')
  layout.fields.badgeType.verticalAlign = 'center'
  const ready = jest.fn()
  const { container } = render(
    <LayoutBadgeCard layout={layout} data={sampleBadge} onReady={ready} />
  )
  await waitFor(() => expect(ready).toHaveBeenCalled())
  expect(container.querySelector('[data-layout-field="badgeType"]')).toHaveStyle({
    justifyContent: 'center',
  })
})

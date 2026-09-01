import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  isThailabBadgeProject,
  calculateFitFontSizePt,
  ThailabBadgeCard,
  ThailabBadgePrintStyles,
} from '@/components/print/thailab-badge-card'
import { BadgePrint } from '@/components/badge-print'
import type { PrintBadgeData } from '@/utils/print-badge'

const sampleBadge: PrintBadgeData = {
  firstName: 'Tidarat',
  lastName: 'Karnmitree',
  position: 'Marketing Manager',
  companyName: 'Jupiter Innovations',
  country: 'Thailand',
  registrationCode: 'V1187684977',
  badgeType: 'VISITOR',
}

describe('THAILAB badge template selection', () => {
  it.each(['THAILAB2026', 'thailab2026', '07626a19-001d-4675-addd-3a92e3f46d47'])('selects %s', (projectCode) => {
    expect(isThailabBadgeProject(projectCode)).toBe(true)
  })

  it.each([undefined, '', 'THAILAB2025', 'THAILAB2026-TEST', 'ILDEXPH2026', 'INDO2026'])(
    'rejects %s',
    (projectCode) => {
      expect(isThailabBadgeProject(projectCode)).toBe(false)
    }
  )
})

describe('THAILAB badge content', () => {
  it.each(['TW', 'Taiwan', 'Taiwan Province of China'])('renders %s as Taiwan', (country) => {
    const markup = renderToStaticMarkup(
      createElement(ThailabBadgeCard, { badge: { ...sampleBadge, country } })
    )

    expect(markup).toContain('class="thailab-badge-country"')
    expect(markup).toContain('>Taiwan<')
  })

  it('preserves non-Taiwan country text', () => {
    const markup = renderToStaticMarkup(createElement(ThailabBadgeCard, { badge: sampleBadge }))

    expect(markup).toContain('class="thailab-badge-country"')
    expect(markup).toContain('>Thailand<')
  })

  it('renders Position between name and company', () => {
    const markup = renderToStaticMarkup(createElement(ThailabBadgeCard, { badge: sampleBadge }))

    expect(markup).toContain('class="thailab-badge-position"')
    expect(markup).toContain('>Marketing Manager<')
    expect(markup.indexOf('thailab-badge-name')).toBeLessThan(markup.indexOf('thailab-badge-position'))
    expect(markup.indexOf('thailab-badge-position')).toBeLessThan(markup.indexOf('thailab-badge-company'))
  })

  it('uses the approved fixed print geometry and styles', () => {
    const styles = renderToStaticMarkup(createElement(ThailabBadgePrintStyles))
    const markup = renderToStaticMarkup(createElement(ThailabBadgeCard, { badge: sampleBadge }))

    expect(styles).toContain('.thailab-badge-header-spacer')
    expect(styles).toContain('flex: 0 0 4.9cm')
    expect(styles).toContain('height: 6.75cm; flex: 0 0 6.75cm')
    expect(styles).toContain('.thailab-badge-footer-spacer')
    expect(styles).toContain('flex: 0 0 1.35cm')
    expect(styles).toContain('.thailab-badge-info { display: grid; width: 100%; height: 2.7cm')
    expect(styles).toContain('.thailab-badge-position { height: 0.42cm; font-size: 13pt')
    expect(styles).toContain('.thailab-badge-qr { display: flex; width: 2.2cm; height: 2.2cm')
    expect(styles).toContain('.thailab-badge-type { width: 100%; margin-top: auto; font-size: 26pt')
    expect(markup).toContain('class="thailab-badge-registration-code"')
    expect(markup).toContain('V1187684977')
  })
})

describe('BadgePrint integration', () => {
  it('renders THAILAB badge layout when projectCode is THAILAB2026', () => {
    const participant = {
      registration_uuid: 'reg-1',
      first_name: 'John',
      last_name: 'Doe',
      company_name: 'Acme Corp',
      job_position: 'Engineer',
      residence_country: 'TW',
      registration_code: 'CODE123',
      attendee_type_code: 'EXHIBITOR',
    }

    const { container } = render(
      <BadgePrint participant={participant} projectCode="THAILAB2026" />
    )

    expect(container.querySelector('.thailab-badge-container')).toBeInTheDocument()
    expect(container.querySelector('.thailab-badge-header-spacer')).toBeInTheDocument()
    expect(container.querySelector('.thailab-badge-name')).toHaveTextContent('John Doe')
    expect(container.querySelector('.thailab-badge-country')).toHaveTextContent('Taiwan')
  })

  it('renders default badge layout when projectCode is not THAILAB2026', () => {
    const participant = {
      registration_uuid: 'reg-2',
      first_name: 'Jane',
      last_name: 'Smith',
      company_name: 'Beta LLC',
      job_position: 'Manager',
      residence_country: 'US',
      registration_code: 'CODE456',
      attendee_type_code: 'VISITOR',
    }

    const { container } = render(
      <BadgePrint participant={participant} projectCode="OTHER2026" />
    )

    expect(container.querySelector('.badge-print-container')).toBeInTheDocument()
    expect(container.querySelector('.thailab-badge-container')).not.toBeInTheDocument()
  })
})

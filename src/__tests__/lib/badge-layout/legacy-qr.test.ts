import { printBadges } from '@/utils/print-badge'

it.each(['PH', 'THAILAB2026'])(
  'generates local inline QR for legacy %s without external image requests',
  (projectCode) => {
    const write = jest.fn()
    const popup = { document: { write, close: jest.fn() } } as unknown as Window
    printBadges(
      [
        {
          firstName: '<Alex>',
          lastName: 'Example',
          country: 'TH',
          companyName: 'Example',
          registrationCode: 'REG-123',
        },
      ],
      projectCode,
      popup
    )
    const html = write.mock.calls[0][0] as string
    expect(html).toContain('<svg')
    expect(html).not.toContain('api.qrserver.com')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;Alex&gt;')
  }
)

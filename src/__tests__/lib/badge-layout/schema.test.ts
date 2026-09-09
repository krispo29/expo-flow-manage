import cases from '../../../../contracts/badge-layout/v1/cases.json'
import { badgeLayoutSchema } from '@/lib/badge-layout/schema'
describe('badge layout contract', () => {
  test.each(cases)('$name', ({ layout, valid }) => {
    expect(badgeLayoutSchema.safeParse(layout).success).toBe(valid)
  })
  it('rejects non-finite values and numeric strings', () => {
    for (const value of [NaN, Infinity, '400']) {
      const layout = JSON.parse(JSON.stringify(cases[0].layout))
      layout.fields.fullName.fontWeight = value
      expect(badgeLayoutSchema.safeParse(layout).success).toBe(false)
    }
  })
})

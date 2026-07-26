import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(
  join(process.cwd(), 'src/app/api/export/[type]/route.ts'),
  'utf8'
)

describe('organizer exhibitor export route', () => {
  it('keeps the organizer export isolated from report and Admin exports', () => {
    const organizerCase = source.slice(
      source.indexOf("case 'organizer-exhibitors':"),
      source.indexOf("case 'participants':")
    )

    expect(organizerCase).toContain("if (!isOrganizer)")
    expect(organizerCase).toContain(
      "endpoint = '/v1/organizer/exhibitors/export-excel'"
    )
    expect(source).toContain("if (type !== 'organizer-exhibitors')")
    expect(source).toContain(
      "endpoint = '/v1/admin/project/exhibitors/export-excel-exhibitor'"
    )
  })
})

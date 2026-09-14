import defaultLayout from '../../../contracts/badge-layout/v1/default.json'
import ildexLayout from '../../../contracts/badge-layout/v1/ildex.json'
import thailabLayout from '../../../contracts/badge-layout/v1/thailab.json'
import { badgeLayoutSchema, type BadgeLayout } from './schema'

export function getStarterLayout(projectCode: string): BadgeLayout {
  const code = projectCode.trim().toUpperCase()
  const starter =
    code === 'THAILAB2026'
      ? thailabLayout
      : ['ILDEXPH2026', 'INDO2026'].includes(code)
        ? ildexLayout
        : defaultLayout
  return badgeLayoutSchema.parse(starter)
}

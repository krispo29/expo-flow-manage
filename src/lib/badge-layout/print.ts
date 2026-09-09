'use client'

import { getBadgeLayout } from '@/app/actions/badge-layout'
import { getStoredProjects } from '@/lib/auth-storage'
import { toast } from 'sonner'
import { getAttendeeTypeLabel } from '@/lib/attendee-types'
import {
  findCountryByCodeOrName,
  getCountryDisplayName,
  getCountryNameFromValue,
} from '@/lib/countries'
import {
  printBadges as printLegacyBadges,
  type PrintBadgeData,
} from '@/utils/print-badge'
import { renderLayoutPrintWindow } from './print-window'
import type { BadgeLayoutState } from './schema'

export function normalizeBadge(badge: PrintBadgeData, projectCode: string) {
  const country = findCountryByCodeOrName(badge.country)
  return {
    fullName: [badge.firstName, badge.lastName].filter(Boolean).join(' '),
    position: badge.position || '',
    company: badge.companyName,
    country: country
      ? getCountryDisplayName(country, projectCode)
      : getCountryNameFromValue(badge.country, ''),
    registrationCode: badge.registrationCode,
    badgeType: (
      getAttendeeTypeLabel(badge.badgeType || badge.category) || 'VISITOR'
    ).toUpperCase(),
  }
}

export async function printProjectBadges(
  projectUuid: string,
  badges: PrintBadgeData[],
  popup: Window,
  onResolved?: (state: BadgeLayoutState | null) => void
) {
  try {
    const result = await getBadgeLayout(projectUuid)
    if (!result.success) {
      if ([401, 403].includes(result.status ?? 0)) throw new Error(result.error)
      const project = getStoredProjects().find(
        (project) => project.project_uuid === projectUuid
      )
      if (!project?.project_code)
        throw new Error(
          'Cannot verify project layout. Reload your project and retry.'
        )
      toast.warning(
        'Badge configuration unavailable. Using the legacy layout for this print job.'
      )
      onResolved?.(null)
      popup.document.open()
      printLegacyBadges(badges, project.project_code, popup)
      return
    }
    const { published, projectCode } = result.state
    onResolved?.(result.state)
    if (!published) {
      popup.document.open()
      printLegacyBadges(badges, projectCode, popup)
      return
    }
    await renderLayoutPrintWindow(
      popup,
      published,
      badges.map((badge) => normalizeBadge(badge, projectCode))
    )
  } catch (error) {
    popup.close()
    throw error
  }
}

import type { BadgeLayoutState } from './schema'

/** The layout snapshot sent with a print request so the audit log is reproducible. */
export type PrintLayoutMetadata = {
  layout_revision: number
  layout_source: 'api' | 'cache' | 'legacy'
  layout_offset_x_mm: number
  layout_offset_y_mm: number
}

export function toPrintLayoutMetadata(
  state: BadgeLayoutState
): PrintLayoutMetadata {
  return {
    layout_revision: state.published ? state.publishedRevision : 0,
    layout_source: state.published ? 'api' : 'legacy',
    layout_offset_x_mm: 0,
    layout_offset_y_mm: 0,
  }
}

export function legacyPrintLayoutMetadata(): PrintLayoutMetadata {
  return {
    layout_revision: 0,
    layout_source: 'legacy',
    layout_offset_x_mm: 0,
    layout_offset_y_mm: 0,
  }
}

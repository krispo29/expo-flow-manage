import { z } from 'zod'
import { badgeLayoutSchema, type BadgeLayout } from './schema'

const CHECKPOINT_VERSION = 1
const HISTORY_LIMIT = 50
const checkpointSchema = z.object({
  version: z.literal(CHECKPOINT_VERSION),
  baseDraftRevision: z.number().int().positive(),
  savedAt: z.string().datetime(),
  layout: badgeLayoutSchema,
})

export type EditorCheckpoint = z.infer<typeof checkpointSchema>
const acceptanceSchema = z.object({
  version: z.literal(CHECKPOINT_VERSION),
  draftRevision: z.number().int().positive(),
  fingerprint: z.string().min(1),
  testedAt: z.string().datetime(),
  paper: z.object({ widthMm: z.number(), heightMm: z.number() }),
})
export type LocalAcceptance = z.infer<typeof acceptanceSchema>

export function fingerprintLayout(layout: BadgeLayout) {
  return JSON.stringify(layout)
}

function copy(layout: BadgeLayout) {
  return badgeLayoutSchema.parse(JSON.parse(JSON.stringify(layout)))
}

export function createLayoutHistory(initial: BadgeLayout) {
  let entries = [copy(initial)]
  let index = 0
  return {
    current: () => copy(entries[index]),
    canUndo: () => index > 0,
    canRedo: () => index < entries.length - 1,
    push(next: BadgeLayout) {
      const parsed = badgeLayoutSchema.safeParse(next)
      if (!parsed.success) return false
      const candidate = copy(parsed.data)
      if (fingerprintLayout(candidate) === fingerprintLayout(entries[index]))
        return
      entries = [...entries.slice(0, index + 1), candidate].slice(
        -HISTORY_LIMIT
      )
      index = entries.length - 1
      return true
    },
    undo() {
      if (index > 0) index -= 1
      return copy(entries[index])
    },
    redo() {
      if (index < entries.length - 1) index += 1
      return copy(entries[index])
    },
    reset(next: BadgeLayout) {
      entries = [copy(next)]
      index = 0
    },
    size: () => entries.length,
  }
}

export function checkpointKey(projectUuid: string) {
  return `badge-layout.draft.v1.${projectUuid}`
}

export function readCheckpoint(projectUuid: string): EditorCheckpoint | null {
  try {
    return checkpointSchema.parse(
      JSON.parse(
        window.localStorage.getItem(checkpointKey(projectUuid)) || 'null'
      )
    )
  } catch {
    return null
  }
}

export function saveCheckpoint(
  projectUuid: string,
  baseDraftRevision: number,
  layout: BadgeLayout
) {
  if (baseDraftRevision <= 0) return false
  try {
    const value: EditorCheckpoint = {
      version: CHECKPOINT_VERSION,
      baseDraftRevision,
      savedAt: new Date().toISOString(),
      layout: copy(layout),
    }
    window.localStorage.setItem(
      checkpointKey(projectUuid),
      JSON.stringify(value)
    )
    return true
  } catch {
    return false
  }
}

export function clearCheckpoint(projectUuid: string) {
  try {
    window.localStorage.removeItem(checkpointKey(projectUuid))
  } catch {
    /* browser storage is optional */
  }
}

function acceptanceKey(projectUuid: string) {
  return `badge-layout.acceptance.v1.${projectUuid}`
}
export function saveLocalAcceptance(
  projectUuid: string,
  layout: BadgeLayout,
  draftRevision: number
) {
  if (draftRevision <= 0) return false
  try {
    const record: LocalAcceptance = {
      version: CHECKPOINT_VERSION,
      draftRevision,
      fingerprint: fingerprintLayout(layout),
      testedAt: new Date().toISOString(),
      paper: layout.paper,
    }
    window.localStorage.setItem(
      acceptanceKey(projectUuid),
      JSON.stringify(record)
    )
    return true
  } catch {
    return false
  }
}
export function readLocalAcceptance(
  projectUuid: string
): LocalAcceptance | null {
  try {
    return acceptanceSchema.parse(
      JSON.parse(
        window.localStorage.getItem(acceptanceKey(projectUuid)) || 'null'
      )
    )
  } catch {
    return null
  }
}

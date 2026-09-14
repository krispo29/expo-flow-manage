import {
  checkpointKey,
  clearCheckpoint,
  createLayoutHistory,
  readCheckpoint,
  readLocalAcceptance,
  saveCheckpoint,
  saveLocalAcceptance,
} from '@/lib/badge-layout/editor-draft'
import { getStarterLayout } from '@/lib/badge-layout/templates'

const layout = getStarterLayout('PH')
const at = (index: number) => ({
  ...layout,
  referenceBackgroundUrl: `https://example.com/${index}.png`,
  fields: { ...layout.fields, fullName: { ...layout.fields.fullName, xMm: 4 } },
})
beforeEach(() => window.localStorage.clear())

it('keeps immutable bounded undo history and clears redo after an edit', () => {
  const history = createLayoutHistory(layout)
  for (let x = 1; x <= 55; x++) history.push(at(x))
  expect(history.size()).toBe(50)
  expect(history.undo().referenceBackgroundUrl).toBe(
    'https://example.com/54.png'
  )
  history.push(at(9))
  expect(history.canRedo()).toBe(false)
  const current = history.current()
  current.fields.fullName.xMm = 99
  expect(history.current().referenceBackgroundUrl).toBe(
    'https://example.com/9.png'
  )
})

it('validates project-scoped checkpoints and clears them safely', () => {
  expect(saveCheckpoint('one', 3, at(4))).toBe(true)
  expect(readCheckpoint('one')).toMatchObject({
    baseDraftRevision: 3,
    layout: { fields: { fullName: { xMm: 4 } } },
  })
  expect(readCheckpoint('two')).toBeNull()
  clearCheckpoint('one')
  expect(readCheckpoint('one')).toBeNull()
})

it('rejects revision zero, malformed values and invalid layouts', () => {
  expect(saveCheckpoint('one', 0, layout)).toBe(false)
  window.localStorage.setItem(checkpointKey('one'), '{bad')
  expect(readCheckpoint('one')).toBeNull()
  window.localStorage.setItem(
    checkpointKey('one'),
    JSON.stringify({
      version: 1,
      baseDraftRevision: 1,
      savedAt: new Date().toISOString(),
      layout: { ...layout, paper: { widthMm: -1, heightMm: 1 } },
    })
  )
  expect(readCheckpoint('one')).toBeNull()
})

it('records only local test evidence for a saved revision', () => {
  expect(saveLocalAcceptance('one', layout, 3)).toBe(true)
  expect(readLocalAcceptance('one')).toMatchObject({
    draftRevision: 3,
    paper: layout.paper,
  })
  expect(saveLocalAcceptance('one', layout, 0)).toBe(false)
})

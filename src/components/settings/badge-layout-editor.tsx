'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Undo2,
  Redo2,
  Save,
  Printer,
  Send,
  Eye,
  EyeOff,
  Type,
  QrCode,
  AlertTriangle,
  Layers,
  SlidersHorizontal,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignEndVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Ruler,
  ShieldAlert,
  Users,
  History,
  Clock,
  User,
  ChevronDown,
  Copy,
  FileUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  searchParticipantsForBadgePreview,
  type BadgePreviewParticipant,
} from '@/app/actions/participant'
import {
  getBadgeLayout,
  getBadgeLayoutRevision,
  getBadgeLayoutRevisions,
  copyBadgeLayoutDraft,
  publishBadgeLayout,
  rollbackBadgeLayout,
  saveBadgeLayoutDraft,
  uploadBadgeReference,
} from '@/app/actions/badge-layout'
import { getProjects, type Project } from '@/app/actions/project'
import { LayoutBadgeCard } from '@/components/print/layout-badge-card'
import { ReadinessPopover } from './badge-layout/readiness-popover'
import { CanvasRulers } from './badge-layout/canvas-rulers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  badgeLayoutSchema,
  fieldKeys,
  type BadgeFieldKey,
  type BadgeLayout,
  type BadgeLayoutState,
  type BadgeRenderData,
  type RevisionSummary,
} from '@/lib/badge-layout/schema'
import { getStarterLayout } from '@/lib/badge-layout/templates'
import {
  sampleBadge,
  samplePersonas,
  type SamplePersonaKey,
} from '@/lib/badge-layout/samples'
import { participantToBadgeRenderData } from '@/lib/badge-layout/participant-preview'
import {
  moveField,
  resizeField,
  snapField,
  overlappingFields,
  type ResizeHandle,
} from '@/lib/badge-layout/geometry'
import {
  renderLayoutPrintWindow,
  reserveLayoutPrintWindow,
} from '@/lib/badge-layout/print-window'
import {
  clearCheckpoint,
  createLayoutHistory,
  fingerprintLayout,
  readCheckpoint,
  saveLocalAcceptance,
  saveCheckpoint,
} from '@/lib/badge-layout/editor-draft'

const control =
  'rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-40'
const labels: Record<BadgeFieldKey, string> = {
  fullName: 'Full name',
  position: 'Position',
  company: 'Company',
  country: 'Country',
  qrCode: 'QR code',
  registrationCode: 'Registration code',
  badgeType: 'Badge type',
}
const pixelsPerMm = 96 / 25.4
const TEST_VALID_FOR_MS = 24 * 60 * 60 * 1000
const emptyBadgePreview: BadgeRenderData = {
  fullName: '',
  position: '',
  company: '',
  country: '',
  registrationCode: '',
  badgeType: '',
}
type TestToken = {
  draftRevision: number
  fingerprint: string
  testedAt: number
}
type PendingConfirmation = {
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  showPublishNote?: boolean
}
type PreviewMode = 'sample' | 'attendee'
type CopyProjectOption = Pick<
  Project,
  'project_uuid' | 'project_code' | 'project_name'
>

const RESIZE_HANDLES: {
  handle: ResizeHandle
  nameSuffix: string
  cursor: string
  getPosition: (f: {
    xMm: number
    yMm: number
    widthMm: number
    heightMm: number
  }) => { left: string; top: string }
}[] = [
  {
    handle: 'nw',
    nameSuffix: ' nw',
    cursor: 'nwse-resize',
    getPosition: (f) => ({ left: `${f.xMm}mm`, top: `${f.yMm}mm` }),
  },
  {
    handle: 'n',
    nameSuffix: ' n',
    cursor: 'ns-resize',
    getPosition: (f) => ({
      left: `${f.xMm + f.widthMm / 2}mm`,
      top: `${f.yMm}mm`,
    }),
  },
  {
    handle: 'ne',
    nameSuffix: ' ne',
    cursor: 'nesw-resize',
    getPosition: (f) => ({ left: `${f.xMm + f.widthMm}mm`, top: `${f.yMm}mm` }),
  },
  {
    handle: 'e',
    nameSuffix: ' e',
    cursor: 'ew-resize',
    getPosition: (f) => ({
      left: `${f.xMm + f.widthMm}mm`,
      top: `${f.yMm + f.heightMm / 2}mm`,
    }),
  },
  {
    handle: 'se',
    nameSuffix: ' se',
    cursor: 'nwse-resize',
    getPosition: (f) => ({
      left: `${f.xMm + f.widthMm}mm`,
      top: `${f.yMm + f.heightMm}mm`,
    }),
  },
  {
    handle: 's',
    nameSuffix: ' s',
    cursor: 'ns-resize',
    getPosition: (f) => ({
      left: `${f.xMm + f.widthMm / 2}mm`,
      top: `${f.yMm + f.heightMm}mm`,
    }),
  },
  {
    handle: 'sw',
    nameSuffix: ' sw',
    cursor: 'nesw-resize',
    getPosition: (f) => ({
      left: `${f.xMm}mm`,
      top: `${f.yMm + f.heightMm}mm`,
    }),
  },
  {
    handle: 'w',
    nameSuffix: ' w',
    cursor: 'ew-resize',
    getPosition: (f) => ({
      left: `${f.xMm}mm`,
      top: `${f.yMm + f.heightMm / 2}mm`,
    }),
  },
]

function formatValidationIssue(
  issue: { path: PropertyKey[]; message: string },
  layout: BadgeLayout
): { target: string; message: string; fieldKey?: BadgeFieldKey } {
  const [first, second, third] = issue.path

  // 1. Paper setup issues
  if (first === 'paper') {
    const isWidth = second === 'widthMm'
    const target = isWidth ? 'Paper width' : 'Paper height'
    const currentVal = isWidth ? layout.paper.widthMm : layout.paper.heightMm
    if (issue.message.includes('expected number to be >=')) {
      return {
        target,
        message: `Must be at least 20 mm (currently ${currentVal} mm)`,
      }
    }
    if (issue.message.includes('expected number to be <=')) {
      return {
        target,
        message: `Must not exceed 500 mm (currently ${currentVal} mm)`,
      }
    }
    return { target, message: issue.message }
  }

  // 2. Field geometry & settings
  if (first === 'fields' && typeof second === 'string') {
    const fieldKey = second as BadgeFieldKey
    const fieldLabel = labels[fieldKey] || second
    if (issue.message === 'Field extends past paper') {
      const isWidth = third === 'widthMm'
      return {
        target: fieldLabel,
        message: `Field extends past paper (${isWidth ? 'exceeds right edge' : 'exceeds bottom edge'})`,
        fieldKey,
      }
    }
    if (issue.message.includes('QR must be square')) {
      return {
        target: 'QR code',
        message: 'Must be square and at least 15×15 mm',
        fieldKey: 'qrCode',
      }
    }
    if (issue.message.includes('Minimum font')) {
      return {
        target: fieldLabel,
        message: 'Minimum font size cannot be larger than text size',
        fieldKey,
      }
    }
    return { target: fieldLabel, message: issue.message, fieldKey }
  }

  // 3. Reference artwork image URL
  if (first === 'referenceBackgroundUrl') {
    return {
      target: 'Reference artwork',
      message: 'Must be a valid HTTPS image URL (e.g. https://…)',
    }
  }

  return {
    target: issue.path.join('.'),
    message: issue.message,
  }
}

function formatPublisher(
  actor?: { id: string; displayName: string } | null
): string {
  if (!actor?.displayName) return 'Administrator'
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      actor.displayName.trim()
    )
  if (isUuid) return 'Administrator'
  return actor.displayName
}

function formatRevisionDate(isoString?: string | null): string {
  if (!isoString) return 'Unknown date'
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  } catch {
    return isoString
  }
}

export function BadgeLayoutEditor({ projectUuid }: { projectUuid: string }) {
  const [state, setState] = useState<BadgeLayoutState | null>(null)
  const [layout, setLayout] = useState<BadgeLayout | null>(null)
  const [selected, setSelected] = useState<BadgeFieldKey | null>('fullName')
  const [cursorMm, setCursorMm] = useState<{ x?: number; y?: number } | null>(
    null
  )
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [conflict, setConflict] = useState(false)
  const [history, setHistory] = useState<RevisionSummary[]>([])
  const [persona, setPersona] = useState<SamplePersonaKey>('standard')
  const [previewMode, setPreviewMode] = useState<PreviewMode>('sample')
  const [attendeeQuery, setAttendeeQuery] = useState('')
  const [attendeeResults, setAttendeeResults] = useState<
    BadgePreviewParticipant[]
  >([])
  const [selectedAttendee, setSelectedAttendee] =
    useState<BadgePreviewParticipant | null>(null)
  const [attendeeSearchState, setAttendeeSearchState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [attendeeSearchError, setAttendeeSearchError] = useState('')
  const [showRulers, setShowRulers] = useState(true)
  const [showLanyardGuide, setShowLanyardGuide] = useState(false)
  const [showMarginGuide, setShowMarginGuide] = useState(false)
  const [previewTarget, setPreviewTarget] = useState<
    'draft' | 'published' | 'revision'
  >('draft')
  const [historicalRevision, setHistoricalRevision] = useState<{
    revision: number
    layout: BadgeLayout
  } | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{
    x: number
    y: number
    panX: number
    panY: number
  }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  })
  const viewportRef = useRef<HTMLDivElement>(null)
  const [tested, setTested] = useState<TestToken | null>(null)
  const [zoom, setZoom] = useState(1)
  const [clippedFields, setClippedFields] = useState<string[]>([])
  const [referenceOpacity, setReferenceOpacity] = useState(0.35)
  const [activeTooltip, setActiveTooltip] = useState<{
    xMm: number
    yMm: number
    widthMm: number
    heightMm: number
  } | null>(null)
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation | null>(null)
  const [publishNote, setPublishNote] = useState('')
  const publishNoteRef = useRef('')
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [copyProjects, setCopyProjects] = useState<CopyProjectOption[]>([])
  const [copyProjectsLoading, setCopyProjectsLoading] = useState(false)
  const [copyProjectsError, setCopyProjectsError] = useState('')
  const [copyTargetUuid, setCopyTargetUuid] = useState('')
  const [copyTargetState, setCopyTargetState] =
    useState<BadgeLayoutState | null>(null)
  const [copyTargetLoading, setCopyTargetLoading] = useState(false)
  const [copyTargetError, setCopyTargetError] = useState('')
  const preview = useRef<HTMLDivElement>(null)
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({})
  const layoutHistory = useRef<ReturnType<typeof createLayoutHistory> | null>(
    null
  )
  const stateRef = useRef<BadgeLayoutState | null>(null)
  const layoutRef = useRef<BadgeLayout | null>(null)
  const testedRef = useRef<TestToken | null>(null)
  const testPrintInFlight = useRef(false)
  const attendeeSearchRequestRef = useRef(0)
  const copyTargetRequestRef = useRef(0)
  const navigationBypassRef = useRef(false)
  const referenceUploadInputRef = useRef<HTMLInputElement>(null)
  const conflictRef = useRef(false)
  const selectedRef = useRef<BadgeFieldKey | null>(selected)
  const drag = useRef<{
    key: BadgeFieldKey
    x: number
    y: number
    initial: BadgeLayout
    last?: BadgeLayout
    resize?: boolean
    handle?: ResizeHandle
    pixelsPerMm: number
  } | null>(null)
  const load = useCallback(async () => {
    setBusy(true)
    try {
      const result = await getBadgeLayout(projectUuid)
      if (!result.success) {
        setMessage(result.error)
        return
      }
      const loadedLayout =
        result.state.draft ??
        result.state.published ??
        getStarterLayout(result.state.projectCode)
      const checkpoint = readCheckpoint(projectUuid)
      const canRestore =
        checkpoint?.baseDraftRevision === result.state.draftRevision
      if (checkpoint && !canRestore) {
        clearCheckpoint(projectUuid)
      }
      stateRef.current = result.state
      layoutRef.current = loadedLayout
      layoutHistory.current = createLayoutHistory(loadedLayout)
      setState(result.state)
      setLayout(loadedLayout)
      setConflict(false)
      setTested(null)
      if (checkpoint && canRestore) {
        requestConfirmation({
          title: 'Restore unsaved changes?',
          description:
            'This browser has a newer local draft for this project. Restore it or keep the saved draft from the server.',
          confirmLabel: 'Restore draft',
          onConfirm: () => {
            if (
              stateRef.current?.draftRevision !== checkpoint.baseDraftRevision
            ) {
              clearCheckpoint(projectUuid)
              setMessage(
                'The local recovery is no longer compatible with the current server draft.'
              )
              return
            }
            layoutHistory.current = createLayoutHistory(checkpoint.layout)
            layoutRef.current = checkpoint.layout
            setLayout(checkpoint.layout)
            setTested(null)
          },
          onCancel: () => clearCheckpoint(projectUuid),
        })
      }
      setMessage(
        checkpoint && !canRestore
          ? 'A stale local recovery was ignored because the server draft changed.'
          : ''
      )
      const revisions = await getBadgeLayoutRevisions(projectUuid)
      if (revisions.success) setHistory(revisions.revisions)
    } catch {
      setMessage('Unable to contact the server. Please retry.')
    } finally {
      setBusy(false)
    }
  }, [projectUuid])
  useEffect(() => {
    void load()
  }, [load])
  useEffect(() => {
    setPreviewMode('sample')
    setAttendeeQuery('')
    setAttendeeResults([])
    setSelectedAttendee(null)
    setAttendeeSearchState('idle')
    setAttendeeSearchError('')
    attendeeSearchRequestRef.current += 1
  }, [projectUuid])
  async function searchForAttendees() {
    const query = attendeeQuery.trim()
    if (query.length < 2) {
      setAttendeeResults([])
      setSelectedAttendee(null)
      setAttendeeSearchState('error')
      setAttendeeSearchError('Enter at least 2 characters to search attendees.')
      return
    }
    const requestId = ++attendeeSearchRequestRef.current
    setAttendeeSearchState('loading')
    setAttendeeSearchError('')
    setSelectedAttendee(null)
    const result = await searchParticipantsForBadgePreview(projectUuid, query)
    if (requestId !== attendeeSearchRequestRef.current) return
    if (!result.success) {
      setAttendeeResults([])
      setAttendeeSearchState('error')
      setAttendeeSearchError(result.error)
      return
    }
    setAttendeeResults(result.data)
    setAttendeeSearchState('success')
  }
  stateRef.current = state
  layoutRef.current = layout
  testedRef.current = tested
  conflictRef.current = conflict
  selectedRef.current = selected

  const draftJson = useMemo(
    () => (state?.draft ? JSON.stringify(state.draft) : null),
    [state?.draft]
  )
  const dirty = useMemo(() => {
    if (!layout) return false
    if (!draftJson) return true
    return JSON.stringify(layout) !== draftJson
  }, [layout, draftJson])

  const applyLayout = useCallback((next: BadgeLayout, remember = true) => {
    if (remember) layoutHistory.current?.push(next)
    layoutRef.current = next
    setLayout(next)
    setClippedFields([])
    testedRef.current = null
    setTested(null)
  }, [])
  const canPublish =
    !!tested &&
    tested.draftRevision === state?.draftRevision &&
    tested.fingerprint === (layout ? fingerprintLayout(layout) : '') &&
    Date.now() - tested.testedAt < TEST_VALID_FOR_MS
  useEffect(() => {
    if (!layout || !state || !dirty) return
    const timer = window.setTimeout(() => {
      saveCheckpoint(projectUuid, state.draftRevision, layout)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [dirty, layout, projectUuid, state])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'BUTTON' ||
          target.tagName === 'SUMMARY' ||
          target.isContentEditable)
      ) {
        return
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setIsSpacePressed(true)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
        setIsPanning(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        const delta = -e.deltaY * 0.0015
        setZoom((prev) =>
          Math.min(3, Math.max(0.25, Math.round((prev + delta) * 100) / 100))
        )
      } else {
        // Two-finger trackpad panning or mouse wheel scroll
        setPan((prev) => ({
          x: Math.round(prev.x - e.deltaX),
          y: Math.round(prev.y - e.deltaY),
        }))
      }
    }
    vp.addEventListener('wheel', handleWheel, { passive: false })
    return () => vp.removeEventListener('wheel', handleWheel)
  }, [Boolean(layout)])

  const editable =
    !busy && !conflict && previewTarget === 'draft' && !pendingConfirmation
  const canManagePublishedRevision = !busy && !conflict && !pendingConfirmation
  const previewData = useMemo(
    () =>
      previewMode === 'attendee'
        ? selectedAttendee
          ? participantToBadgeRenderData(
              selectedAttendee,
              state?.projectCode ?? ''
            )
          : emptyBadgePreview
        : (samplePersonas[persona]?.data ?? sampleBadge),
    [previewMode, selectedAttendee, state?.projectCode, persona]
  )
  const handlePreviewReady = useCallback(() => {
    const nextClippedFields = Array.from(
      preview.current?.querySelectorAll<HTMLElement>(
        '[data-text-field][data-overflow="true"]'
      ) ?? []
    ).map((element) => labels[element.dataset.textField as BadgeFieldKey])
    setClippedFields((current) => {
      if (
        current.length === nextClippedFields.length &&
        current.every((value, index) => value === nextClippedFields[index])
      )
        return current
      return nextClippedFields
    })
  }, [])
  const save = useCallback(async () => {
    const curLayout = layoutRef.current
    const curState = stateRef.current
    if (!curLayout || !curState) return
    setBusy(true)
    try {
      const result = await saveBadgeLayoutDraft(
        projectUuid,
        curState.draftRevision,
        curLayout
      )
      if (result.success) {
        setState(result.state)
        clearCheckpoint(projectUuid)
        layoutHistory.current?.reset(result.state.draft ?? curLayout)
        setMessage('Draft saved. Live printing is unchanged.')
      } else {
        setMessage(result.error)
        setConflict(!!result.conflict)
      }
    } catch {
      setMessage(
        'Unable to save. Your local changes are still here; please retry.'
      )
    } finally {
      setBusy(false)
    }
  }, [projectUuid])

  useEffect(() => {
    const isEditing = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
    const shortcuts = (event: KeyboardEvent) => {
      if (!editable) return

      // Ctrl+S / Cmd+S: Save draft immediately
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        const cur = layoutRef.current
        if (cur && dirty && badgeLayoutSchema.safeParse(cur).success) {
          void save()
        }
        return
      }

      // Esc: blur active element and clear selection (works even while focused in inputs)
      if (event.key === 'Escape') {
        if (event.target instanceof HTMLElement) {
          event.target.blur()
        }
        setSelected(null)
        return
      }

      if (isEditing(event.target)) return

      // Ctrl+Z / Ctrl+Shift+Z: Undo / Redo
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        const history = layoutHistory.current
        if (!history) return
        applyLayout(event.shiftKey ? history.redo() : history.undo(), false)
        return
      }

      // Delete / Backspace: Hide selected field
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const curLayout = layoutRef.current
        const curSelected = selectedRef.current
        if (
          curLayout &&
          curSelected &&
          curLayout.fields[curSelected]?.visible
        ) {
          event.preventDefault()
          applyLayout({
            ...curLayout,
            fields: {
              ...curLayout.fields,
              [curSelected]: {
                ...curLayout.fields[curSelected],
                visible: false,
              },
            },
          })
          return
        }
      }
    }
    window.addEventListener('keydown', shortcuts)
    return () => window.removeEventListener('keydown', shortcuts)
  }, [applyLayout, editable, dirty, save])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty && !navigationBypassRef.current) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    const confirmNavigation = (event: MouseEvent) => {
      if (navigationBypassRef.current) return
      if (
        !dirty ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const link =
        event.target instanceof Element ? event.target.closest('a[href]') : null
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target === '_blank' ||
        link.href === window.location.href
      )
        return
      event.preventDefault()
      event.stopPropagation()
      setPendingConfirmation({
        title: 'Leave page?',
        description: 'Leave this page and discard unsaved badge layout changes?',
        confirmLabel: 'Leave page',
        onConfirm: () => {
          navigationBypassRef.current = true
          link.click()
        },
      })
    }
    document.addEventListener('click', confirmNavigation, true)
    return () => {
      window.removeEventListener('beforeunload', warn)
      document.removeEventListener('click', confirmNavigation, true)
    }
  }, [dirty])

  const requestConfirmation = (confirmation: PendingConfirmation) =>
    setPendingConfirmation(confirmation)
  const dismissConfirmation = () => {
    const confirmation = pendingConfirmation
    setPendingConfirmation(null)
    setPublishNote('')
    publishNoteRef.current = ''
    confirmation?.onCancel?.()
  }
  const confirmationDialog = pendingConfirmation && (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) dismissConfirmation()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pendingConfirmation.title}</DialogTitle>
          <DialogDescription>
            {pendingConfirmation.description}
          </DialogDescription>
        </DialogHeader>
        {pendingConfirmation.showPublishNote && (
          <div className="space-y-2">
            <label htmlFor="publish-note" className="text-sm font-medium">
              Publish note{' '}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <Textarea
              id="publish-note"
              value={publishNote}
              maxLength={500}
              rows={3}
              allowThai
              placeholder="Describe what changed or why this version is being published"
              onChange={(event) => {
                const next = event.target.value.slice(0, 500)
                setPublishNote(next)
                publishNoteRef.current = next
              }}
            />
            <div className="text-muted-foreground text-right text-[11px]">
              {publishNote.length}/500
            </div>
          </div>
        )}
        <DialogFooter>
          <button className={control} onClick={dismissConfirmation}>
            Cancel
          </button>
          <button
            className={
              control +
              (pendingConfirmation.destructive
                ? ' bg-destructive text-destructive-foreground'
                : ' bg-primary text-primary-foreground hover:bg-primary/90')
            }
            onClick={async () => {
              const confirmation = pendingConfirmation
              setPendingConfirmation(null)
              const operation = confirmation.onConfirm()
              setPublishNote('')
              publishNoteRef.current = ''
              await operation
            }}
          >
            {pendingConfirmation.confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
  const copyDialog = (
    <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy layout to another project</DialogTitle>
          <DialogDescription>
            Copy the current layout as a draft. The destination&apos;s published
            layout will not change until an administrator publishes it there.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {copyProjectsLoading && (
            <p role="status" className="text-muted-foreground text-sm">
              Loading destination projects…
            </p>
          )}
          {copyProjectsError && (
            <p role="alert" className="text-destructive text-sm">
              {copyProjectsError}
            </p>
          )}
          {!copyProjectsLoading && !copyProjectsError && (
            <>
              <label
                htmlFor="copy-layout-target"
                className="text-foreground block space-y-1.5 text-sm font-medium"
              >
                Destination project
                <select
                  id="copy-layout-target"
                  className={control + ' text-foreground w-full'}
                  value={copyTargetUuid}
                  disabled={!copyProjects.length || copyTargetLoading}
                  onChange={(event) =>
                    void selectCopyTarget(event.target.value)
                  }
                >
                  <option value="">
                    {copyProjects.length
                      ? 'Choose a project…'
                      : 'No other projects available'}
                  </option>
                  {copyProjects.map((project) => (
                    <option
                      key={project.project_uuid}
                      value={project.project_uuid}
                    >
                      {project.project_name} ({project.project_code})
                    </option>
                  ))}
                </select>
              </label>
              {copyTargetLoading && (
                <p role="status" className="text-muted-foreground text-xs">
                  Loading the destination draft…
                </p>
              )}
              {copyTargetError && (
                <p role="alert" className="text-destructive text-xs">
                  {copyTargetError}
                </p>
              )}
              {copyTargetState && !copyTargetLoading && (
                <div className="bg-muted/40 rounded-lg border p-3 text-xs">
                  <p className="font-medium">
                    Current draft revision: {copyTargetState.draftRevision}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Published revision:{' '}
                    {copyTargetState.publishedRevision ||
                      'none (legacy fallback)'}
                    . Only the draft will be replaced.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <button
            type="button"
            className={control}
            onClick={() => setCopyDialogOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={control + ' bg-primary text-primary-foreground'}
            disabled={
              !copyTargetState || copyTargetLoading || copyProjectsLoading
            }
            onClick={reviewCopy}
          >
            Review copy
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (!layout || !state)
    return (
      <>
        {confirmationDialog}
        <div className="p-8" role="status">
          {message || 'Loading badge layout…'}
          <button className={control} onClick={() => void load()}>
            Retry
          </button>
        </div>
      </>
    )
  async function previewRevision(revision: number) {
    setBusy(true)
    setMessage('')
    try {
      const result = await getBadgeLayoutRevision(projectUuid, revision)
      if (!result.success) {
        setMessage(result.error)
        return
      }
      setHistoricalRevision({
        revision: result.revision.publishedRevision,
        layout: result.revision.published,
      })
      setPreviewTarget('revision')
    } finally {
      setBusy(false)
    }
  }
  const validation = badgeLayoutSchema.safeParse(layout)
  const displayedLayout =
    previewTarget === 'published' && state.published
      ? state.published
      : previewTarget === 'revision' && historicalRevision
        ? historicalRevision.layout
        : layout
  const field = selected ? displayedLayout.fields[selected] : null
  const overlaps = overlappingFields(displayedLayout)

  async function openCopyDialog() {
    if (!editable || !layout || !badgeLayoutSchema.safeParse(layout).success)
      return
    copyTargetRequestRef.current += 1
    setCopyDialogOpen(true)
    setCopyProjectsLoading(true)
    setCopyProjectsError('')
    setCopyTargetUuid('')
    setCopyTargetState(null)
    setCopyTargetError('')
    try {
      const result = await getProjects()
      if (!result.success) {
        setCopyProjects([])
        setCopyProjectsError(
          result.error || 'Unable to load destination projects.'
        )
        return
      }
      setCopyProjects(
        result.projects
          .filter((project) => project.project_uuid !== projectUuid)
          .map(({ project_uuid, project_code, project_name }) => ({
            project_uuid,
            project_code,
            project_name,
          }))
      )
    } catch {
      setCopyProjects([])
      setCopyProjectsError('Unable to load destination projects.')
    } finally {
      setCopyProjectsLoading(false)
    }
  }

  async function selectCopyTarget(targetUuid: string) {
    const requestId = ++copyTargetRequestRef.current
    setCopyTargetUuid(targetUuid)
    setCopyTargetState(null)
    setCopyTargetError('')
    if (!targetUuid) {
      setCopyTargetLoading(false)
      return
    }
    setCopyTargetLoading(true)
    try {
      const result = await getBadgeLayout(targetUuid)
      if (requestId !== copyTargetRequestRef.current) return
      if (!result.success) {
        setCopyTargetError(result.error)
        return
      }
      setCopyTargetState(result.state)
    } catch {
      if (requestId === copyTargetRequestRef.current)
        setCopyTargetError('Unable to load the destination draft.')
    } finally {
      if (requestId === copyTargetRequestRef.current)
        setCopyTargetLoading(false)
    }
  }

  async function copyToProject(
    target: CopyProjectOption,
    expectedTargetDraftRevision: number,
    sourceFingerprint: string
  ) {
    const sourceLayout = layoutRef.current
    if (
      !sourceLayout ||
      fingerprintLayout(sourceLayout) !== sourceFingerprint ||
      !badgeLayoutSchema.safeParse(sourceLayout).success
    ) {
      setMessage('The source layout changed. Review the copy again.')
      return
    }

    setBusy(true)
    try {
      const latest = await getBadgeLayout(target.project_uuid)
      if (!latest.success) {
        setMessage(`Unable to verify ${target.project_name}'s latest draft.`)
        return
      }
      if (latest.state.draftRevision !== expectedTargetDraftRevision) {
        setMessage(
          `${target.project_name} changed while you were reviewing. Load it again before copying.`
        )
        return
      }
      const result = await copyBadgeLayoutDraft(
        projectUuid,
        target.project_uuid,
        expectedTargetDraftRevision,
        sourceLayout
      )
      if (!result.success) {
        setMessage(result.error)
        return
      }
      setMessage(
        `Layout copied to ${target.project_name}. It is saved as draft revision ${result.state.draftRevision}; publish it from that project when ready.`
      )
    } catch {
      setMessage(
        `Unable to copy layout to ${target.project_name}. Please retry.`
      )
    } finally {
      setBusy(false)
    }
  }

  function reviewCopy() {
    const target = copyProjects.find(
      (project) => project.project_uuid === copyTargetUuid
    )
    const sourceLayout = layoutRef.current
    if (!target || !copyTargetState || !sourceLayout) {
      setCopyTargetError(
        'Choose a destination project and wait for its draft to load.'
      )
      return
    }
    const sourceFingerprint = fingerprintLayout(sourceLayout)
    setCopyDialogOpen(false)
    requestConfirmation({
      title: `Copy layout to ${target.project_name}?`,
      description: `This replaces that project's current draft with this layout. Its published layout and print jobs stay unchanged until an administrator publishes the new draft.`,
      confirmLabel: 'Copy draft',
      destructive: true,
      onConfirm: () =>
        copyToProject(target, copyTargetState.draftRevision, sourceFingerprint),
    })
  }

  const updateField = (
    patch: Partial<BadgeLayout['fields'][BadgeFieldKey]>
  ) => {
    if (!selected) return
    applyLayout({
      ...layout,
      fields: {
        ...layout.fields,
        [selected]: {
          ...layout.fields[selected],
          ...patch,
        } as BadgeLayout['fields'][BadgeFieldKey],
      },
    })
  }

  async function publish(
    expectedDraftRevision: number,
    expectedPublishedRevision: number,
    expectedFingerprint: string,
    publishNoteValue = ''
  ) {
    const currentState = stateRef.current
    const currentLayout = layoutRef.current
    const currentTest = testedRef.current
    if (
      !currentState ||
      !currentLayout ||
      !currentTest ||
      currentState.draftRevision !== expectedDraftRevision ||
      currentState.publishedRevision !== expectedPublishedRevision ||
      currentTest.draftRevision !== expectedDraftRevision ||
      currentTest.fingerprint !== expectedFingerprint ||
      fingerprintLayout(currentLayout) !== expectedFingerprint ||
      Date.now() - currentTest.testedAt >= TEST_VALID_FOR_MS
    ) {
      setMessage('This confirmation is no longer current. Test print again.')
      return
    }
    setBusy(true)
    try {
      const result = publishNoteValue.trim()
        ? await publishBadgeLayout(
            projectUuid,
            expectedDraftRevision,
            expectedPublishedRevision,
            publishNoteValue
          )
        : await publishBadgeLayout(
            projectUuid,
            expectedDraftRevision,
            expectedPublishedRevision
          )
      if (result.success) {
        setState(result.state)
        clearCheckpoint(projectUuid)
        const revisions = await getBadgeLayoutRevisions(projectUuid)
        if (revisions.success) setHistory(revisions.revisions)
        setMessage('Layout published. New print jobs will use this revision.')
      } else {
        setMessage(result.error)
        setConflict(!!result.conflict)
      }
    } catch {
      setMessage(
        'Unable to confirm publication. Reload the latest state before retrying.'
      )
      setConflict(true)
    } finally {
      setBusy(false)
    }
  }
  async function testPrint() {
    if (
      !layout ||
      !state ||
      !editable ||
      pendingConfirmation ||
      testPrintInFlight.current ||
      !validation.success
    )
      return
    if (previewMode === 'attendee' && !selectedAttendee) {
      setMessage('Select an attendee before starting a real-data test print.')
      return
    }
    testPrintInFlight.current = true
    testedRef.current = null
    setTested(null)
    setBusy(true)
    let popup: Window | undefined
    try {
      popup = reserveLayoutPrintWindow()
      let testedState = state
      if (dirty) {
        const saved = await saveBadgeLayoutDraft(
          projectUuid,
          state.draftRevision,
          layout
        )
        if (!saved.success) {
          popup.close()
          setMessage(saved.error)
          setConflict(!!saved.conflict)
          return
        }
        testedState = saved.state
        stateRef.current = saved.state
        setState(saved.state)
        clearCheckpoint(projectUuid)
      }
      await renderLayoutPrintWindow(popup, layout, [previewData])
      const testedAt = Date.now()
      const testedFingerprint = fingerprintLayout(layout)
      requestConfirmation({
        title: 'Did the test badge print correctly?',
        description:
          'Check the physical badge against the preprinted artwork. Confirm only when the position, size, text and QR code are correct.',
        confirmLabel: 'Confirm print is correct',
        onConfirm: () => {
          const currentState = stateRef.current
          const currentLayout = layoutRef.current
          if (
            !currentState ||
            !currentLayout ||
            currentState.draftRevision !== testedState.draftRevision ||
            fingerprintLayout(currentLayout) !== testedFingerprint
          ) {
            setMessage('This test print is no longer current. Print again.')
            return
          }
          const token = {
            draftRevision: testedState.draftRevision,
            fingerprint: testedFingerprint,
            testedAt,
          }
          testedRef.current = token
          setTested(token)
          saveLocalAcceptance(
            projectUuid,
            currentLayout,
            currentState.draftRevision
          )
          setMessage('Test print confirmed. The layout is ready to publish.')
        },
        onCancel: () =>
          setMessage(
            'Test print not confirmed. Check the badge before publishing.'
          ),
      })
    } catch (error) {
      popup?.close()
      setMessage(error instanceof Error ? error.message : 'Print failed')
    } finally {
      testPrintInFlight.current = false
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      {confirmationDialog}
      {copyDialog}
      <header className="bg-card flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">
              Badge layout · {state.projectCode}
            </h1>
            <ReadinessPopover
              validationSuccess={validation.success}
              canPublish={canPublish}
              dirty={dirty}
              draftRevision={state.draftRevision}
              publishedRevision={state.publishedRevision}
              onTestPrint={() => void testPrint()}
              disabled={!editable}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {state.publishedRevision > 0 && state.published ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 shadow-2xs dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                title={`Active onsite print layout: Revision ${state.publishedRevision}, published ${formatRevisionDate(state.publishedAt)} by ${formatPublisher(state.publishedBy)} (${state.published.paper.widthMm}×${state.published.paper.heightMm} mm)`}
              >
                <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                <span>
                  Live on printers: Revision {state.publishedRevision}
                </span>
                <span className="text-emerald-700/60 dark:text-emerald-400/60">
                  ·
                </span>
                <span className="font-mono text-[11px] opacity-85">
                  {state.published.paper.widthMm}×
                  {state.published.paper.heightMm} mm
                </span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 shadow-2xs dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                title="No custom layout has been published yet. Onsite badge print stations use default starter fallback."
              >
                <span className="size-1.5 rounded-full bg-amber-500" />
                <span>Live: Default fallback (Unpublished)</span>
              </span>
            )}
            <span className="text-muted-foreground text-xs">
              · Draft revision {state.draftRevision}
              {state.published &&
                (JSON.stringify(layout) === JSON.stringify(state.published)
                  ? ' (in sync with live)'
                  : ' (unpublished changes)')}{' '}
              · Published {state.publishedRevision || 'none (legacy fallback)'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 px-3 text-xs tracking-normal normal-case"
            disabled={!editable || !layoutHistory.current?.canUndo()}
            onClick={() => applyLayout(layoutHistory.current!.undo(), false)}
            aria-label="Undo"
            title={
              layoutHistory.current?.canUndo()
                ? 'Undo (Ctrl+Z)'
                : 'No earlier actions to undo'
            }
          >
            <Undo2 className="size-3.5" />
            <span>Undo</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 px-3 text-xs tracking-normal normal-case"
            disabled={!editable || !layoutHistory.current?.canRedo()}
            onClick={() => applyLayout(layoutHistory.current!.redo(), false)}
            aria-label="Redo"
            title={
              layoutHistory.current?.canRedo()
                ? 'Redo (Ctrl+Shift+Z)'
                : 'No actions to redo'
            }
          >
            <Redo2 className="size-3.5" />
            <span>Redo</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 px-3 text-xs tracking-normal normal-case"
            disabled={!editable || !dirty || !validation.success}
            onClick={() => void save()}
            aria-label="Save draft"
            title={dirty ? 'Save draft (Ctrl+S)' : 'No unsaved changes to save'}
          >
            <Save className="size-3.5" />
            <span>Save draft</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 px-3 text-xs tracking-normal normal-case"
            disabled={!editable || !validation.success || busy}
            onClick={() => void openCopyDialog()}
            aria-label="Copy layout to another project"
            title="Copy this layout as a draft in another project"
          >
            <Copy className="size-3.5" />
            <span>Copy to project</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 px-3 text-xs tracking-normal normal-case"
            disabled={
              !editable ||
              !validation.success ||
              (previewMode === 'attendee' && !selectedAttendee)
            }
            onClick={() => void testPrint()}
            aria-label="Test print"
            title={
              previewMode === 'attendee' && !selectedAttendee
                ? 'Select an attendee before test printing'
                : 'Open 1:1 test print window with the selected preview data'
            }
          >
            <Printer className="size-3.5" />
            <span>Test print</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-primary text-primary-foreground h-9 gap-1.5 px-3.5 text-xs font-semibold tracking-normal normal-case shadow-sm"
            disabled={!editable || !validation.success || !canPublish}
            onClick={() => {
              setPublishNote('')
              publishNoteRef.current = ''
              requestConfirmation({
                title: 'Publish layout?',
                description:
                  'New print jobs for every badge type in this project will use this tested layout.',
                confirmLabel: 'Publish layout',
                showPublishNote: true,
                onConfirm: () =>
                  publish(
                    state.draftRevision,
                    state.publishedRevision,
                    fingerprintLayout(layout),
                    publishNoteRef.current
                  ),
              })
            }}
            aria-label="Publish"
            title={
              !validation.success
                ? 'Cannot publish: badge geometry or fields are invalid'
                : !canPublish
                  ? 'Test print required: you must complete a test print of this exact layout before publishing'
                  : 'Publish tested layout to live check-in printers'
            }
          >
            <Send className="size-3.5" />
            <span>Publish</span>
          </Button>
        </div>
      </header>
      <p className="text-muted-foreground text-xs">
        Artwork is a reference only and will never be printed. Use actual size
        (100%), zero margins, and disable browser headers/footers.
      </p>
      {message && (
        <div role="status" className="rounded border p-3">
          {message}
          {conflict && (
            <button
              className={control + ' ml-3'}
              onClick={() => {
                requestConfirmation({
                  title: 'Discard local edits?',
                  description:
                    'Your unsaved changes will be replaced by the latest server draft.',
                  confirmLabel: 'Reload latest',
                  destructive: true,
                  onConfirm: () => {
                    if (!conflictRef.current) {
                      setMessage('This confirmation is no longer current.')
                      return
                    }
                    void load()
                  },
                })
              }}
            >
              Reload latest
            </button>
          )}
        </div>
      )}
      {!validation.success && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border p-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-destructive mt-0.5 size-5 shrink-0" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-destructive text-sm font-semibold tracking-tight">
                  Layout configuration issues ({validation.error.issues.length})
                </h3>
                <span className="text-muted-foreground text-[11px] font-normal">
                  Draft cannot be published until resolved
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                The following items exceed paper boundaries or violate print
                layout rules:
              </p>
              <ul className="mt-2.5 grid gap-1.5 text-xs sm:grid-cols-2">
                {validation.error.issues.map((issue, i) => {
                  const { target, message, fieldKey } = formatValidationIssue(
                    issue,
                    layout
                  )
                  return (
                    <li
                      key={i}
                      onClick={() => {
                        if (fieldKey) setSelected(fieldKey)
                      }}
                      className={`border-destructive/20 bg-background/80 flex items-baseline gap-1.5 rounded-lg border px-3 py-1.5 transition-colors ${
                        fieldKey
                          ? 'hover:border-destructive/50 hover:bg-destructive/10 cursor-pointer'
                          : ''
                      }`}
                      title={
                        fieldKey ? `Click to inspect ${target}` : undefined
                      }
                    >
                      <span className="text-destructive shrink-0 font-semibold">
                        {target}:
                      </span>
                      <span
                        className="text-foreground/90 truncate"
                        title={message}
                      >
                        {message}
                      </span>
                    </li>
                  )
                })}
              </ul>
              {validation.error.issues.some((i) => i.path[0] === 'paper') && (
                <p className="text-destructive/90 pt-1 text-[11px] font-medium">
                  💡 Hint: Paper dimension is currently set below minimum (20
                  mm). Increase paper size in &quot;Paper & presets&quot; to
                  resolve boundary overflow.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        <aside className="bg-card space-y-4 rounded-xl border p-4 shadow-xs">
          <div className="space-y-3 border-b pb-3">
            <div className="text-foreground flex items-center gap-2">
              <SlidersHorizontal className="text-muted-foreground size-4" />
              <h2 className="text-sm font-semibold">Paper & presets</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['widthMm', 'heightMm'] as const).map((key) => (
                <NumberControl
                  key={key}
                  label={
                    key === 'widthMm' ? 'Paper width (mm)' : 'Paper height (mm)'
                  }
                  unit="mm"
                  value={layout.paper[key]}
                  disabled={!editable}
                  onChange={(value) =>
                    applyLayout({
                      ...layout,
                      paper: { ...layout.paper, [key]: value },
                    })
                  }
                />
              ))}
            </div>
            <label className="text-muted-foreground block space-y-1 text-xs font-medium">
              <span>Starter template</span>
              <select
                className={control + ' text-foreground w-full'}
                value=""
                disabled={!editable}
                onChange={(event) => {
                  const starter = event.target.value
                  if (!dirty) {
                    applyLayout(getStarterLayout(starter))
                    return
                  }
                  requestConfirmation({
                    title: 'Replace this layout?',
                    description:
                      'This replaces the paper, reference artwork, and every field in your local draft.',
                    confirmLabel: 'Replace layout',
                    destructive: true,
                    onConfirm: () => applyLayout(getStarterLayout(starter)),
                  })
                }}
              >
                <option value="" disabled>
                  Choose starter…
                </option>
                <option value="DEFAULT">Default</option>
                <option value="ILDEXPH2026">ILDEX PH / INDO</option>
                <option value="THAILAB2026">THAILAB</option>
              </select>
            </label>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-foreground flex items-center gap-2">
                <Layers className="text-muted-foreground size-4" />
                <h2 className="text-sm font-semibold">
                  Fields ({fieldKeys.length})
                </h2>
              </div>
            </div>
            <div className="space-y-1">
              {fieldKeys.map((key) => {
                const f = displayedLayout.fields[key]
                const isSelected = selected === key
                const isClipped = clippedFields.includes(labels[key])
                const isOutOfBounds =
                  f.visible &&
                  (f.xMm < 0 ||
                    f.yMm < 0 ||
                    f.xMm + f.widthMm > displayedLayout.paper.widthMm ||
                    f.yMm + f.heightMm > displayedLayout.paper.heightMm)
                const warningMessage = isOutOfBounds
                  ? 'Field extends past paper'
                  : isClipped
                    ? 'Text clipped'
                    : null
                return (
                  <div
                    key={key}
                    className={`group flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-foreground font-medium shadow-2xs'
                        : 'border-border/60 hover:border-border hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <button
                      type="button"
                      className="mr-1 flex flex-1 items-center gap-2 truncate text-left"
                      onClick={() => setSelected(key)}
                      aria-label={`${labels[key]}${!f.visible ? ' (hidden)' : ''}`}
                    >
                      {f.kind === 'qr' ? (
                        <QrCode className="text-muted-foreground size-3.5 shrink-0" />
                      ) : (
                        <Type className="text-muted-foreground size-3.5 shrink-0" />
                      )}
                      <span className="truncate">{labels[key]}</span>
                      {!f.visible && (
                        <span className="text-muted-foreground text-[10px]">
                          (hidden)
                        </span>
                      )}
                      {warningMessage && (
                        <span
                          title={warningMessage}
                          className="inline-flex shrink-0 items-center"
                        >
                          <AlertTriangle
                            className="size-3 text-amber-600"
                            aria-label={warningMessage}
                          />
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label={`Toggle visibility for ${labels[key]}`}
                      disabled={!editable}
                      className="hover:bg-background text-muted-foreground hover:text-foreground rounded p-1 transition-colors disabled:opacity-40"
                      onClick={(e) => {
                        e.stopPropagation()
                        applyLayout({
                          ...layout,
                          fields: {
                            ...layout.fields,
                            [key]: { ...f, visible: !f.visible },
                          },
                        })
                      }}
                    >
                      {f.visible ? (
                        <Eye className="text-foreground size-3.5" />
                      ) : (
                        <EyeOff className="size-3.5 opacity-40" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
        <main className="min-w-0 space-y-3">
          <div className="bg-card/60 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-2.5 text-xs">
            {/* View Mode Switcher: Draft vs Live */}
            <div className="bg-muted/40 flex items-center rounded-lg border p-0.5">
              <button
                type="button"
                onClick={() => {
                  setHistoricalRevision(null)
                  setPreviewTarget('draft')
                }}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  previewTarget === 'draft'
                    ? 'bg-background text-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={previewTarget === 'draft'}
              >
                <span>Draft Editor</span>
                {state.published &&
                  JSON.stringify(layout) !==
                    JSON.stringify(state.published) && (
                    <span
                      className="size-1.5 rounded-full bg-amber-500"
                      title="Draft has unpublished changes"
                    />
                  )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setHistoricalRevision(null)
                  setPreviewTarget('published')
                }}
                disabled={!state.published}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  previewTarget === 'published'
                    ? 'bg-emerald-600 font-semibold text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground disabled:opacity-40'
                }`}
                aria-pressed={previewTarget === 'published'}
                title={
                  state.published
                    ? `Preview currently active live layout (Revision ${state.publishedRevision})`
                    : 'No published layout yet'
                }
              >
                <span
                  className={`size-1.5 rounded-full ${
                    previewTarget === 'published'
                      ? 'bg-white'
                      : 'bg-emerald-500'
                  }`}
                />
                <span>
                  Live View
                  {state.publishedRevision > 0
                    ? ` (r${state.publishedRevision})`
                    : ''}
                </span>
              </button>
              {previewTarget === 'revision' && historicalRevision && (
                <span className="bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                  History preview (r{historicalRevision.revision})
                </span>
              )}
            </div>

            {/* Preview data selector */}
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="preview-data-mode"
                className="text-muted-foreground flex items-center gap-1.5 font-medium"
              >
                <Users className="size-3.5" />
                <span>Preview data:</span>
              </label>
              <select
                id="preview-data-mode"
                aria-label="Preview data mode"
                value={previewMode}
                onChange={(event) => {
                  const nextMode = event.target.value as PreviewMode
                  setPreviewMode(nextMode)
                  if (nextMode === 'sample') {
                    setAttendeeResults([])
                    setSelectedAttendee(null)
                    setAttendeeSearchState('idle')
                    setAttendeeSearchError('')
                    attendeeSearchRequestRef.current += 1
                  }
                }}
                className="bg-background focus:ring-primary h-8 rounded-md border px-2.5 text-xs font-medium focus:ring-1 focus:outline-hidden"
              >
                <option value="sample">Sample data</option>
                <option value="attendee">Real attendee</option>
              </select>
              {previewMode === 'sample' && (
                <select
                  id="persona-switcher"
                  aria-label="Preview attendee persona"
                  value={persona}
                  onChange={(event) => {
                    setPersona(event.target.value as SamplePersonaKey)
                  }}
                  className="bg-background focus:ring-primary h-8 rounded-md border px-2.5 text-xs font-medium focus:ring-1 focus:outline-hidden"
                >
                  <option value="standard">
                    Standard Attendee (Alex Mercer)
                  </option>
                  <option value="thai">Thai Complex Script (ดร. กฤษฎา)</option>
                  <option value="executive">
                    Multi-line Executive (Prof. Montgomery)
                  </option>
                  <option value="vip">VIP / Exhibitor (Sarah Chen)</option>
                </select>
              )}
              {previewMode === 'attendee' && (
                <div className="flex flex-wrap items-center gap-2">
                  <form
                    className="flex items-center gap-1.5"
                    onSubmit={(event) => {
                      event.preventDefault()
                      void searchForAttendees()
                    }}
                  >
                    <input
                      aria-label="Search attendees"
                      value={attendeeQuery}
                      onChange={(event) => setAttendeeQuery(event.target.value)}
                      placeholder="Name, company or registration code"
                      className="bg-background focus:ring-primary h-8 w-56 rounded-md border px-2.5 text-xs outline-none focus:ring-1"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs"
                      aria-busy={attendeeSearchState === 'loading'}
                    >
                      {attendeeSearchState === 'loading'
                        ? 'Searching…'
                        : 'Search'}
                    </Button>
                  </form>
                  {selectedAttendee && (
                    <span className="text-muted-foreground text-xs">
                      Selected:{' '}
                      <strong>
                        {selectedAttendee.first_name}{' '}
                        {selectedAttendee.last_name}
                      </strong>
                    </span>
                  )}
                  {!selectedAttendee && (
                    <span className="text-muted-foreground text-xs">
                      Search and select an attendee to preview real data.
                    </span>
                  )}
                </div>
              )}
            </div>
            {previewMode === 'attendee' && attendeeSearchState === 'error' && (
              <p role="alert" className="text-destructive text-xs">
                {attendeeSearchError}
              </p>
            )}
            {previewMode === 'attendee' &&
              attendeeSearchState === 'success' && (
                <div className="w-full">
                  {attendeeResults.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      No attendees found. Try a different name, company or
                      registration code.
                    </p>
                  ) : (
                    <div
                      className="bg-background grid max-h-32 gap-1 overflow-y-auto rounded-md border p-1 sm:grid-cols-2"
                      role="listbox"
                      aria-label="Attendee search results"
                    >
                      {attendeeResults.map((attendee) => {
                        const attendeeName = [
                          attendee.first_name,
                          attendee.last_name,
                        ]
                          .filter(Boolean)
                          .join(' ')
                        const attendeeLabel = attendeeName || 'Unnamed attendee'
                        return (
                          <button
                            key={
                              attendee.registration_uuid ||
                              attendee.registration_code
                            }
                            type="button"
                            role="option"
                            aria-selected={
                              selectedAttendee?.registration_uuid ===
                              attendee.registration_uuid
                            }
                            onClick={() => setSelectedAttendee(attendee)}
                            className="hover:bg-muted flex min-w-0 items-start justify-between gap-2 rounded px-2 py-1.5 text-left text-xs"
                          >
                            <span className="min-w-0 truncate">
                              <strong className="block truncate">
                                {attendeeLabel}
                              </strong>
                              <span className="text-muted-foreground block truncate">
                                {attendee.company_name || 'No company'}
                              </span>
                            </span>
                            <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                              {attendee.registration_code || 'No code'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

            {/* Overlays & Rulers Toggle Buttons */}
            <div className="flex items-center gap-1.5">
              <Button
                variant={showRulers ? 'secondary' : 'outline'}
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs"
                onClick={() => setShowRulers((s) => !s)}
                aria-label="Toggle rulers"
              >
                <Ruler className="size-3.5" />
                <span>Rulers</span>
              </Button>
              <Button
                variant={showLanyardGuide ? 'secondary' : 'outline'}
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs"
                onClick={() => setShowLanyardGuide((s) => !s)}
                aria-label="Toggle lanyard slot guide"
              >
                <span className="inline-block h-1 w-2.5 rounded-full border border-current" />
                <span>Lanyard slot</span>
              </Button>
              <Button
                variant={showMarginGuide ? 'secondary' : 'outline'}
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs"
                onClick={() => setShowMarginGuide((s) => !s)}
                aria-label="Toggle safety margin guide"
              >
                <ShieldAlert className="size-3.5" />
                <span>3mm margin</span>
              </Button>
            </div>
          </div>

          {/* Active Live Published Banner */}
          {previewTarget === 'published' && state.published && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <span className="size-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                <span>
                  <strong>
                    Viewing Active Published Layout (Revision{' '}
                    {state.publishedRevision})
                  </strong>{' '}
                  — This is the layout currently printed on physical badges at
                  registration desks ({state.published.paper.widthMm}×
                  {state.published.paper.heightMm} mm).
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewTarget('draft')}
                className="bg-background h-7 shrink-0 border-emerald-300 px-2.5 text-xs text-emerald-800 dark:border-emerald-700 dark:text-emerald-200"
              >
                Return to Draft Editor
              </Button>
            </div>
          )}
          {previewTarget === 'revision' && historicalRevision && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
              <div>
                <strong>
                  Viewing historical revision {historicalRevision.revision}
                </strong>{' '}
                — read-only preview. This does not change the draft or live
                layout.
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHistoricalRevision(null)
                  setPreviewTarget('draft')
                }}
                className="bg-background h-7 shrink-0 border-amber-300 px-2.5 text-xs text-amber-900 dark:border-amber-700 dark:text-amber-100"
              >
                Return to Draft Editor
              </Button>
            </div>
          )}
          <div
            ref={viewportRef}
            className="relative flex items-center justify-center overflow-auto rounded-xl border bg-slate-100/90 p-8 select-none dark:bg-slate-900/60"
            style={{
              maxHeight: '75vh',
              minHeight: '520px',
              cursor: isPanning
                ? 'grabbing'
                : isSpacePressed
                  ? 'grab'
                  : 'default',
            }}
            onPointerDown={(e) => {
              if (isSpacePressed || e.button === 1) {
                e.preventDefault()
                setIsPanning(true)
                panStartRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  panX: pan.x,
                  panY: pan.y,
                }
                e.currentTarget.setPointerCapture(e.pointerId)
              }
            }}
            onPointerMove={(e) => {
              if (isPanning) {
                const dx = e.clientX - panStartRef.current.x
                const dy = e.clientY - panStartRef.current.y
                setPan({
                  x: panStartRef.current.panX + dx,
                  y: panStartRef.current.panY + dy,
                })
              }
            }}
            onPointerUp={() => {
              if (isPanning) setIsPanning(false)
            }}
            onLostPointerCapture={() => {
              setIsPanning(false)
            }}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                transition: isPanning ? 'none' : 'transform 0.05s ease-out',
              }}
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.05s ease-out',
                }}
              >
                <CanvasRulers
                  widthMm={displayedLayout.paper.widthMm}
                  heightMm={displayedLayout.paper.heightMm}
                  selectedField={field && field.visible ? field : null}
                  cursorMm={cursorMm}
                  showRulers={showRulers}
                >
                  <div
                    ref={preview}
                    style={{
                      position: 'relative',
                      width: displayedLayout.paper.widthMm + 'mm',
                      height: displayedLayout.paper.heightMm + 'mm',
                    }}
                    onPointerMove={(e) => {
                      const rect = preview.current?.getBoundingClientRect()
                      if (rect && displayedLayout) {
                        const xMm =
                          (e.clientX - rect.left) /
                          (rect.width / displayedLayout.paper.widthMm)
                        const yMm =
                          (e.clientY - rect.top) /
                          (rect.height / displayedLayout.paper.heightMm)
                        setCursorMm({
                          x: Math.max(
                            0,
                            Math.min(
                              displayedLayout.paper.widthMm,
                              Math.round(xMm * 2) / 2
                            )
                          ),
                          y: Math.max(
                            0,
                            Math.min(
                              displayedLayout.paper.heightMm,
                              Math.round(yMm * 2) / 2
                            )
                          ),
                        })
                      }
                    }}
                    onPointerLeave={() => setCursorMm(null)}
                  >
                    <LayoutBadgeCard
                      layout={displayedLayout}
                      data={previewData}
                      onReady={handlePreviewReady}
                    />
                    {displayedLayout.referenceBackgroundUrl && (
                      <div
                        aria-hidden
                        style={{
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none',
                          backgroundImage: `url(${JSON.stringify(displayedLayout.referenceBackgroundUrl)})`,
                          backgroundSize: '100% 100%',
                          opacity: referenceOpacity,
                        }}
                      />
                    )}
                    {/* Lanyard punch slot guide */}
                    {showLanyardGuide && (
                      <div
                        aria-label="Lanyard punch slot guide"
                        className="pointer-events-none absolute z-20 flex items-center justify-center rounded-full border-2 border-dashed border-red-500/80 bg-red-500/10"
                        style={{
                          left: `${(displayedLayout.paper.widthMm - 14) / 2}mm`,
                          top: '5mm',
                          width: '14mm',
                          height: '3mm',
                        }}
                      >
                        <span className="scale-90 text-[7px] font-medium tracking-tighter text-red-600 uppercase select-none dark:text-red-400">
                          Lanyard
                        </span>
                      </div>
                    )}
                    {/* 3mm Safety Margin Guide */}
                    {showMarginGuide && (
                      <div
                        aria-label="Safety margin guide"
                        className="pointer-events-none absolute z-20 border border-dashed border-amber-500/70"
                        style={{
                          left: '3mm',
                          top: '3mm',
                          right: '3mm',
                          bottom: '3mm',
                        }}
                      >
                        <span className="absolute top-0.5 left-1 font-mono text-[7px] text-amber-600/80 uppercase select-none dark:text-amber-400/80">
                          3mm Margin
                        </span>
                      </div>
                    )}
                    {previewTarget === 'published' && (
                      <div className="pointer-events-none absolute top-2 right-2 z-20 rounded-md border border-emerald-300 bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase shadow-xs dark:bg-emerald-900/90">
                        Live r{state.publishedRevision}
                      </div>
                    )}
                    {previewTarget === 'revision' && historicalRevision && (
                      <div className="pointer-events-none absolute top-2 right-2 z-20 rounded-md border border-amber-300 bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase shadow-xs dark:bg-amber-900/90">
                        History r{historicalRevision.revision}
                      </div>
                    )}
                    {previewTarget === 'draft' && (
                      <>
                        <div
                          aria-hidden
                          style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            backgroundImage:
                              'linear-gradient(to right,#94a3b833 1px,transparent 1px),linear-gradient(to bottom,#94a3b833 1px,transparent 1px)',
                            backgroundSize: '5mm 5mm',
                          }}
                        />
                        {fieldKeys
                          .filter((key) => layout.fields[key].visible)
                          .map((key) => {
                            const frame = layout.fields[key]
                            return (
                              <button
                                key={key}
                                aria-label={`Move ${labels[key]}`}
                                disabled={!editable}
                                className="absolute touch-none"
                                style={{
                                  left: frame.xMm + 'mm',
                                  top: frame.yMm + 'mm',
                                  width: frame.widthMm + 'mm',
                                  height: frame.heightMm + 'mm',
                                  border:
                                    key === selected
                                      ? '2px solid #2563eb'
                                      : '1px dashed #94a3b8',
                                  cursor: isSpacePressed ? 'inherit' : 'move',
                                  pointerEvents: isSpacePressed
                                    ? 'none'
                                    : 'auto',
                                }}
                                onFocus={() => setSelected(key)}
                                onPointerDown={(event) => {
                                  if (isSpacePressed || event.button === 1)
                                    return
                                  setSelected(key)
                                  event.currentTarget.setPointerCapture(
                                    event.pointerId
                                  )
                                  const previewEl =
                                    preview.current ??
                                    event.currentTarget.parentElement
                                  const parentWidth =
                                    previewEl?.getBoundingClientRect().width ??
                                    0
                                  drag.current = {
                                    key,
                                    x: event.clientX,
                                    y: event.clientY,
                                    initial: layout,
                                    pixelsPerMm:
                                      parentWidth > 0
                                        ? parentWidth / layout.paper.widthMm
                                        : 3.78,
                                  }
                                }}
                                onPointerMove={(event) => {
                                  const start = drag.current
                                  if (
                                    !start ||
                                    start.key !== key ||
                                    start.resize
                                  )
                                    return
                                  const snapped = snapField(
                                    start.initial,
                                    key,
                                    (event.clientX - start.x) /
                                      start.pixelsPerMm,
                                    (event.clientY - start.y) /
                                      start.pixelsPerMm,
                                    4 / start.pixelsPerMm
                                  )
                                  setGuides(snapped.guides)
                                  const next = {
                                    ...start.initial,
                                    fields: {
                                      ...start.initial.fields,
                                      [key]: snapped.frame,
                                    },
                                  }
                                  start.last = next
                                  setClippedFields([])
                                  setLayout(next)
                                  setActiveTooltip({
                                    xMm:
                                      Math.round(snapped.frame.xMm * 10) / 10,
                                    yMm:
                                      Math.round(snapped.frame.yMm * 10) / 10,
                                    widthMm:
                                      Math.round(snapped.frame.widthMm * 10) /
                                      10,
                                    heightMm:
                                      Math.round(snapped.frame.heightMm * 10) /
                                      10,
                                  })
                                }}
                                onPointerUp={() => {
                                  setGuides({})
                                  setActiveTooltip(null)
                                  if (drag.current?.last)
                                    applyLayout(drag.current.last)
                                  drag.current = null
                                }}
                                onPointerCancel={() => {
                                  setGuides({})
                                  setActiveTooltip(null)
                                  if (drag.current)
                                    setLayout(drag.current.initial)
                                  drag.current = null
                                }}
                                onLostPointerCapture={() => {
                                  setGuides({})
                                  setActiveTooltip(null)
                                  if (drag.current?.last)
                                    applyLayout(drag.current.last)
                                  drag.current = null
                                }}
                                onKeyDown={(event) => {
                                  const steps: Record<
                                    string,
                                    [number, number]
                                  > = {
                                    ArrowLeft: [-1, 0],
                                    ArrowRight: [1, 0],
                                    ArrowUp: [0, -1],
                                    ArrowDown: [0, 1],
                                  }
                                  const step = steps[event.key]
                                  if (!step) return
                                  event.preventDefault()
                                  const distance = event.shiftKey ? 5 : 0.5
                                  updateField(
                                    moveField(
                                      frame,
                                      layout.paper,
                                      step[0] * distance,
                                      step[1] * distance
                                    )
                                  )
                                }}
                              />
                            )
                          })}
                        {guides.x !== undefined && (
                          <div
                            aria-hidden
                            style={{
                              position: 'absolute',
                              pointerEvents: 'none',
                              left: guides.x + 'mm',
                              top: 0,
                              bottom: 0,
                              borderLeft: '1px solid #f43f5e',
                            }}
                          />
                        )}
                        {guides.y !== undefined && (
                          <div
                            aria-hidden
                            style={{
                              position: 'absolute',
                              pointerEvents: 'none',
                              top: guides.y + 'mm',
                              left: 0,
                              right: 0,
                              borderTop: '1px solid #f43f5e',
                            }}
                          />
                        )}
                        {selected &&
                          field &&
                          field.visible &&
                          RESIZE_HANDLES.map(
                            ({ handle, nameSuffix, cursor, getPosition }) => {
                              const pos = getPosition(field)
                              return (
                                <button
                                  key={handle}
                                  aria-label={`Resize ${labels[selected]}${nameSuffix}`}
                                  disabled={!editable}
                                  className="absolute h-3 w-3 touch-none rounded-xs border border-white bg-blue-600 shadow-xs"
                                  style={{
                                    left: pos.left,
                                    top: pos.top,
                                    transform: 'translate(-50%,-50%)',
                                    cursor: isSpacePressed ? 'inherit' : cursor,
                                    pointerEvents: isSpacePressed
                                      ? 'none'
                                      : 'auto',
                                  }}
                                  onPointerDown={(event) => {
                                    if (isSpacePressed || event.button === 1)
                                      return
                                    event.stopPropagation()
                                    event.currentTarget.setPointerCapture(
                                      event.pointerId
                                    )
                                    const previewEl =
                                      preview.current ??
                                      event.currentTarget.parentElement
                                    const parentWidth =
                                      previewEl?.getBoundingClientRect()
                                        .width ?? 0
                                    drag.current = {
                                      key: selected,
                                      x: event.clientX,
                                      y: event.clientY,
                                      initial: layout,
                                      resize: true,
                                      handle,
                                      pixelsPerMm:
                                        parentWidth > 0
                                          ? parentWidth / layout.paper.widthMm
                                          : 3.78,
                                    }
                                  }}
                                  onPointerMove={(event) => {
                                    const start = drag.current
                                    if (!start?.resize) return
                                    const original =
                                      start.initial.fields[start.key]
                                    const resized = resizeField(
                                      original,
                                      start.initial.paper,
                                      (event.clientX - start.x) /
                                        start.pixelsPerMm,
                                      (event.clientY - start.y) /
                                        start.pixelsPerMm,
                                      original.kind === 'qr',
                                      start.handle ?? 'se'
                                    )
                                    const next = {
                                      ...start.initial,
                                      fields: {
                                        ...start.initial.fields,
                                        [start.key]: {
                                          ...original,
                                          ...resized,
                                        },
                                      },
                                    }
                                    start.last = next
                                    setLayout(next)
                                    setActiveTooltip({
                                      xMm: Math.round(resized.xMm * 10) / 10,
                                      yMm: Math.round(resized.yMm * 10) / 10,
                                      widthMm:
                                        Math.round(resized.widthMm * 10) / 10,
                                      heightMm:
                                        Math.round(resized.heightMm * 10) / 10,
                                    })
                                  }}
                                  onPointerUp={() => {
                                    setActiveTooltip(null)
                                    if (drag.current?.last)
                                      applyLayout(drag.current.last)
                                    drag.current = null
                                  }}
                                  onLostPointerCapture={() => {
                                    setActiveTooltip(null)
                                    if (drag.current?.last)
                                      applyLayout(drag.current.last)
                                    drag.current = null
                                  }}
                                  onPointerCancel={() => {
                                    setActiveTooltip(null)
                                    if (drag.current)
                                      setLayout(drag.current.initial)
                                    drag.current = null
                                  }}
                                />
                              )
                            }
                          )}
                        {activeTooltip && (
                          <div
                            role="status"
                            aria-live="polite"
                            className="pointer-events-none absolute z-30 -mt-2 -translate-y-full rounded-md bg-slate-900/90 px-2 py-1 font-mono text-[11px] whitespace-nowrap text-white shadow-md backdrop-blur-xs"
                            style={{
                              left: `${activeTooltip.xMm}mm`,
                              top: `${activeTooltip.yMm}mm`,
                            }}
                          >
                            <span>
                              X: {activeTooltip.xMm}mm · Y: {activeTooltip.yMm}
                              mm
                            </span>
                            <span className="mx-1 opacity-50">|</span>
                            <span>
                              W: {activeTooltip.widthMm}mm · H:{' '}
                              {activeTooltip.heightMm}mm
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CanvasRulers>
              </div>
            </div>

            {/* Floating Zoom & Pan Control Bar */}
            <div className="bg-background/95 absolute right-3 bottom-3 z-30 flex items-center gap-1 rounded-lg border p-1 shadow-md backdrop-blur-xs">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Zoom out"
                onClick={() =>
                  setZoom((z) =>
                    Math.max(0.25, Math.round((z - 0.1) * 10) / 10)
                  )
                }
              >
                <ZoomOut className="size-3.5" />
              </Button>
              <button
                type="button"
                aria-label="Reset zoom (100%)"
                onClick={() => {
                  setZoom(1)
                  setPan({ x: 0, y: 0 })
                }}
                className="hover:text-primary min-w-[44px] rounded px-1 py-0.5 text-center font-mono text-xs font-medium transition-colors"
              >
                {Math.round(zoom * 100)}%
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Zoom in"
                onClick={() =>
                  setZoom((z) => Math.min(3, Math.round((z + 0.1) * 10) / 10))
                }
              >
                <ZoomIn className="size-3.5" />
              </Button>
              <div className="bg-border mx-0.5 h-3.5 w-px" />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                aria-label="Fit to screen"
                onClick={() => {
                  const vp = viewportRef.current
                  let targetZoom = 0.85
                  if (
                    vp &&
                    displayedLayout &&
                    vp.clientWidth > 0 &&
                    vp.clientHeight > 0
                  ) {
                    const padding = 80
                    const availableW = Math.max(100, vp.clientWidth - padding)
                    const availableH = Math.max(100, vp.clientHeight - padding)
                    const pxPerMm = 96 / 25.4
                    const paperWPx = displayedLayout.paper.widthMm * pxPerMm
                    const paperHPx = displayedLayout.paper.heightMm * pxPerMm
                    const fitScale = Math.min(
                      availableW / paperWPx,
                      availableH / paperHPx
                    )
                    targetZoom = Math.min(
                      2,
                      Math.max(0.25, Math.round(fitScale * 100) / 100)
                    )
                  }
                  setZoom(targetZoom)
                  setPan({ x: 0, y: 0 })
                }}
              >
                <Maximize2 className="size-3" />
                <span>Fit</span>
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            Drag to move · snaps to 1 mm and alignment guides · arrow keys: 0.5
            mm · Shift + arrow: 5 mm. Long text may clip at the minimum font
            size; check your test print.
          </p>
          {overlaps.length > 0 && (
            <p className="text-sm text-amber-700" role="status">
              Overlapping fields (check the preview): {overlaps.join(', ')}
            </p>
          )}
          {clippedFields.length > 0 && (
            <p role="status" className="text-sm text-amber-700">
              Sample text is clipped in: {clippedFields.join(', ')}. Increase
              the frame or adjust typography.
            </p>
          )}
        </main>
        <aside className="bg-card space-y-4 rounded-xl border p-4 shadow-xs">
          {previewTarget === 'published' && state.published && (
            <div className="space-y-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="size-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                  <span>Live Revision {state.publishedRevision}</span>
                </div>
                <span className="rounded bg-emerald-200/60 px-1.5 py-0.5 font-mono text-[10px] text-emerald-900 dark:bg-emerald-800/60 dark:text-emerald-100">
                  Read-only
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                You are viewing the active layout live on onsite badge printers.
                To make changes, switch back to the draft editor.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="bg-background h-7 w-full border-emerald-300 text-xs text-emerald-900 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-100 dark:hover:bg-emerald-900/50"
                onClick={() => setPreviewTarget('draft')}
              >
                Return to Draft Editor
              </Button>
            </div>
          )}
          {selected && field ? (
            <>
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-sm font-semibold">{labels[selected]}</h2>
                <label className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    disabled={!editable}
                    checked={field.visible}
                    onChange={(event) =>
                      updateField({ visible: event.target.checked })
                    }
                    className="accent-primary rounded"
                  />
                  <span>Visible</span>
                </label>
              </div>

              {/* Alignment Toolbar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-xs font-semibold">
                    Alignment
                  </span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive hover:bg-muted/50 inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] whitespace-nowrap transition-colors"
                    disabled={!editable}
                    onClick={() => {
                      const selectedField = selected
                      if (!dirty) {
                        updateField(
                          getStarterLayout(state.projectCode).fields[
                            selectedField
                          ]
                        )
                        return
                      }
                      requestConfirmation({
                        title: `Reset ${labels[selectedField]}?`,
                        description:
                          'Its local position, size, visibility, and text settings will return to the starter layout.',
                        confirmLabel: 'Reset field',
                        destructive: true,
                        onConfirm: () => {
                          const currentState = stateRef.current
                          const currentLayout = layoutRef.current
                          if (!currentState || !currentLayout) {
                            setMessage(
                              'This confirmation is no longer current.'
                            )
                            return
                          }
                          applyLayout({
                            ...currentLayout,
                            fields: {
                              ...currentLayout.fields,
                              [selectedField]: getStarterLayout(
                                currentState.projectCode
                              ).fields[selectedField],
                            },
                          })
                        },
                      })
                    }}
                    aria-label="Reset field"
                    title="Reset field"
                  >
                    <RotateCcw className="inline size-3" />
                    <span>Reset field</span>
                  </button>
                </div>

                <div className="bg-muted/30 flex items-center justify-between rounded-lg border p-1">
                  <button
                    type="button"
                    disabled={!editable}
                    className="hover:bg-background text-muted-foreground hover:text-foreground rounded p-1.5 transition-colors disabled:opacity-40"
                    onClick={() => updateField({ xMm: 0 })}
                    aria-label="Align left"
                    title="Align left"
                  >
                    <AlignStartVertical className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={!editable}
                    className="hover:bg-background text-muted-foreground hover:text-foreground rounded p-1.5 transition-colors disabled:opacity-40"
                    onClick={() =>
                      updateField({
                        xMm: (layout.paper.widthMm - field.widthMm) / 2,
                      })
                    }
                    aria-label="Center horizontally"
                    title="Center horizontally"
                  >
                    <AlignCenterVertical className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={!editable}
                    className="hover:bg-background text-muted-foreground hover:text-foreground rounded p-1.5 transition-colors disabled:opacity-40"
                    onClick={() =>
                      updateField({ xMm: layout.paper.widthMm - field.widthMm })
                    }
                    aria-label="Align right"
                    title="Align right"
                  >
                    <AlignEndVertical className="size-4" />
                  </button>
                  <div className="bg-border mx-1 h-4 w-px" />
                  <button
                    type="button"
                    disabled={!editable}
                    className="hover:bg-background text-muted-foreground hover:text-foreground rounded p-1.5 transition-colors disabled:opacity-40"
                    onClick={() => updateField({ yMm: 0 })}
                    aria-label="Align top"
                    title="Align top"
                  >
                    <AlignStartHorizontal className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={!editable}
                    className="hover:bg-background text-muted-foreground hover:text-foreground rounded p-1.5 transition-colors disabled:opacity-40"
                    onClick={() =>
                      updateField({
                        yMm: (layout.paper.heightMm - field.heightMm) / 2,
                      })
                    }
                    aria-label="Center vertically"
                    title="Center vertically"
                  >
                    <AlignCenterHorizontal className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={!editable}
                    className="hover:bg-background text-muted-foreground hover:text-foreground rounded p-1.5 transition-colors disabled:opacity-40"
                    onClick={() =>
                      updateField({
                        yMm: layout.paper.heightMm - field.heightMm,
                      })
                    }
                    aria-label="Align bottom"
                    title="Align bottom"
                  >
                    <AlignEndHorizontal className="size-4" />
                  </button>
                </div>

                <button
                  type="button"
                  className="border-input bg-background text-foreground hover:bg-muted/60 flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium whitespace-nowrap shadow-2xs transition-colors"
                  disabled={!editable}
                  onClick={() =>
                    updateField({
                      xMm: (layout.paper.widthMm - field.widthMm) / 2,
                      yMm: (layout.paper.heightMm - field.heightMm) / 2,
                    })
                  }
                  aria-label="Center on paper"
                  title="Center on paper"
                >
                  <span>Center on paper</span>
                </button>
              </div>

              {/* Position & Size Grid */}
              <div className="grid grid-cols-2 gap-2">
                {(['xMm', 'yMm', 'widthMm', 'heightMm'] as const).map((key) => (
                  <NumberControl
                    key={key}
                    label={
                      {
                        xMm: 'Left (mm)',
                        yMm: 'Top (mm)',
                        widthMm: 'Width (mm)',
                        heightMm: 'Height (mm)',
                      }[key]
                    }
                    unit="mm"
                    value={field[key]}
                    disabled={!editable}
                    onChange={(value) =>
                      updateField(
                        field.kind === 'qr' &&
                          (key === 'widthMm' || key === 'heightMm')
                          ? { widthMm: value, heightMm: value }
                          : { [key]: value }
                      )
                    }
                  />
                ))}
              </div>

              {/* Text Typography Controls */}
              {field.kind === 'text' && (
                <div className="space-y-3 border-t pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {(['fontSizePt', 'minFontSizePt'] as const).map((key) => (
                      <NumberControl
                        key={key}
                        label={
                          key === 'fontSizePt'
                            ? 'Text size (pt)'
                            : 'Min size (pt)'
                        }
                        unit="pt"
                        value={field[key]}
                        disabled={!editable}
                        onChange={(value) => updateField({ [key]: value })}
                      />
                    ))}
                  </div>

                  {/* Text Alignment Segmented Control */}
                  <div className="space-y-1.5">
                    <span className="text-muted-foreground text-xs">
                      Text alignment
                    </span>
                    <div className="bg-muted/30 flex rounded-lg border p-0.5">
                      {(['left', 'center', 'right'] as const).map((align) => {
                        const isActive = field.textAlign === align
                        const Icon =
                          align === 'left'
                            ? AlignLeft
                            : align === 'center'
                              ? AlignCenter
                              : AlignRight
                        return (
                          <button
                            key={align}
                            type="button"
                            disabled={!editable}
                            aria-pressed={isActive}
                            aria-label={`Align text ${align}`}
                            className={`flex flex-1 items-center justify-center rounded-md py-1 text-xs transition-all ${
                              isActive
                                ? 'bg-background text-foreground font-semibold shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => updateField({ textAlign: align })}
                          >
                            <Icon className="size-3.5" />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Vertical Text Alignment Segmented Control */}
                  <div className="space-y-1.5">
                    <span className="text-muted-foreground text-xs">
                      Vertical text alignment
                    </span>
                    <div className="bg-muted/30 flex rounded-lg border p-0.5">
                      {(['top', 'center', 'bottom'] as const).map((align) => {
                        const isActive = field.verticalAlign === align
                        const Icon =
                          align === 'top'
                            ? AlignStartHorizontal
                            : align === 'center'
                              ? AlignCenterHorizontal
                              : AlignEndHorizontal
                        return (
                          <button
                            key={align}
                            type="button"
                            disabled={!editable}
                            aria-pressed={isActive}
                            aria-label={`Align text vertically ${align}`}
                            className={`flex flex-1 items-center justify-center rounded-md py-1 text-xs transition-all ${
                              isActive
                                ? 'bg-background text-foreground font-semibold shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() =>
                              updateField({ verticalAlign: align })
                            }
                          >
                            <Icon className="size-3.5" />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Font Weight Segmented Control */}
                  <div className="space-y-1.5">
                    <span className="text-muted-foreground text-xs">
                      Text weight
                    </span>
                    <div className="bg-muted/30 flex rounded-lg border p-0.5">
                      {[
                        {
                          weight: 400,
                          label: 'Regular',
                          aria: 'Weight Regular',
                        },
                        { weight: 700, label: 'Bold', aria: 'Weight Bold' },
                        { weight: 900, label: 'Black', aria: 'Weight Black' },
                      ].map(({ weight, label, aria }) => {
                        const isActive = field.fontWeight === weight
                        return (
                          <button
                            key={weight}
                            type="button"
                            disabled={!editable}
                            aria-pressed={isActive}
                            aria-label={aria}
                            className={`flex flex-1 items-center justify-center rounded-md py-1 text-xs transition-all ${
                              isActive
                                ? 'bg-background text-foreground font-bold shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() =>
                              updateField({
                                fontWeight: weight as 400 | 700 | 900,
                              })
                            }
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Text Transform Segmented Control */}
                  <div className="space-y-1.5">
                    <span className="text-muted-foreground text-xs">
                      Capital letters
                    </span>
                    <div className="bg-muted/30 flex rounded-lg border p-0.5">
                      {[
                        {
                          value: 'none' as const,
                          label: 'Aa (Default)',
                          aria: 'Standard case',
                        },
                        {
                          value: 'uppercase' as const,
                          label: 'AA (Caps)',
                          aria: 'Uppercase',
                        },
                      ].map(({ value, label, aria }) => {
                        const isActive = field.textTransform === value
                        return (
                          <button
                            key={value}
                            type="button"
                            disabled={!editable}
                            aria-pressed={isActive}
                            aria-label={aria}
                            className={`flex flex-1 items-center justify-center rounded-md py-1 text-xs transition-all ${
                              isActive
                                ? 'bg-background text-foreground font-semibold shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() =>
                              updateField({ textTransform: value })
                            }
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Advanced Text Settings Disclosure */}
                  <details className="space-y-2 border-t pt-2" open>
                    <summary className="text-foreground cursor-pointer text-xs font-semibold select-none">
                      Advanced text settings
                    </summary>
                    <div className="space-y-2 pt-1">
                      <label className="text-muted-foreground block space-y-1 text-xs">
                        <span>Maximum lines</span>
                        <select
                          className={control + ' text-foreground w-full'}
                          disabled={!editable}
                          value={field.maxLines}
                          onChange={(e) =>
                            updateField({
                              maxLines: Number(e.target.value) as 1 | 2,
                            })
                          }
                        >
                          <option value={1}>1 line</option>
                          <option value={2}>2 lines</option>
                        </select>
                      </label>
                      <label className="text-muted-foreground block space-y-1 text-xs">
                        <span>Line spacing</span>
                        <select
                          className={control + ' text-foreground w-full'}
                          disabled={!editable}
                          value={field.lineHeight}
                          onChange={(e) =>
                            updateField({ lineHeight: Number(e.target.value) })
                          }
                        >
                          {[0.8, 1, 1.2, 1.5].map((v) => (
                            <option key={v} value={v}>
                              {v}x
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-muted-foreground block space-y-1 text-xs">
                        <span>Character spacing (pt)</span>
                        <select
                          className={control + ' text-foreground w-full'}
                          disabled={!editable}
                          value={field.letterSpacingPt}
                          onChange={(e) =>
                            updateField({
                              letterSpacingPt: Number(e.target.value),
                            })
                          }
                        >
                          {[-1, 0, 1, 2].map((v) => (
                            <option key={v} value={v}>
                              {v} pt
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="space-y-1.5">
                        <span className="text-muted-foreground text-xs">
                          Long-text behavior
                        </span>
                        <div className="bg-muted/30 grid grid-cols-2 gap-1 rounded-lg border p-0.5">
                          {[
                            {
                              value: 'shrink-then-clip',
                              label: 'Shrink & clip',
                              desc: 'Down to min size',
                            },
                            {
                              value: 'clip',
                              label: 'Clip only',
                              desc: 'No downscaling',
                            },
                          ].map(({ value, label, desc }) => {
                            const isActive = field.fitMode === value
                            return (
                              <button
                                key={value}
                                type="button"
                                disabled={!editable}
                                aria-pressed={isActive}
                                className={`flex flex-col items-center justify-center rounded-md p-1.5 text-xs transition-all ${
                                  isActive
                                    ? 'bg-background text-foreground font-semibold shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                                onClick={() =>
                                  updateField({
                                    fitMode: value as
                                      | 'shrink-then-clip'
                                      | 'clip',
                                  })
                                }
                              >
                                <span>{label}</span>
                                <span className="text-[9px] font-normal opacity-70">
                                  {desc}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 border-b py-12 pb-8 text-center">
              <p className="text-foreground text-sm font-medium">
                No field selected
              </p>
              <p className="text-muted-foreground max-w-[200px] text-xs">
                Click on a field in the preview canvas or select a layer from
                the list to edit its properties.
              </p>
            </div>
          )}
          <hr />
          <h2 className="font-semibold">Reference artwork</h2>
          <label className="block text-sm">
            Reference image URL
            <input
              className={control + ' w-full'}
              type="url"
              disabled={!editable}
              value={layout.referenceBackgroundUrl ?? ''}
              onChange={(event) =>
                applyLayout({
                  ...layout,
                  referenceBackgroundUrl: event.target.value || null,
                })
              }
              placeholder="https://…"
            />
          </label>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Artwork opacity</span>
              <span className="font-mono text-[11px] font-semibold">
                {Math.round(referenceOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={referenceOpacity}
              disabled={!editable || !layout.referenceBackgroundUrl}
              onChange={(e) => setReferenceOpacity(Number(e.target.value))}
              className="accent-primary bg-muted h-1.5 w-full cursor-pointer rounded-lg"
              aria-label="Reference artwork opacity"
            />
          </div>
          <div className="space-y-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-center text-xs normal-case"
              disabled={!editable}
              onClick={() => referenceUploadInputRef.current?.click()}
            >
              <FileUp className="size-3.5" />
              Upload reference artwork
            </Button>
            <input
              ref={referenceUploadInputRef}
              className="sr-only"
              aria-label="Upload reference artwork file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={!editable}
              onChange={async (event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                setBusy(true)
                try {
                  const form = new FormData()
                  form.append('image', file)
                  const result = await uploadBadgeReference(projectUuid, form)
                  if (result.success)
                    applyLayout({
                      ...layout,
                      referenceBackgroundUrl: result.url,
                    })
                  else setMessage(result.error)
                } finally {
                  setBusy(false)
                }
              }}
            />
            <p className="text-muted-foreground text-[11px]">
              PNG, JPG, or WebP
            </p>
          </div>
          <button
            className={control}
            disabled={!editable || !layout.referenceBackgroundUrl}
            onClick={() =>
              applyLayout({ ...layout, referenceBackgroundUrl: null })
            }
          >
            Remove reference
          </button>
        </aside>
      </div>
      <details
        className="group bg-card rounded-xl border p-4 shadow-xs transition-all"
        onToggle={async (event) => {
          if (event.currentTarget.open) {
            const result = await getBadgeLayoutRevisions(projectUuid)
            if (result.success) setHistory(result.revisions)
          }
        }}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold select-none">
          <div className="flex items-center gap-2.5">
            <div className="bg-muted/40 text-muted-foreground flex size-8 items-center justify-center rounded-lg border">
              <History className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm font-semibold">
                  Published revision history
                </span>
                {history.length > 0 && (
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
                    {history.length}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-xs font-normal">
                Review changes, preview past layouts, or restore an earlier
                revision if needed
              </p>
            </div>
          </div>
          <ChevronDown className="text-muted-foreground size-4 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="mt-4 divide-y border-t pt-2">
          {history.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center text-xs">
              No previous revisions or loading history…
            </div>
          ) : (
            history.map((revision) => {
              const isCurrent =
                revision.publishedRevision === state.publishedRevision
              return (
                <div
                  key={revision.publishedRevision}
                  className="flex flex-wrap items-center justify-between gap-4 py-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold">
                      r{revision.publishedRevision}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-semibold">
                          Revision {revision.publishedRevision}
                        </span>
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Currently Live
                          </span>
                        ) : (
                          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
                            Archived
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock className="text-muted-foreground/70 size-3" />
                          {formatRevisionDate(revision.publishedAt)}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <User className="text-muted-foreground/70 size-3" />
                          {formatPublisher(revision.publishedBy)}
                        </span>
                      </div>
                      {revision.restoredFromRevision && (
                        <div className="text-muted-foreground text-[11px]">
                          Restored from revision {revision.restoredFromRevision}
                        </div>
                      )}
                      {revision.changeSummary && (
                        <div className="mt-2 max-w-xl space-y-1 text-[11px]">
                          <p className="text-foreground font-medium">
                            {revision.changeSummary.summary}
                          </p>
                          {revision.changeSummary.details.length > 0 && (
                            <details className="text-muted-foreground">
                              <summary className="cursor-pointer select-none hover:underline">
                                View details
                              </summary>
                              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                                {revision.changeSummary.details.map(
                                  (detail) => (
                                    <li key={detail}>{detail}</li>
                                  )
                                )}
                              </ul>
                            </details>
                          )}
                        </div>
                      )}
                      {revision.publishNote && (
                        <p className="bg-muted/40 text-muted-foreground mt-2 max-w-xl rounded-md px-2.5 py-1.5 text-[11px] whitespace-pre-wrap">
                          <span className="text-foreground font-medium">
                            Note:
                          </span>{' '}
                          {revision.publishNote}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs normal-case"
                      disabled={busy}
                      onClick={() =>
                        void previewRevision(revision.publishedRevision)
                      }
                      aria-label={`Preview revision ${revision.publishedRevision}`}
                    >
                      <Eye className="size-3" />
                      <span>Preview</span>
                    </Button>
                    {isCurrent ? (
                      <span className="text-muted-foreground px-1 py-1 text-[11px] italic">
                        Active version
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs normal-case"
                        disabled={!canManagePublishedRevision}
                        onClick={() => {
                          const expectedPublishedRevision =
                            state.publishedRevision
                          requestConfirmation({
                            title: 'Restore published revision?',
                            description:
                              'Your draft will be kept. This revision will become a new published revision for future print jobs.',
                            confirmLabel: 'Restore revision',
                            onConfirm: async () => {
                              if (
                                stateRef.current?.publishedRevision !==
                                expectedPublishedRevision
                              ) {
                                setMessage(
                                  'This confirmation is no longer current.'
                                )
                                return
                              }
                              setBusy(true)
                              try {
                                const result = await rollbackBadgeLayout(
                                  projectUuid,
                                  revision.publishedRevision,
                                  expectedPublishedRevision
                                )
                                if (result.success) {
                                  setState(result.state)
                                  const revisions =
                                    await getBadgeLayoutRevisions(projectUuid)
                                  if (revisions.success)
                                    setHistory(revisions.revisions)
                                  setMessage(
                                    'Previous layout restored as a new published revision.'
                                  )
                                } else {
                                  setMessage(result.error)
                                  setConflict(!!result.conflict)
                                }
                              } finally {
                                setBusy(false)
                              }
                            },
                          })
                        }}
                        aria-label={`Restore revision ${revision.publishedRevision}`}
                      >
                        <RotateCcw className="size-3" />
                        <span>Restore</span>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </details>
    </div>
  )
}

function NumberControl({
  label,
  value,
  unit: explicitUnit,
  disabled,
  onChange,
}: {
  label: string
  value: number
  unit?: 'mm' | 'pt'
  disabled: boolean
  onChange: (value: number) => void
}) {
  const id = useId()
  const [input, setInput] = useState<string | null>(null)
  const [prevValue, setPrevValue] = useState(value)

  if (prevValue !== value) {
    setPrevValue(value)
    setInput(null)
  }

  const unit =
    explicitUnit ??
    (label.includes('(mm)') ? 'mm' : label.includes('(pt)') ? 'pt' : null)
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        title={label}
        className="text-muted-foreground block truncate text-xs font-medium"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={control + ' text-foreground w-full pr-7 font-mono text-xs'}
          type="number"
          step="0.5"
          value={input ?? value}
          disabled={disabled}
          onFocus={() => setInput(String(value))}
          onBlur={() => setInput(null)}
          onChange={(event) => {
            setInput(event.target.value)
            if (Number.isFinite(event.target.valueAsNumber))
              onChange(event.target.valueAsNumber)
          }}
        />
        {unit && (
          <span
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-[10px]"
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

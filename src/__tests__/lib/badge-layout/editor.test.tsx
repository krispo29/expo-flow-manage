import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import { BadgeLayoutEditor } from '@/components/settings/badge-layout-editor'
import {
  copyBadgeLayoutDraft,
  getBadgeLayout,
  getBadgeLayoutRevision,
  getBadgeLayoutRevisions,
  saveBadgeLayoutDraft,
  publishBadgeLayout,
} from '@/app/actions/badge-layout'
import { getProjects } from '@/app/actions/project'
import {
  reserveLayoutPrintWindow,
  renderLayoutPrintWindow,
} from '@/lib/badge-layout/print-window'
import { getStarterLayout } from '@/lib/badge-layout/templates'
import { saveCheckpoint } from '@/lib/badge-layout/editor-draft'
import { searchParticipantsForBadgePreview } from '@/app/actions/participant'

jest.mock('@/app/actions/badge-layout', () => ({
  getBadgeLayout: jest.fn(),
  getBadgeLayoutRevision: jest.fn(),
  getBadgeLayoutRevisions: jest.fn(),
  copyBadgeLayoutDraft: jest.fn(),
  saveBadgeLayoutDraft: jest.fn(),
  publishBadgeLayout: jest.fn(),
  rollbackBadgeLayout: jest.fn(),
  uploadBadgeReference: jest.fn(),
}))
jest.mock('@/app/actions/project', () => ({
  getProjects: jest.fn(),
}))
jest.mock('@/app/actions/participant', () => ({
  searchParticipantsForBadgePreview: jest.fn(),
}))
jest.mock('@/lib/badge-layout/print-window', () => ({
  reserveLayoutPrintWindow: jest.fn(),
  renderLayoutPrintWindow: jest.fn(),
}))
jest.mock('@/components/print/layout-badge-card', () => {
  function LayoutBadgeCardPreview({
    data,
    onReady,
  }: {
    data: { fullName: string; company: string }
    onReady?: () => void
  }) {
    React.useEffect(() => {
      onReady?.()
    }, [data, onReady])

    return (
      <div
        data-testid="preview"
        data-preview-name={data.fullName}
        data-preview-company={data.company}
      />
    )
  }

  return { LayoutBadgeCard: LayoutBadgeCardPreview }
})

const layout = getStarterLayout('PH')
const state = {
  projectUuid: 'project-one',
  projectCode: 'PH',
  draft: layout,
  draftRevision: 3,
  published: null,
  publishedRevision: 0,
  publishedAt: null,
  publishedBy: null,
}
beforeEach(() => {
  jest.resetAllMocks()
  window.localStorage.clear()
  jest.mocked(getBadgeLayout).mockResolvedValue({ success: true, state })
  jest
    .mocked(getBadgeLayoutRevisions)
    .mockResolvedValue({ success: true, revisions: [] })
  jest
    .mocked(searchParticipantsForBadgePreview)
    .mockResolvedValue({ success: true, data: [] })
  jest.mocked(getProjects).mockResolvedValue({ success: true, projects: [] })
})

it('copies the current layout to another project as an unpublished draft', async () => {
  const targetLayout = getStarterLayout('THAILAB2026')
  const targetState = {
    ...state,
    projectUuid: 'project-two',
    projectCode: 'THAILAB2026',
    draft: targetLayout,
    draftRevision: 7,
  }
  jest.mocked(getProjects).mockResolvedValue({
    success: true,
    projects: [
      {
        project_uuid: 'project-two',
        project_code: 'THAILAB2026',
        project_name: 'THAILAB 2026',
      } as never,
    ],
  })
  jest.mocked(getBadgeLayout).mockImplementation(async (projectUuid) => ({
    success: true,
    state: projectUuid === 'project-two' ? targetState : state,
  }))
  jest.mocked(copyBadgeLayoutDraft).mockResolvedValue({
    success: true,
    state: { ...targetState, draft: layout, draftRevision: 8 },
  })

  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.click(
    screen.getByRole('button', { name: 'Copy layout to another project' })
  )
  const copyDialog = await screen.findByRole('dialog')
  expect(copyDialog).toHaveTextContent('Copy layout to another project')
  fireEvent.change(screen.getByLabelText('Destination project'), {
    target: { value: 'project-two' },
  })
  await screen.findByText('Current draft revision: 7')
  fireEvent.click(screen.getByRole('button', { name: 'Review copy' }))
  expect(copyBadgeLayoutDraft).not.toHaveBeenCalled()
  fireEvent.click(await screen.findByRole('button', { name: 'Copy draft' }))
  await waitFor(() =>
    expect(copyBadgeLayoutDraft).toHaveBeenCalledWith(
      'project-one',
      'project-two',
      7,
      layout
    )
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    'Layout copied to THAILAB 2026'
  )
})

it('saves a new project draft before printing and closes the popup on save failure', async () => {
  jest.mocked(getBadgeLayout).mockResolvedValue({
    success: true,
    state: { ...state, draft: null, draftRevision: 0 },
  })
  const close = jest.fn()
  jest
    .mocked(reserveLayoutPrintWindow)
    .mockReturnValue({ close } as unknown as Window)
  jest.mocked(saveBadgeLayoutDraft).mockImplementation(async () => {
    expect(reserveLayoutPrintWindow).toHaveBeenCalledTimes(1)
    return { success: false, error: 'Save unavailable' }
  })
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Test print' }))
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1))
  expect(saveBadgeLayoutDraft).toHaveBeenCalledWith('project-one', 0, layout)
  expect(renderLayoutPrintWindow).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Test print' })).toBeEnabled()
})

it.each(['cancel', 'failure'])(
  'invalidates prior approval when a repeated print ends in %s',
  async (outcome) => {
    jest
      .mocked(reserveLayoutPrintWindow)
      .mockReturnValue({ close: jest.fn() } as unknown as Window)
    jest.mocked(renderLayoutPrintWindow).mockResolvedValue()
    render(<BadgeLayoutEditor projectUuid="project-one" />)
    await screen.findByTestId('preview')
    fireEvent.click(screen.getByRole('button', { name: 'Test print' }))
    fireEvent.click(
      await screen.findByRole('button', { name: 'Confirm print is correct' })
    )
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled()
    if (outcome === 'failure')
      jest
        .mocked(renderLayoutPrintWindow)
        .mockRejectedValueOnce(new Error('Print failed'))
    fireEvent.click(screen.getByRole('button', { name: 'Test print' }))
    if (outcome === 'cancel') {
      fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    } else {
      await screen.findByText('Print failed')
    }
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()
  }
)

it('disables both print entry points and editing during an outstanding print', async () => {
  let finish!: () => void
  jest
    .mocked(reserveLayoutPrintWindow)
    .mockReturnValue({ close: jest.fn() } as unknown as Window)
  jest.mocked(renderLayoutPrintWindow).mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve
    })
  )
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.click(
    screen.getByRole('button', { name: 'Publication readiness status' })
  )
  const run = await screen.findByRole('button', { name: 'Run Test Print' })
  fireEvent.click(run)
  expect(run).toBeDisabled()
  fireEvent.click(run)
  expect(reserveLayoutPrintWindow).toHaveBeenCalledTimes(1)
  expect(screen.getByLabelText('Left (mm)')).toBeDisabled()
  await act(async () => finish())
})

it('undoes and redoes a field change without accepting shortcuts from inputs', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.change(screen.getByLabelText('Left (mm)'), {
    target: { value: '4' },
  })
  expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()
  fireEvent.blur(screen.getByLabelText('Left (mm)'))
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
  expect(screen.getByLabelText('Left (mm)')).toHaveValue(
    layout.fields.fullName.xMm
  )
  fireEvent.keyDown(screen.getByLabelText('Left (mm)'), {
    key: 'z',
    ctrlKey: true,
  })
  expect(screen.getByLabelText('Left (mm)')).toHaveValue(
    layout.fields.fullName.xMm
  )
  fireEvent.click(screen.getByRole('button', { name: 'Redo' }))
  expect(screen.getByLabelText('Left (mm)')).toHaveValue(4)
})

it('offers compatible browser recovery and lets a clean starter replace the whole layout', async () => {
  const recovered = {
    ...layout,
    fields: {
      ...layout.fields,
      fullName: { ...layout.fields.fullName, xMm: 4 },
    },
  }
  saveCheckpoint('project-one', 3, recovered)
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.click(screen.getByRole('button', { name: 'Restore draft' }))
  expect(screen.getByLabelText('Left (mm)')).toHaveValue(4)
  fireEvent.change(screen.getByLabelText('Starter template'), {
    target: { value: 'THAILAB2026' },
  })
  expect(screen.getByLabelText('Paper width (mm)')).toHaveValue(
    getStarterLayout('THAILAB2026').paper.widthMm
  )
})

it('invalidates a test token after an edit and exposes friendly quick actions', async () => {
  jest
    .mocked(reserveLayoutPrintWindow)
    .mockReturnValue({ close: jest.fn() } as unknown as Window)
  jest.mocked(renderLayoutPrintWindow).mockResolvedValue()
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.click(screen.getByRole('button', { name: 'Test print' }))
  await screen.findByRole('dialog')
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirm print is correct' })
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled()
  )
  fireEvent.click(screen.getByRole('button', { name: 'Center on paper' }))
  expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()
  expect(screen.getByText('Advanced text settings')).toBeInTheDocument()
})

it('requires a test print before publishing the saved draft', async () => {
  jest
    .mocked(reserveLayoutPrintWindow)
    .mockReturnValue({ close: jest.fn() } as unknown as Window)
  jest.mocked(renderLayoutPrintWindow).mockResolvedValue()
  jest.mocked(publishBadgeLayout).mockResolvedValue({
    success: true,
    state: { ...state, published: layout, publishedRevision: 1 },
  })
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Test print' }))
  await screen.findByRole('dialog')
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirm print is correct' })
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled()
  )
  fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
  expect(publishBadgeLayout).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Publish layout' }))
  await waitFor(() =>
    expect(publishBadgeLayout).toHaveBeenCalledWith('project-one', 3, 0)
  )
})

it('accepts an optional publish note in the confirmation modal', async () => {
  jest
    .mocked(reserveLayoutPrintWindow)
    .mockReturnValue({ close: jest.fn() } as unknown as Window)
  jest.mocked(renderLayoutPrintWindow).mockResolvedValue()
  jest.mocked(publishBadgeLayout).mockResolvedValue({
    success: true,
    state: { ...state, published: layout, publishedRevision: 1 },
  })
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.click(screen.getByRole('button', { name: 'Test print' }))
  await screen.findByRole('dialog')
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirm print is correct' })
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled()
  )
  fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
  fireEvent.change(screen.getByLabelText('Publish note (optional)'), {
    target: { value: 'Align PH artwork reference' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Publish layout' }))
  await waitFor(() =>
    expect(publishBadgeLayout).toHaveBeenCalledWith(
      'project-one',
      3,
      0,
      'Align PH artwork reference'
    )
  )
})

it('previews an older revision without changing the draft', async () => {
  const historical = { ...layout, paper: { ...layout.paper, widthMm: 85 } }
  jest.mocked(getBadgeLayoutRevisions).mockResolvedValue({
    success: true,
    revisions: [
      {
        publishedRevision: 1,
        publishedAt: '2026-09-09T08:00:00.000Z',
        publishedBy: { id: 'admin-1', displayName: 'Tech Lead' },
        publishNote: 'Original layout',
        changeSummary: { summary: 'Initial layout', details: [] },
        restoredFromRevision: null,
      },
    ],
  })
  jest.mocked(getBadgeLayoutRevision).mockResolvedValue({
    success: true,
    revision: {
      projectUuid: 'project-one',
      projectCode: 'PH',
      published: historical,
      publishedRevision: 1,
      publishedAt: '2026-09-09T08:00:00.000Z',
      publishedBy: { id: 'admin-1', displayName: 'Tech Lead' },
      publishNote: 'Original layout',
      changeSummary: { summary: 'Initial layout', details: [] },
      restoredFromRevision: null,
    },
  })
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.click(screen.getByText('Published revision history'))
  await screen.findByRole('button', { name: 'Preview revision 1' })
  fireEvent.click(screen.getByRole('button', { name: 'Preview revision 1' }))
  await waitFor(() =>
    expect(
      screen.getByText(/Viewing historical revision 1/)
    ).toBeInTheDocument()
  )
  expect(getBadgeLayoutRevision).toHaveBeenCalledWith('project-one', 1)
  expect(screen.getByText('History preview (r1)')).toBeInTheDocument()
})

it('refuses a publish confirmation when the tested layout changed', async () => {
  jest
    .mocked(reserveLayoutPrintWindow)
    .mockReturnValue({ close: jest.fn() } as unknown as Window)
  jest.mocked(renderLayoutPrintWindow).mockResolvedValue()
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.click(screen.getByRole('button', { name: 'Test print' }))
  await screen.findByRole('dialog')
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirm print is correct' })
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled()
  )
  fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
  fireEvent.change(screen.getByLabelText('Left (mm)'), {
    target: { value: '4' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Publish layout' }))
  expect(publishBadgeLayout).not.toHaveBeenCalled()
  expect(screen.getByRole('status')).toHaveTextContent(
    'This confirmation is no longer current'
  )
})

it('keeps publishing disabled when the physical test is not confirmed', async () => {
  jest
    .mocked(reserveLayoutPrintWindow)
    .mockReturnValue({ close: jest.fn() } as unknown as Window)
  jest.mocked(renderLayoutPrintWindow).mockResolvedValue()
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.click(screen.getByRole('button', { name: 'Test print' }))
  await screen.findByRole('dialog')
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent(
    'Test print not confirmed'
  )
})

it('saves with the loaded draft revision and does not publish edits', async () => {
  jest
    .mocked(saveBadgeLayoutDraft)
    .mockResolvedValue({ success: true, state: { ...state, draftRevision: 4 } })
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.change(screen.getByLabelText('Left (mm)'), {
    target: { value: '4' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
  await waitFor(() =>
    expect(saveBadgeLayoutDraft).toHaveBeenCalledWith(
      'project-one',
      3,
      expect.objectContaining({
        fields: expect.objectContaining({
          fullName: expect.objectContaining({ xMm: 4 }),
        }),
      })
    )
  )
  expect(publishBadgeLayout).not.toHaveBeenCalled()
})

it('blocks saving geometry outside the paper', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.change(screen.getByLabelText('Left (mm)'), {
    target: { value: '500' },
  })
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Field extends past paper'
  )
  expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled()
})

it('keeps local edits and requires reload after a conflict', async () => {
  jest.mocked(saveBadgeLayoutDraft).mockResolvedValue({
    success: false,
    error: 'Conflict',
    conflict: { ...state, draftRevision: 4 },
  })
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.change(screen.getByLabelText('Left (mm)'), {
    target: { value: '4' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
  await screen.findByRole('button', { name: 'Reload latest' })
  expect(screen.getByLabelText('Left (mm)')).toHaveValue(4)
  expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled()
})

it('saves the tested local draft before publishing and uses the returned revision', async () => {
  const edited = {
    ...layout,
    fields: {
      ...layout.fields,
      fullName: { ...layout.fields.fullName, xMm: 4 },
    },
  }
  jest
    .mocked(reserveLayoutPrintWindow)
    .mockReturnValue({ close: jest.fn() } as unknown as Window)
  jest.mocked(renderLayoutPrintWindow).mockResolvedValue()
  jest.mocked(saveBadgeLayoutDraft).mockResolvedValue({
    success: true,
    state: { ...state, draft: edited, draftRevision: 4 },
  })
  jest.mocked(publishBadgeLayout).mockResolvedValue({
    success: true,
    state: {
      ...state,
      draft: edited,
      draftRevision: 4,
      published: edited,
      publishedRevision: 1,
    },
  })
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.change(screen.getByLabelText('Left (mm)'), {
    target: { value: '4' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Test print' }))
  await screen.findByRole('dialog')
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirm print is correct' })
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled()
  )
  fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
  fireEvent.click(screen.getByRole('button', { name: 'Publish layout' }))
  await waitFor(() =>
    expect(publishBadgeLayout).toHaveBeenCalledWith('project-one', 4, 0)
  )
  expect(saveBadgeLayoutDraft).toHaveBeenCalledWith('project-one', 3, edited)
})

it('discards compatible recovery and keeps the fetched server draft', async () => {
  const recovered = {
    ...layout,
    fields: {
      ...layout.fields,
      fullName: { ...layout.fields.fullName, xMm: 4 },
    },
  }
  saveCheckpoint('project-one', 3, recovered)
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByRole('dialog')
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.getByLabelText('Left (mm)')).toHaveValue(
    layout.fields.fullName.xMm
  )
})

it('saves draft when Ctrl+S or Cmd+S is pressed while dirty', async () => {
  jest
    .mocked(saveBadgeLayoutDraft)
    .mockResolvedValue({ success: true, state: { ...state, draftRevision: 4 } })
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.change(screen.getByLabelText('Left (mm)'), {
    target: { value: '4' },
  })
  fireEvent.keyDown(window, {
    key: 's',
    ctrlKey: true,
  })
  await waitFor(() =>
    expect(saveBadgeLayoutDraft).toHaveBeenCalledWith(
      'project-one',
      3,
      expect.objectContaining({
        fields: expect.objectContaining({
          fullName: expect.objectContaining({ xMm: 4 }),
        }),
      })
    )
  )
})

it('hides the selected field when Delete key is pressed', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  expect(screen.getByLabelText('Visible')).toBeChecked()
  fireEvent.keyDown(window, { key: 'Delete' })
  expect(screen.getByLabelText('Visible')).not.toBeChecked()
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
  expect(screen.getByLabelText('Visible')).toBeChecked()
})

it('toggles field visibility directly from the layer list eye button', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  const eyeBtn = screen.getByRole('button', {
    name: 'Toggle visibility for Full name',
  })
  expect(screen.getByLabelText('Visible')).toBeChecked()
  fireEvent.click(eyeBtn)
  expect(screen.getByLabelText('Visible')).not.toBeChecked()
  fireEvent.click(eyeBtn)
  expect(screen.getByLabelText('Visible')).toBeChecked()
})

it('updates text alignment and font weight using segmented controls', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  const centerAlignBtn = screen.getByRole('button', {
    name: 'Align text center',
  })
  fireEvent.click(centerAlignBtn)
  expect(centerAlignBtn).toHaveAttribute('aria-pressed', 'true')

  const boldBtn = screen.getByRole('button', { name: 'Weight Bold' })
  fireEvent.click(boldBtn)
  expect(boldBtn).toHaveAttribute('aria-pressed', 'true')
})

it('supports vertical text alignment independently from frame position', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.click(screen.getByRole('button', { name: 'Badge type' }))

  const centerVerticalBtn = screen.getByRole('button', {
    name: 'Align text vertically center',
  })
  expect(
    screen.getByRole('button', { name: 'Align text vertically top' })
  ).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(centerVerticalBtn)
  expect(centerVerticalBtn).toHaveAttribute('aria-pressed', 'true')
})

it('uses the in-app confirmation modal before leaving with unsaved changes', async () => {
  const confirm = jest.spyOn(window, 'confirm').mockImplementation(() => true)
  const link = document.createElement('a')
  link.href = '/settings'
  const click = jest.fn((event: MouseEvent) => event.preventDefault())
  link.addEventListener('click', click)
  document.body.appendChild(link)

  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.click(screen.getByRole('button', { name: 'Badge type' }))
  fireEvent.click(
    screen.getByRole('button', { name: 'Align text vertically center' })
  )

  fireEvent.click(link)

  const dialog = await screen.findByRole('dialog')
  expect(dialog).toHaveTextContent('Leave page?')
  expect(dialog).toHaveTextContent(
    'Leave this page and discard unsaved badge layout changes?'
  )
  expect(screen.getByRole('button', { name: 'Leave page' })).toHaveClass(
    'bg-primary'
  )
  expect(screen.getByRole('button', { name: 'Leave page' })).not.toHaveClass(
    'bg-destructive'
  )
  expect(confirm).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(click).not.toHaveBeenCalled()

  fireEvent.click(link)
  fireEvent.click(await screen.findByRole('button', { name: 'Leave page' }))
  expect(click).toHaveBeenCalledTimes(1)
  expect(confirm).not.toHaveBeenCalled()

  link.remove()
  confirm.mockRestore()
})

it('centers field horizontally using the alignment toolbar', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.change(screen.getByLabelText('Left (mm)'), {
    target: { value: '4' },
  })
  expect(screen.getByLabelText('Left (mm)')).toHaveValue(4)
  fireEvent.click(screen.getByRole('button', { name: 'Center horizontally' }))
  expect(
    Number(screen.getByLabelText('Left (mm)').getAttribute('value'))
  ).toBeGreaterThan(4)
})

it('renders 8-point resize handles for the selected field', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  expect(
    screen.getByRole('button', { name: 'Resize Full name se' })
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Resize Full name nw' })
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Resize Full name ne' })
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Resize Full name sw' })
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Resize Full name n' })
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Resize Full name s' })
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Resize Full name e' })
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Resize Full name w' })
  ).toBeInTheDocument()
})

it('provides zoom controls and displays SVG millimeter rulers', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')

  // Rulers are visible by default
  expect(screen.getByLabelText('Horizontal ruler')).toBeInTheDocument()
  expect(screen.getByLabelText('Vertical ruler')).toBeInTheDocument()

  // Toggle rulers off and on
  const rulersToggle = screen.getByRole('button', { name: 'Toggle rulers' })
  fireEvent.click(rulersToggle)
  expect(screen.queryByLabelText('Horizontal ruler')).not.toBeInTheDocument()
  fireEvent.click(rulersToggle)
  expect(screen.getByLabelText('Horizontal ruler')).toBeInTheDocument()

  // Zoom controls
  const zoomInBtn = screen.getByRole('button', { name: 'Zoom in' })
  const zoomOutBtn = screen.getByRole('button', { name: 'Zoom out' })
  const resetZoomBtn = screen.getByRole('button', { name: 'Reset zoom (100%)' })
  const fitBtn = screen.getByRole('button', { name: 'Fit to screen' })

  expect(resetZoomBtn).toHaveTextContent('100%')
  fireEvent.click(zoomInBtn)
  expect(resetZoomBtn).toHaveTextContent('110%')
  fireEvent.click(zoomOutBtn)
  expect(resetZoomBtn).toHaveTextContent('100%')
  fireEvent.click(fitBtn)
  expect(resetZoomBtn).toHaveTextContent('85%')
  fireEvent.click(resetZoomBtn)
  expect(resetZoomBtn).toHaveTextContent('100%')
})

it('toggles lanyard slot and printable safety margin overlays', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')

  expect(
    screen.queryByLabelText('Lanyard punch slot guide')
  ).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Safety margin guide')).not.toBeInTheDocument()

  const lanyardBtn = screen.getByRole('button', {
    name: 'Toggle lanyard slot guide',
  })
  fireEvent.click(lanyardBtn)
  expect(screen.getByLabelText('Lanyard punch slot guide')).toBeInTheDocument()

  const marginBtn = screen.getByRole('button', {
    name: 'Toggle safety margin guide',
  })
  fireEvent.click(marginBtn)
  expect(screen.getByLabelText('Safety margin guide')).toBeInTheDocument()

  fireEvent.click(lanyardBtn)
  expect(
    screen.queryByLabelText('Lanyard punch slot guide')
  ).not.toBeInTheDocument()
})

it('switches attendee preview personas', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')

  const personaSelect = screen.getByLabelText('Preview attendee persona')
  expect(personaSelect).toHaveValue('standard')

  fireEvent.change(personaSelect, { target: { value: 'thai' } })
  expect(personaSelect).toHaveValue('thai')

  fireEvent.change(personaSelect, { target: { value: 'vip' } })
  expect(personaSelect).toHaveValue('vip')
})

it('searches and previews a real attendee without invoking participant mutations', async () => {
  const attendee = {
    registration_uuid: 'attendee-1',
    registration_code: 'PH-001',
    first_name: 'Jane',
    last_name: 'Doe',
    company_name: 'Example Labs',
    job_position: 'Researcher',
    attendee_type_code: 'VIP',
    country: 'TH',
  }
  jest
    .mocked(searchParticipantsForBadgePreview)
    .mockResolvedValue({ success: true, data: [attendee] })

  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')

  fireEvent.change(screen.getByLabelText('Preview data mode'), {
    target: { value: 'attendee' },
  })
  fireEvent.change(screen.getByLabelText('Search attendees'), {
    target: { value: 'Jane' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Search/ }))

  const result = await screen.findByRole('option', { name: /Jane Doe/ })
  fireEvent.click(result)

  await waitFor(() => {
    expect(screen.getByTestId('preview')).toHaveAttribute(
      'data-preview-name',
      'Jane Doe'
    )
  })
  expect(screen.getByTestId('preview')).toHaveAttribute(
    'data-preview-company',
    'Example Labs'
  )
  expect(searchParticipantsForBadgePreview).toHaveBeenCalledWith(
    'project-one',
    'Jane'
  )
})

it('uses the selected attendee for Test Print without saving attendee data', async () => {
  const attendee = {
    registration_uuid: 'attendee-2',
    registration_code: 'PH-002',
    first_name: 'John',
    last_name: 'Smith',
    company_name: 'Print Labs',
    job_position: 'Operator',
    attendee_type_code: 'VISITOR',
    country: 'TH',
  }
  jest
    .mocked(searchParticipantsForBadgePreview)
    .mockResolvedValue({ success: true, data: [attendee] })
  jest
    .mocked(reserveLayoutPrintWindow)
    .mockReturnValue({ close: jest.fn() } as unknown as Window)
  jest.mocked(renderLayoutPrintWindow).mockResolvedValue()

  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.change(screen.getByLabelText('Preview data mode'), {
    target: { value: 'attendee' },
  })
  fireEvent.change(screen.getByLabelText('Search attendees'), {
    target: { value: 'John' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Search/ }))
  fireEvent.click(await screen.findByRole('option', { name: /John Smith/ }))

  fireEvent.click(screen.getByRole('button', { name: 'Test print' }))
  await waitFor(() => expect(renderLayoutPrintWindow).toHaveBeenCalled())
  expect(renderLayoutPrintWindow).toHaveBeenCalledWith(
    expect.anything(),
    layout,
    [
      expect.objectContaining({
        fullName: 'John Smith',
        company: 'Print Labs',
        registrationCode: 'PH-002',
      }),
    ]
  )
  expect(saveBadgeLayoutDraft).not.toHaveBeenCalled()
})

it('ignores a stale attendee search response', async () => {
  const firstAttendee = {
    registration_uuid: 'attendee-old',
    registration_code: 'OLD-001',
    first_name: 'Old',
    last_name: 'Result',
    company_name: 'Old Labs',
    job_position: '',
    attendee_type_code: 'VISITOR',
  }
  let resolveFirst!: (value: {
    success: true
    data: (typeof firstAttendee)[]
  }) => void
  const secondAttendee = {
    registration_uuid: 'attendee-new',
    registration_code: 'NEW-001',
    first_name: 'New',
    last_name: 'Result',
    company_name: 'New Labs',
    job_position: '',
    attendee_type_code: 'VISITOR',
  }
  const firstRequest = new Promise<{
    success: true
    data: (typeof firstAttendee)[]
  }>((resolve) => {
    resolveFirst = resolve
  })
  jest
    .mocked(searchParticipantsForBadgePreview)
    .mockReturnValueOnce(firstRequest)
    .mockResolvedValueOnce({ success: true, data: [secondAttendee] })

  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')
  fireEvent.change(screen.getByLabelText('Preview data mode'), {
    target: { value: 'attendee' },
  })

  const query = screen.getByLabelText('Search attendees')
  fireEvent.change(query, { target: { value: 'Old' } })
  fireEvent.click(screen.getByRole('button', { name: /Search/ }))
  fireEvent.change(query, { target: { value: 'New' } })
  fireEvent.click(screen.getByRole('button', { name: /Search/ }))

  await screen.findByRole('option', { name: /New Result/ })
  resolveFirst({ success: true, data: [firstAttendee] })
  await act(async () => undefined)
  expect(
    screen.queryByRole('option', { name: /Old Result/ })
  ).not.toBeInTheDocument()
  expect(screen.getByRole('option', { name: /New Result/ })).toBeInTheDocument()
})

it('deselects the active field on Escape key and reselects on layer click', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')

  // Initially fullName is selected, Left (mm) input is visible in inspector
  expect(screen.getByLabelText('Left (mm)')).toBeInTheDocument()

  // Press Escape on the window
  fireEvent.keyDown(window, { key: 'Escape' })

  // Active field is cleared
  expect(screen.getByText('No field selected')).toBeInTheDocument()
  expect(screen.queryByLabelText('Left (mm)')).not.toBeInTheDocument()

  // Click on Full name layer button in the layers panel to reselect
  const fullNameLayer = screen.getByRole('button', { name: 'Full name' })
  fireEvent.click(fullNameLayer)

  expect(screen.getByLabelText('Left (mm)')).toBeInTheDocument()
  expect(screen.queryByText('No field selected')).not.toBeInTheDocument()
})

it('does not prevent space key default on button targets', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')

  const zoomInBtn = screen.getByRole('button', { name: 'Zoom in' })
  zoomInBtn.focus()
  const event = new KeyboardEvent('keydown', {
    code: 'Space',
    bubbles: true,
    cancelable: true,
  })
  zoomInBtn.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
})

it('displays Invalid layout status in readiness popover when geometry extends outside paper', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')

  expect(
    screen.getByRole('button', { name: 'Publication readiness status' })
  ).toHaveTextContent('Test print required')

  fireEvent.change(screen.getByLabelText('Left (mm)'), {
    target: { value: '500' },
  })

  expect(
    screen.getByRole('button', { name: 'Publication readiness status' })
  ).toHaveTextContent('Invalid layout')
})

it('adjusts reference artwork opacity via slider', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')

  const urlInput = screen.getByLabelText('Reference image URL')
  fireEvent.change(urlInput, {
    target: { value: 'https://example.com/bg.png' },
  })

  const opacitySlider = screen.getByLabelText('Reference artwork opacity')
  expect(opacitySlider).toBeEnabled()
  expect(screen.getByText('35%')).toBeInTheDocument()

  fireEvent.change(opacitySlider, { target: { value: '0.75' } })
  expect(screen.getByText('75%')).toBeInTheDocument()
})

it('presents reference artwork upload as a styled action', async () => {
  const { container } = render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')

  expect(
    screen.getByRole('button', { name: 'Upload reference artwork' })
  ).toBeInTheDocument()
  expect(screen.getByText('PNG, JPG, or WebP')).toBeInTheDocument()
  expect(container.querySelector('input[type="file"]')).toHaveClass('sr-only')
})

it('clears active field selection on Escape key even while typing inside an input', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')

  const leftInput = screen.getByLabelText('Left (mm)')
  act(() => {
    leftInput.focus()
  })

  fireEvent.keyDown(leftInput, { key: 'Escape', bubbles: true })
  expect(screen.getByText('No field selected')).toBeInTheDocument()
  expect(screen.queryByLabelText('Left (mm)')).not.toBeInTheDocument()
})

it('pans the canvas viewport on trackpad wheel scroll', async () => {
  const { container } = render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')

  const viewport = container.querySelector('.select-none') as HTMLElement
  expect(viewport).toBeInTheDocument()

  const panLayer = viewport.firstElementChild as HTMLElement
  expect(panLayer.style.transform).toBe('translate(0px, 0px)')

  fireEvent.wheel(viewport, { deltaX: 50, deltaY: 30 })

  expect(panLayer.style.transform).toBe('translate(-50px, -30px)')
})

it('displays fallback live pill when no published revision exists and disables live view', async () => {
  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')

  expect(
    screen.getByText('Live: Default fallback (Unpublished)')
  ).toBeInTheDocument()

  const liveViewBtn = screen.getByRole('button', { name: /Live View/i })
  expect(liveViewBtn).toBeDisabled()
})

it('displays active published layout status in header and switches between draft and live preview', async () => {
  const publishedLayout = {
    ...layout,
    paper: { widthMm: 100, heightMm: 150 },
    fields: {
      ...layout.fields,
      fullName: { ...layout.fields.fullName, xMm: 12 },
    },
  }
  const publishedState = {
    ...state,
    draftRevision: 5,
    published: publishedLayout,
    publishedRevision: 2,
    publishedAt: '2026-09-08T10:00:00Z',
    publishedBy: { id: 'admin-1', displayName: 'Tech Lead' },
  }
  jest.mocked(getBadgeLayout).mockResolvedValueOnce({
    success: true,
    state: publishedState,
  })

  render(<BadgeLayoutEditor projectUuid="project-one" />)
  await screen.findByTestId('preview')

  // Live status pill in header
  expect(screen.getByText('Live on printers: Revision 2')).toBeInTheDocument()
  expect(screen.getByText('100×150 mm')).toBeInTheDocument()

  // Live View button is enabled
  const liveViewBtn = screen.getByRole('button', { name: /Live View \(r2\)/i })
  expect(liveViewBtn).toBeEnabled()

  // Switch to Live View
  fireEvent.click(liveViewBtn)

  // Live banner is visible
  expect(
    screen.getByText(/Viewing Active Published Layout \(Revision 2\)/i)
  ).toBeInTheDocument()

  // Inspector shows read-only banner
  expect(screen.getByText('Live Revision 2')).toBeInTheDocument()
  expect(screen.getByText('Read-only')).toBeInTheDocument()
  expect(screen.getByLabelText('Left (mm)')).toBeDisabled()

  // Switch back to Draft Editor
  const returnDraftBtn = screen.getAllByRole('button', {
    name: 'Return to Draft Editor',
  })[0]
  fireEvent.click(returnDraftBtn)

  expect(
    screen.queryByText(/Viewing Active Published Layout/i)
  ).not.toBeInTheDocument()
  expect(screen.getByLabelText('Left (mm)')).toBeEnabled()
})

it.each(['live', 'conflict', 'modal'])(
  'blocks modifying shortcuts while editor is locked by %s',
  async (mode) => {
    jest.mocked(getBadgeLayout).mockResolvedValue({
      success: true,
      state: { ...state, published: layout, publishedRevision: 1 },
    })
    jest
      .mocked(saveBadgeLayoutDraft)
      .mockResolvedValue({ success: false, error: 'Conflict', conflict: state })
    render(<BadgeLayoutEditor projectUuid="project-one" />)
    await screen.findByTestId('preview')
    fireEvent.change(screen.getByLabelText('Left (mm)'), {
      target: { value: '4' },
    })
    fireEvent.blur(screen.getByLabelText('Left (mm)'))
    if (mode === 'live')
      fireEvent.click(screen.getByRole('button', { name: /Live View/i }))
    if (mode === 'conflict') {
      fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
      await screen.findByText('Conflict')
    }
    if (mode === 'modal') {
      fireEvent.change(screen.getByLabelText('Starter template'), {
        target: { value: 'THAILAB2026' },
      })
      await screen.findByRole('dialog')
    }
    jest.mocked(saveBadgeLayoutDraft).mockClear()
    fireEvent.keyDown(window, { key: 'Delete' })
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    fireEvent.keyDown(window, { key: 's', ctrlKey: true })
    expect(saveBadgeLayoutDraft).not.toHaveBeenCalled()
    if (mode === 'modal')
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    if (mode === 'live')
      fireEvent.click(
        screen.getAllByRole('button', { name: 'Return to Draft Editor' })[0]
      )
    expect(screen.getByLabelText('Left (mm)')).toHaveValue(4)
    expect(screen.getByLabelText('Visible')).toBeChecked()
  }
)

'use server'
import axios from 'axios'
import api from '@/lib/api'
import {
  requireServerAuthHeaders,
  requireServerAuthContext,
} from '@/lib/server-auth'
import {
  badgeLayoutSchema,
  stateSchema,
  historySchema,
  revisionDetailSchema,
  type BadgeLayout,
  type BadgeLayoutState,
} from '@/lib/badge-layout/schema'

type Result =
  | { success: true; state: BadgeLayoutState }
  | {
      success: false
      error: string
      status?: number
      conflict?: BadgeLayoutState
    }
async function request(
  projectUuid: string,
  path: string,
  method: 'get' | 'put' | 'post',
  data?: unknown
): Promise<Result> {
  try {
    const auth = await requireServerAuthContext({ projectUuid })
    if (auth.userRole !== 'ADMIN')
      throw new Error('Badge layout is available to administrators only')
    const response = await api.request({
      url: '/v1/admin/project/badge-layout' + path,
      method,
      data,
      timeout: 10000,
      headers: await requireServerAuthHeaders({ projectUuid }),
    })
    const state = stateSchema.parse(response.data.data)
    if (state.projectUuid !== projectUuid)
      throw new Error('Wrong project response')
    return { success: true, state }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      const current = stateSchema.safeParse(error.response.data?.data)
      return {
        success: false,
        error: 'Another user changed this layout. Reload before saving.',
        conflict: current.success ? current.data : undefined,
      }
    }
    return {
      success: false,
      status: axios.isAxiosError(error) ? error.response?.status : 403,
      error: axios.isAxiosError(error)
        ? error.response?.data?.message || 'Unable to load or save layout'
        : error instanceof Error
          ? error.message
          : 'Invalid layout',
    }
  }
}
export async function getBadgeLayout(projectUuid: string) {
  return request(projectUuid, '', 'get')
}
export async function saveBadgeLayoutDraft(
  projectUuid: string,
  expectedDraftRevision: number,
  layout: BadgeLayout
) {
  const parsed = badgeLayoutSchema.safeParse(layout)
  if (!parsed.success)
    return {
      success: false as const,
      error: parsed.error.issues
        .map((i) => i.path.join('.') + ': ' + i.message)
        .join('; '),
    }
  return request(projectUuid, '/draft', 'put', {
    expectedDraftRevision,
    layout: parsed.data,
  })
}

/**
 * Copy a validated draft between projects without publishing the destination.
 * The source project is used only to authorize the cross-project operation;
 * the destination revision is still checked by the normal draft-save API.
 */
export async function copyBadgeLayoutDraft(
  sourceProjectUuid: string,
  targetProjectUuid: string,
  expectedTargetDraftRevision: number,
  layout: BadgeLayout
) {
  try {
    const auth = await requireServerAuthContext({
      projectUuid: sourceProjectUuid,
    })
    if (auth.userRole !== 'ADMIN') {
      return {
        success: false as const,
        error: 'Only administrators can copy layouts between projects.',
      }
    }
    if (sourceProjectUuid === targetProjectUuid) {
      return {
        success: false as const,
        error: 'Choose a different destination project.',
      }
    }
    return saveBadgeLayoutDraft(
      targetProjectUuid,
      expectedTargetDraftRevision,
      layout
    )
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Unable to copy layout',
    }
  }
}

export async function publishBadgeLayout(
  projectUuid: string,
  expectedDraftRevision: number,
  expectedPublishedRevision: number,
  publishNote = ''
) {
  const note = publishNote.trim()
  return request(projectUuid, '/publish', 'post', {
    expectedDraftRevision,
    expectedPublishedRevision,
    ...(note ? { publishNote: note } : {}),
  })
}
export async function rollbackBadgeLayout(
  projectUuid: string,
  targetPublishedRevision: number,
  expectedPublishedRevision: number
) {
  return request(projectUuid, '/rollback', 'post', {
    targetPublishedRevision,
    expectedPublishedRevision,
  })
}
export async function getBadgeLayoutRevisions(projectUuid: string) {
  try {
    const response = await api.get('/v1/admin/project/badge-layout/revisions', {
      headers: await requireServerAuthHeaders({ projectUuid }),
    })
    return {
      success: true as const,
      revisions: historySchema.parse(response.data.data),
    }
  } catch {
    return { success: false as const, error: 'Unable to load revision history' }
  }
}
export async function getBadgeLayoutRevision(
  projectUuid: string,
  revision: number
) {
  try {
    const response = await api.get(
      `/v1/admin/project/badge-layout/revisions/${revision}`,
      {
        headers: await requireServerAuthHeaders({ projectUuid }),
      }
    )
    const detail = revisionDetailSchema.parse(response.data.data)
    if (detail.projectUuid !== projectUuid)
      throw new Error('Wrong project response')
    return { success: true as const, revision: detail }
  } catch {
    return { success: false as const, error: 'Unable to load revision' }
  }
}
export async function uploadBadgeReference(
  projectUuid: string,
  form: FormData
) {
  try {
    const image = form.get('image')
    if (
      !(image instanceof File) ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(image.type) ||
      image.size > 5 * 1024 * 1024
    )
      throw new Error('Choose a PNG, JPEG or WebP image under 5MB.')
    const body = new FormData()
    body.append('file', image)
    const access = await getBadgeLayout(projectUuid)
    if (!access.success) throw new Error(access.error)
    const response = await api.post('/v1/admin/project/upload/image', body, {
      headers: {
        ...(await requireServerAuthHeaders({ projectUuid })),
        'Content-Type': 'multipart/form-data',
      },
    })
    const url = response.data?.data?.url
    if (typeof url !== 'string') throw new Error('Upload returned no image URL')
    return { success: true as const, url }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

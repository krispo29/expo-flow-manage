import { z } from 'zod'

export const fieldKeys = [
  'fullName',
  'position',
  'company',
  'country',
  'qrCode',
  'registrationCode',
  'badgeType',
] as const
export type BadgeFieldKey = (typeof fieldKeys)[number]
const frame = {
  xMm: z.number().min(0).max(500),
  yMm: z.number().min(0).max(500),
  widthMm: z.number().min(1).max(500),
  heightMm: z.number().min(1).max(500),
  visible: z.boolean(),
}
const text = z
  .strictObject({
    ...frame,
    kind: z.literal('text'),
    fontSizePt: z.number().min(4).max(120),
    minFontSizePt: z.number().min(4).max(120),
    fontWeight: z.union([z.literal(400), z.literal(700), z.literal(900)]),
    lineHeight: z.number().min(0.5).max(3),
    letterSpacingPt: z.number().min(-5).max(20),
    textAlign: z.enum(['left', 'center', 'right']),
    textTransform: z.enum(['none', 'uppercase']),
    verticalAlign: z.enum(['top', 'center', 'bottom']).default('top'),
    maxLines: z.union([z.literal(1), z.literal(2)]),
    fitMode: z.enum(['shrink-then-clip', 'clip']),
  })
  .refine((f) => f.minFontSizePt <= f.fontSizePt, {
    path: ['minFontSizePt'],
    message: 'Minimum font must not exceed maximum',
  })
const qr = z.strictObject({
  ...frame,
  kind: z.literal('qr'),
  errorCorrection: z.literal('M'),
})
export const referenceUrlSchema = z
  .string()
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value)
      return (
        url.protocol === 'https:' &&
        !!url.hostname &&
        !url.username &&
        !url.password
      )
    } catch {
      return false
    }
  }, 'Use an absolute HTTPS image URL without credentials')
  .nullable()
export const badgeLayoutSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    layoutId: z.literal('default'),
    paper: z.strictObject({
      widthMm: z.number().min(20).max(500),
      heightMm: z.number().min(20).max(500),
    }),
    referenceBackgroundUrl: referenceUrlSchema,
    fields: z.strictObject({
      fullName: text,
      position: text,
      company: text,
      country: text,
      qrCode: qr,
      registrationCode: text,
      badgeType: text,
    }),
  })
  .superRefine((layout, ctx) => {
    for (const key of fieldKeys) {
      const field = layout.fields[key]
      if (field.xMm + field.widthMm > layout.paper.widthMm + 0.000001)
        ctx.addIssue({
          code: 'custom',
          path: ['fields', key, 'widthMm'],
          message: 'Field extends past paper',
        })
      if (field.yMm + field.heightMm > layout.paper.heightMm + 0.000001)
        ctx.addIssue({
          code: 'custom',
          path: ['fields', key, 'heightMm'],
          message: 'Field extends past paper',
        })
    }
    const q = layout.fields.qrCode
    if (
      q.widthMm < 15 ||
      q.heightMm < 15 ||
      Math.abs(q.widthMm - q.heightMm) > 0.000001
    )
      ctx.addIssue({
        code: 'custom',
        path: ['fields', 'qrCode', 'widthMm'],
        message: 'QR must be square and at least 15mm',
      })
  })
export type BadgeLayout = z.infer<typeof badgeLayoutSchema>
export type TextFieldLayout = z.infer<typeof text>
export type FieldFrame = Pick<TextFieldLayout, keyof typeof frame>
export type BadgeRenderData = Record<Exclude<BadgeFieldKey, 'qrCode'>, string>
export const renderDataSchema = z.object({
  fullName: z.string(),
  position: z.string(),
  company: z.string(),
  country: z.string(),
  registrationCode: z.string().trim().min(1),
  badgeType: z.string(),
})
const revision = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)
const actor = z.object({ id: z.string(), displayName: z.string() })
export const stateSchema = z.object({
  projectUuid: z.string().min(1),
  projectCode: z.string().min(1),
  draft: badgeLayoutSchema.nullable(),
  draftRevision: revision,
  published: badgeLayoutSchema.nullable(),
  publishedRevision: revision,
  publishedAt: z.string().nullable(),
  publishedBy: actor.nullable(),
})
export type BadgeLayoutState = z.infer<typeof stateSchema>
export const publishedSchema = z
  .object({
    projectUuid: z.string().min(1),
    projectCode: z.string().min(1),
    published: badgeLayoutSchema.nullable(),
    publishedRevision: revision,
    publishedAt: z.string().nullable(),
  })
  .refine(
    (v) =>
      v.published === null
        ? v.publishedRevision === 0
        : v.publishedRevision > 0,
    'Invalid published revision'
  )
export type PublishedBadgeLayout = z.infer<typeof publishedSchema>
export const changeSummarySchema = z.object({
  summary: z.string().min(1),
  details: z.array(z.string()),
})
export const historySchema = z.array(
  z.object({
    publishedRevision: revision,
    publishedAt: z.string(),
    publishedBy: actor,
    publishNote: z.string().nullable().optional(),
    changeSummary: changeSummarySchema.nullable().optional(),
    restoredFromRevision: revision.nullable().optional(),
  })
)
export type RevisionSummary = z.infer<typeof historySchema>[number]
export const revisionDetailSchema = z.object({
  projectUuid: z.string().min(1),
  projectCode: z.string().min(1),
  published: badgeLayoutSchema,
  publishedRevision: revision,
  publishedAt: z.string(),
  publishedBy: actor,
  publishNote: z.string().nullable().optional(),
  changeSummary: changeSummarySchema.nullable().optional(),
  restoredFromRevision: revision.nullable().optional(),
})
export type RevisionDetail = z.infer<typeof revisionDetailSchema>
export const calibrationSchema = z.object({
  offsetXMm: z.number().min(-20).max(20),
  offsetYMm: z.number().min(-20).max(20),
})
export type Calibration = z.infer<typeof calibrationSchema>

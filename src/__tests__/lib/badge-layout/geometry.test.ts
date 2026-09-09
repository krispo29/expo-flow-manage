import {
  moveField,
  resizeField,
  snapField,
  overlappingFields,
} from '@/lib/badge-layout/geometry'
import { getStarterLayout } from '@/lib/badge-layout/templates'

const paper = { widthMm: 105, heightMm: 130 }
const frame = { xMm: 10, yMm: 10, widthMm: 30, heightMm: 20, visible: true }

describe('badge field movement', () => {
  it('snaps movement to half a millimetre', () => {
    expect(moveField(frame, paper, 0.3, 0.8)).toMatchObject({
      xMm: 10.5,
      yMm: 11,
    })
  })
  it('keeps the complete field inside paper bounds', () => {
    expect(moveField(frame, paper, -100, 1000)).toMatchObject({
      xMm: 0,
      yMm: 110,
    })
    expect(moveField(frame, paper, 1000, -100)).toMatchObject({
      xMm: 75,
      yMm: 0,
    })
  })
  it('does not mutate the original frame', () => {
    moveField(frame, paper, 5, 5)
    expect(frame.xMm).toBe(10)
  })
  it('resizes text without crossing the paper edge', () => {
    expect(resizeField(frame, paper, 1000, -100, false)).toMatchObject({
      widthMm: 95,
      heightMm: 1,
    })
  })
  it('keeps QR square with a 15 mm minimum', () => {
    expect(resizeField(frame, paper, -100, -100, true)).toMatchObject({
      widthMm: 15,
      heightMm: 15,
    })
  })
  it('snaps to the page centre using a screen-derived threshold', () => {
    const layout = getStarterLayout('PH')
    const result = snapField(layout, 'fullName', 0.4, 0, 1)
    expect(result.frame.xMm + result.frame.widthMm / 2).toBe(52.5)
    expect(result.guides.x).toBe(52.5)
  })
  it('clamps snapped fields to paper boundaries', () => {
    const layout = getStarterLayout('PH')
    expect(snapField(layout, 'fullName', -1000, 1000, 1).frame).toMatchObject({
      xMm: 0,
      yMm: layout.paper.heightMm - layout.fields.fullName.heightMm,
    })
  })
  it('reports only overlaps between visible fields', () => {
    const layout = getStarterLayout('PH')
    layout.fields.company = {
      ...layout.fields.company,
      xMm: layout.fields.fullName.xMm,
      yMm: layout.fields.fullName.yMm,
    }
    expect(overlappingFields(layout)).toContain('fullName / company')
    layout.fields.company.visible = false
    expect(overlappingFields(layout)).not.toContain('fullName / company')
  })
  it('resizes from top, left, and edge handles', () => {
    expect(resizeField(frame, paper, 10, 0, false, 'e')).toMatchObject({
      xMm: 10,
      widthMm: 40,
      yMm: 10,
      heightMm: 20,
    })
    expect(resizeField(frame, paper, 5, 0, false, 'w')).toMatchObject({
      xMm: 15,
      widthMm: 25,
      yMm: 10,
      heightMm: 20,
    })
    expect(resizeField(frame, paper, 0, 5, false, 'n')).toMatchObject({
      xMm: 10,
      widthMm: 30,
      yMm: 15,
      heightMm: 15,
    })
    expect(resizeField(frame, paper, 0, 10, false, 's')).toMatchObject({
      xMm: 10,
      widthMm: 30,
      yMm: 10,
      heightMm: 30,
    })
    expect(resizeField(frame, paper, 5, 5, false, 'nw')).toMatchObject({
      xMm: 15,
      widthMm: 25,
      yMm: 15,
      heightMm: 15,
    })

    // QR edge handle maintains 1:1 aspect ratio
    const qrResized = resizeField(frame, paper, 10, 0, true, 'e')
    expect(qrResized.widthMm).toBe(qrResized.heightMm)
  })
})

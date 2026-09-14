import {
  fieldKeys,
  type BadgeFieldKey,
  type BadgeLayout,
  type FieldFrame,
} from './schema'

export function snapField(
  layout: BadgeLayout,
  key: BadgeFieldKey,
  dx: number,
  dy: number,
  thresholdMm: number
) {
  const frame = layout.fields[key]
  const neighbours = fieldKeys
    .filter((other) => other !== key && layout.fields[other].visible)
    .map((other) => layout.fields[other])
  const xTargets = [
    0,
    layout.paper.widthMm / 2,
    layout.paper.widthMm,
    ...neighbours.flatMap((f) => [
      f.xMm,
      f.xMm + f.widthMm / 2,
      f.xMm + f.widthMm,
    ]),
  ]
  const yTargets = [
    0,
    layout.paper.heightMm / 2,
    layout.paper.heightMm,
    ...neighbours.flatMap((f) => [
      f.yMm,
      f.yMm + f.heightMm / 2,
      f.yMm + f.heightMm,
    ]),
  ]
  function align(position: number, size: number, targets: number[]) {
    let distance = thresholdMm,
      guide: number | undefined,
      aligned = Math.round(position)
    for (const target of targets)
      for (const anchor of [0, size / 2, size]) {
        const delta = target - (position + anchor)
        if (Math.abs(delta) < distance) {
          distance = Math.abs(delta)
          aligned = position + delta
          guide = target
        }
      }
    return { position: aligned, guide }
  }
  const x = align(frame.xMm + dx, frame.widthMm, xTargets)
  const y = align(frame.yMm + dy, frame.heightMm, yTargets)
  return {
    frame: {
      ...frame,
      xMm: Math.max(
        0,
        Math.min(layout.paper.widthMm - frame.widthMm, x.position)
      ),
      yMm: Math.max(
        0,
        Math.min(layout.paper.heightMm - frame.heightMm, y.position)
      ),
    },
    guides: { x: x.guide, y: y.guide },
  }
}

export function overlappingFields(layout: BadgeLayout): string[] {
  const visible = fieldKeys.filter((key) => layout.fields[key].visible)
  return visible.flatMap((a, index) =>
    visible
      .slice(index + 1)
      .filter((b) => {
        const left = layout.fields[a],
          right = layout.fields[b]
        return (
          left.xMm < right.xMm + right.widthMm &&
          right.xMm < left.xMm + left.widthMm &&
          left.yMm < right.yMm + right.heightMm &&
          right.yMm < left.yMm + left.heightMm
        )
      })
      .map((b) => `${a} / ${b}`)
  )
}

export function moveField(
  frame: FieldFrame,
  paper: BadgeLayout['paper'],
  dx: number,
  dy: number,
  snap = 0.5
) {
  const round = (value: number) => Math.round(value / snap) * snap
  return {
    ...frame,
    xMm: Math.max(
      0,
      Math.min(paper.widthMm - frame.widthMm, round(frame.xMm + dx))
    ),
    yMm: Math.max(
      0,
      Math.min(paper.heightMm - frame.heightMm, round(frame.yMm + dy))
    ),
  }
}

export type ResizeHandle = 'se' | 'sw' | 'ne' | 'nw' | 'n' | 's' | 'e' | 'w'

export function resizeField(
  frame: FieldFrame,
  paper: BadgeLayout['paper'],
  dx: number,
  dy: number,
  square: boolean,
  handle: ResizeHandle = 'se'
) {
  const round = (value: number) => Math.round(value * 2) / 2
  const minSize = square ? 15 : 1

  let newX = frame.xMm
  let newY = frame.yMm
  let newWidth = frame.widthMm
  let newHeight = frame.heightMm

  const right = frame.xMm + frame.widthMm
  const bottom = frame.yMm + frame.heightMm

  if (handle === 'e') {
    if (square) {
      const side = Math.min(
        paper.widthMm - frame.xMm,
        paper.heightMm - frame.yMm,
        Math.max(minSize, round(frame.widthMm + dx))
      )
      newWidth = side
      newHeight = side
    } else {
      newWidth = Math.max(minSize, Math.min(paper.widthMm - frame.xMm, round(frame.widthMm + dx)))
    }
  } else if (handle === 'w') {
    if (square) {
      const side = Math.min(
        right,
        paper.heightMm - frame.yMm,
        Math.max(minSize, round(frame.widthMm - dx))
      )
      newX = right - side
      newWidth = side
      newHeight = side
    } else {
      newX = Math.max(0, Math.min(right - minSize, round(frame.xMm + dx)))
      newWidth = right - newX
    }
  } else if (handle === 's') {
    if (square) {
      const side = Math.min(
        paper.widthMm - frame.xMm,
        paper.heightMm - frame.yMm,
        Math.max(minSize, round(frame.heightMm + dy))
      )
      newWidth = side
      newHeight = side
    } else {
      newHeight = Math.max(minSize, Math.min(paper.heightMm - frame.yMm, round(frame.heightMm + dy)))
    }
  } else if (handle === 'n') {
    if (square) {
      const side = Math.min(
        paper.widthMm - frame.xMm,
        bottom,
        Math.max(minSize, round(frame.heightMm - dy))
      )
      newY = bottom - side
      newWidth = side
      newHeight = side
    } else {
      newY = Math.max(0, Math.min(bottom - minSize, round(frame.yMm + dy)))
      newHeight = bottom - newY
    }
  } else if (handle === 'se') {
    if (square) {
      const delta = Math.max(dx, dy)
      const side = Math.min(
        paper.widthMm - frame.xMm,
        paper.heightMm - frame.yMm,
        Math.max(minSize, round(frame.widthMm + delta))
      )
      newWidth = side
      newHeight = side
    } else {
      newWidth = Math.max(minSize, Math.min(paper.widthMm - frame.xMm, round(frame.widthMm + dx)))
      newHeight = Math.max(minSize, Math.min(paper.heightMm - frame.yMm, round(frame.heightMm + dy)))
    }
  } else if (handle === 'sw') {
    if (square) {
      const delta = Math.max(-dx, dy)
      const side = Math.min(
        right,
        paper.heightMm - frame.yMm,
        Math.max(minSize, round(frame.widthMm + delta))
      )
      newX = right - side
      newWidth = side
      newHeight = side
    } else {
      newX = Math.max(0, Math.min(right - minSize, round(frame.xMm + dx)))
      newWidth = right - newX
      newHeight = Math.max(minSize, Math.min(paper.heightMm - frame.yMm, round(frame.heightMm + dy)))
    }
  } else if (handle === 'ne') {
    if (square) {
      const delta = Math.max(dx, -dy)
      const side = Math.min(
        paper.widthMm - frame.xMm,
        bottom,
        Math.max(minSize, round(frame.widthMm + delta))
      )
      newY = bottom - side
      newWidth = side
      newHeight = side
    } else {
      newWidth = Math.max(minSize, Math.min(paper.widthMm - frame.xMm, round(frame.widthMm + dx)))
      newY = Math.max(0, Math.min(bottom - minSize, round(frame.yMm + dy)))
      newHeight = bottom - newY
    }
  } else if (handle === 'nw') {
    if (square) {
      const delta = Math.max(-dx, -dy)
      const side = Math.min(
        right,
        bottom,
        Math.max(minSize, round(frame.widthMm + delta))
      )
      newX = right - side
      newY = bottom - side
      newWidth = side
      newHeight = side
    } else {
      newX = Math.max(0, Math.min(right - minSize, round(frame.xMm + dx)))
      newWidth = right - newX
      newY = Math.max(0, Math.min(bottom - minSize, round(frame.yMm + dy)))
      newHeight = bottom - newY
    }
  }

  return {
    ...frame,
    xMm: newX,
    yMm: newY,
    widthMm: newWidth,
    heightMm: newHeight,
  }
}

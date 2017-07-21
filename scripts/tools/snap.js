'use strict'

const { Point } = require('paper')

const roundToNearest = (num, base) => {
  return Math.round(num / base) * base
}

const directionalSnap = (from, to, nearest) => {
  const { x: dx, y: dy } = to.subtract(from)

  const r = Math.sqrt(dx * dx + dy * dy)

  const theta = Math.atan2(dy, dx)
  const angle = roundToNearest(theta, nearest)

  const x = r * Math.cos(angle)
  const y = r * Math.sin(angle)

  return new Point(from.x + x, from.y + y)
}

const snapToGrid = (
  point,
  gridSize = 1,
  offset = new Point({ x: 0, y: 0 })
) => {
  point = point.subtract(offset)

  return new Point({
    x: roundToNearest(point.x, gridSize) + offset.x,
    y: roundToNearest(point.y, gridSize) + offset.y
  })
}

module.exports = {
  roundToNearest,
  directionalSnap,
  snapToGrid
}

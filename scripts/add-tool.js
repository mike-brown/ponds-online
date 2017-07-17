'use strict'

const { Point } = require('paper')
const { Tool } = require('./tool')
const { Editor } = require('./editor')

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

class AddTool extends Tool {
  activate () {
    super.activate()

    this.tempPond = this.editor.pond.clone({ insert: false })
    this.editor.pond.visible = false

    this.tempPond.selected = true
    this.editor.baseLayer.addChild(this.tempPond)
  }

  deactivate () {
    super.deactivate()

    Editor.sanitizePond(this.editor.pond)

    if (this.editor.veg.length > 0) {
      this.editor.mergeVegetation()

      const vegArea = this.editor.veg[0].intersect(this.editor.pond)
      this.editor.veg[0].remove()
      this.editor.veg = []
      this.editor.veg.push(vegArea)
      this.editor.baseLayer.addChild(vegArea)
    }

    this.editor.pond.visible = true

    if (this.tempPond) {
      this.tempPond.remove()
      this.tempPond = undefined
    }
  }

  onMouseDown (ev) {
    const lastPoint = this.editor.pond.segments.length
      ? this.editor.pond.segments[this.editor.pond.segments.length - 1].point
      : undefined

    const point = this.editor.gridSnap
      ? snapToGrid(
        ev.point,
        this.editor.zoomLevel *
            this.editor.GRID_SCALE /
            this.editor.GRID_SUBDIVISIONS,
        this.editor.viewport.add(this.editor.view.center)
      )
      : this.editor.angleSnap && lastPoint
        ? directionalSnap(lastPoint, ev.point, this.editor.ANGLE_SNAP)
        : ev.point

    this.editor.pond.add(point)
  }

  onMouseMove (ev) {
    const movePond = this.editor.pond.clone({ insert: false })
    const lastPoint = movePond.segments.length
      ? movePond.segments[movePond.segments.length - 1].point
      : undefined

    const point = this.editor.gridSnap
      ? snapToGrid(
        ev.point,
        this.editor.zoomLevel *
            (this.editor.GRID_SCALE / this.editor.GRID_SUBDIVISIONS),
        this.editor.viewport.add(this.editor.view.center)
      )
      : this.editor.angleSnap && lastPoint
        ? directionalSnap(lastPoint, ev.point, this.editor.ANGLE_SNAP)
        : ev.point

    movePond.add(point)
    movePond.visible = true
    movePond.selected = true
    Editor.fillPond(movePond)

    this.tempPond.replaceWith(movePond)
    this.tempPond = movePond
  }

  onKeyDown (ev) {
    if (ev.key === 'enter') {
      this.editor.deactivateActiveTool()
    } else if (ev.key === 'shift') {
      this.editor.angleSnap = true
    }
  }

  onKeyUp (ev) {
    if (ev.key === 'shift') {
      this.editor.angleSnap = false
    }
  }
}

module.exports = {
  AddTool
}

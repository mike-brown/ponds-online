;'use strict'

const { Point } = require('paper')
const { Tool } = require('./tool')
const { Editor } = require('./editor')

const roundToNearest = (num, base) => {
  return Math.round(num / base) * base
}

const directionalSnap = (from, to, nearest) => {
  const dx = to.x - from.x
  const dy = to.y - from.y

  const r = Math.sqrt(dx * dx + dy * dy)

  const theta = Math.atan2(dy, dx)
  const angle = roundToNearest(theta, nearest)

  const x = r * Math.cos(angle)
  const y = r * Math.sin(angle)

  return new Point(from.x + x, from.y + y)
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

    this.tempPond.remove()
    this.tempPond = undefined
  }

  onMouseDown (ev) {
    this.editor.pond.add(ev.point)
  }

  onMouseMove (ev) {
    const movePond = this.editor.pond.clone({ insert: false })

    const point =
      this.editor.pond.segments.length && this.editor.snap
        ? directionalSnap(
          movePond.segments[movePond.segments.length - 1].point,
          ev.point,
          Math.PI / 6
        )
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
      this.editor.snap = true
    }
  }

  onKeyUp (ev) {
    if (ev.key === 'shift') {
      this.editor.snap = false
    }
  }
}

module.exports = {
  AddTool
}

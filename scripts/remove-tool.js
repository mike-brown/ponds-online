'use strict'

const { Tool } = require('./tool')
const { Editor } = require('./editor')
const {
  directionalSnap,
  snapToGrid
} = require('./snap')

class RemoveTool extends Tool {
  activate () {
    super.activate()

    this.tempMask = this.editor.mask.clone({ insert: false })
    this.editor.mask.visible = false

    this.tempMask.selected = true
    this.editor.baseLayer.addChild(this.tempMask)
  }

  deactivate () {
    super.deactivate()

    this.editor.mask.visible = true
    Editor.sanitizePond(this.editor.mask)

    const newPond = this.editor.pond.subtract(this.editor.mask)
    this.editor.pond.replaceWith(newPond)
    this.editor.pond = newPond

    if (this.editor.veg.length) {
      this.editor.mergeVegetation()

      const newVeg = this.editor.veg[0].subtract(this.editor.mask)
      this.editor.veg[0].replaceWith(newVeg)
      this.editor.veg[0] = newVeg
    }

    if (this.editor.inlet) {
      if (this.editor.inlet.intersects(this.editor.mask)) {
        this.editor.inlet.remove()
        this.editor.inlet = undefined
      }

      if (!this.editor.inlet.intersects(this.editor.pond)) {
        this.editor.inlet.remove()
        this.editor.inlet = undefined
      }
    }

    if (this.editor.outlet) {
      if (this.editor.outlet.intersects(this.editor.mask)) {
        this.editor.outlet.remove()
        this.editor.outlet = undefined
      }

      if (!this.editor.outlet.intersects(this.editor.pond)) {
        this.editor.outlet.remove()
        this.editor.outlet = undefined
      }
    }

    this.editor.mask.remove()
    this.tempMask.remove()

    this.tempMask = undefined
    this.editor.mask = Editor.createMask()
  }

  onMouseDown (ev) {
    const lastPoint = Editor.lastPointOf(this.editor.mask)
    const point = this.lineSnap(ev.point, lastPoint)

    this.editor.mask.add(point)
  }

  onMouseMove (ev) {
    const moveMask = this.editor.mask.clone({ insert: false })

    const lastPoint = Editor.lastPointOf(moveMask)
    const point = this.lineSnap(ev.point, lastPoint)

    moveMask.add(point)
    moveMask.visible = true
    moveMask.selected = true

    this.tempMask.replaceWith(moveMask)
    this.tempMask = moveMask
  }

  onKeyDown (ev) {
    if (ev.key === 'enter') {
      this.editor.deactivateActiveTool()
    }
  }
}

module.exports = {
  RemoveTool
}

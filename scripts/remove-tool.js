'use strict'

const { Tool } = require('./tool')
const { Editor } = require('./editor')

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

    const newVeg = this.editor.veg[0].subtract(this.editor.mask)
    this.editor.veg[0].replaceWith(newVeg)
    this.editor.veg[0] = newVeg

    this.editor.mask.remove()
    this.tempMask.remove()

    this.tempMask = undefined
    this.editor.mask = Editor.createMask()
  }

  onMouseDown (ev) {
    this.editor.mask.add(ev.point)
  }

  onMouseMove (ev) {
    const moveMask = this.editor.mask.clone({ insert: false })

    moveMask.add(ev.point)
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

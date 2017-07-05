'use strict'

const { Tool } = require('./tool')
const { Editor } = require('./editor')

class VegTool extends Tool {
  activate () {
    super.activate()

    this.tempVeg = this.editor.vegmask.clone({ insert: false })
    this.editor.vegmask.visible = false

    this.tempVeg.selected = true
    this.editor.baseLayer.addChild(this.tempVeg)
  }

  deactivate () {
    super.deactivate()

    this.editor.vegmask.visible = true
    Editor.sanitizePond(this.editor.vegmask)

    const vegArea = this.editor.vegmask.intersect(this.editor.pond)
    this.editor.veg.push(vegArea)
    this.editor.baseLayer.addChild(vegArea)

    this.editor.vegmask.remove()
    this.tempVeg.remove()

    this.tempVeg = undefined
    this.editor.vegmask = Editor.createVegMask()
  }

  onMouseDown (ev) {
    this.editor.vegmask.add(ev.point)
  }

  onMouseMove (ev) {
    const moveVeg = this.editor.vegmask.clone({ insert: false })

    moveVeg.add(ev.point)
    moveVeg.visible = true
    moveVeg.selected = true

    this.tempVeg.replaceWith(moveVeg)
    this.tempVeg = moveVeg
  }

  onKeyDown (ev) {
    if (ev.key === 'enter') {
      this.editor.deactivateActiveTool()
    }
  }
}

module.exports = {
  VegTool
}

'use strict'

const { Tool } = require('./tool')
const { Editor } = require('../editor')

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

    this.editor.mergeVegetation()
  }

  onMouseDown (ev) {
    const lastPoint = Editor.lastPointOf(this.editor.vegMask)
    const point = this.lineSnap(ev.point, lastPoint)

    this.editor.vegmask.add(point)
  }

  onMouseMove (ev) {
    const moveVeg = this.editor.vegmask.clone({ insert: false })
    const lastPoint = Editor.lastPointOf(moveVeg)
    const point = this.lineSnap(ev.point, lastPoint)

    moveVeg.add(point)
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

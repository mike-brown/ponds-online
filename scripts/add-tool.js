'use strict'

const { Tool } = require('./tool')
const { Editor } = require('./editor')
const { directionalSnap, snapToGrid } = require('./snap')

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
    const lastPoint = Editor.lastPointOf(this.editor.pond)
    const point = this.lineSnap(ev.point, lastPoint)

    this.editor.pond.add(point)
  }

  onMouseMove (ev) {
    const movePond = this.editor.pond.clone({ insert: false })
    const lastPoint = Editor.lastPointOf(movePond)
    const point = this.lineSnap(ev.point, lastPoint)

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
    }
  }
}

module.exports = {
  AddTool
}

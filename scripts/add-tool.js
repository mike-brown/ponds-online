'use strict'

const { Tool } = require('./tool')
const { Editor } = require('./editor')

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

    this.editor.pond.visible = true

    this.tempPond.remove()
    this.tempPond = undefined
  }

  onMouseDown (ev) {
    this.editor.pond.add(ev.point)
  }

  onMouseMove (ev) {
    const movePond = this.editor.pond.clone({ insert: false })

    movePond.add(ev.point)
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

'use strict'

const { Tool } = require('./tool')
const { Editor } = require('./editor')

class HandTool extends Tool {
  activate () {
    super.activate()

    this.editor.view.element.classList.add('pan')
  }

  deactivate () {
    super.deactivate()

    this.editor.view.element.classList.remove('pan')
  }

  onMouseDrag (ev) {
    this.editor.viewport.x += ev.delta.x
    this.editor.viewport.y += ev.delta.y

    this.editor.gridLayer.position.x += ev.delta.x
    this.editor.gridLayer.position.y += ev.delta.y

    this.editor.baseLayer.position.x += ev.delta.x
    this.editor.baseLayer.position.y += ev.delta.y
  }

  onKeyDown (ev) {
    if (ev.key === '=') {
      this.editor.zoom('in')
    } else if (ev.key === '-') {
      this.editor.zoom('out')
    }
  }
}

module.exports = {
  HandTool
}

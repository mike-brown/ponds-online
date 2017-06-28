'use strict'

const { Tool } = require('./tool')
const { Editor } = require('./editor')

class AddTool extends Tool {
  onMouseDown (ev) {
    if (this.editor.drawing) {
      this.editor.pond.add(ev.point)
    }
  }

  onMouseMove (ev) {
    if (this.editor.drawing) {
      Editor.removeLastSegment(this.editor.pond)
      this.editor.pond.add(ev.point)

      this.editor.fillPond()
    }
  }

  onKeyDown (ev) {
    if (
      ev.key === 'enter' &&
      this.editor.drawing &&
      !this.editor.pond.intersects(this.editor.pond)
    ) {
      this.editor.drawing = false

      Editor.removeLastSegment(this.editor.pond)
      this.editor.fillPond()
    }
  }
}

module.exports = {
  AddTool
}

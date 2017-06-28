'use strict'

const { Tool } = require('./tool')
const { Editor } = require('./editor')

class AddTool extends Tool {
  onMouseDown (ev) {
    if (
      this.editor.drawing &&
      (!this.editor.pond.intersects(this.editor.pond) ||
        this.editor.pond.segments.length < 3)
    ) {
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
    if (ev.key === 'shift' && this.editor.drawing) {
      this.editor.drawing = false

      Editor.removeLastSegment(this.editor.pond)
      this.editor.fillPond()
    }
  }
}

module.exports = {
  AddTool
}

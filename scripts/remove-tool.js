'use strict'

const { Tool } = require('./tool')
const { Editor } = require('./editor')

class RemoveTool extends Tool {
  activate () {
    super.activate()

    if (this.editor.drawing) {
      Editor.removeLastSegment(this.editor.pond)
      this.editor.fillPond()
    }

    this.editor.drawing = true
  }

  onMouseDown (ev) {
    if (this.editor.drawing) {
      this.editor.mask.add(ev.point)
    }
  }

  onMouseMove (ev) {
    if (this.editor.drawing) {
      this.editor.mask.removeSegment(this.editor.mask.segments.length - 1)
      this.editor.mask.add(ev.point)
    }
  }

  onKeyDown (ev) {
    if (ev.key === 'enter' && this.editor.drawing) {
      this.editor.drawing = false

      Editor.removeLastSegment(this.editor.mask)
      const newPond = this.editor.pond.subtract(this.editor.mask)
      this.editor.pond.remove()
      this.editor.mask.remove()
      this.editor.pond = newPond

      this.editor.mask = Editor.createMask()
    }
  }
}

module.exports = {
  RemoveTool
}

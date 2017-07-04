'use strict'

const { Tool } = require('./tool')
const { Editor } = require('./editor')

class VegTool extends Tool {
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
      this.editor.vegmask.add(ev.point)
    }
  }

  onMouseMove (ev) {
    if (this.editor.drawing) {
      this.editor.vegmask.removeSegment(this.editor.vegmask.segments.length - 1)
      this.editor.vegmask.add(ev.point)
    }
  }

  onKeyDown (ev) {
    if (ev.key === 'enter' && this.editor.drawing) {
      this.editor.drawing = false

      Editor.removeLastSegment(this.editor.vegmask)
      const vegArea = this.editor.vegmask.intersect(this.editor.pond)
      this.editor.vegmask.remove()
      this.editor.veg.push(vegArea)

      this.editor.vegmask = Editor.createVegMask()
    }
  }
}

module.exports = {
  VegTool
}

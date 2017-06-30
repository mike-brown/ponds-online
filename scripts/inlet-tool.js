'use strict'

const { Path, Path: { Line } } = require('paper')

const { Tool } = require('./tool')
const { Editor } = require('./editor')

class InletTool extends Tool {
  // onMouseDown (ev) {
  //   if (this.editor.drawing) {
  //     this.editor.vegmask.add(ev.point)
  //   }
  // }

  onMouseMove (ev) {
    const hit = this.editor.pond.hitTest(ev.point)

    if (hit && 'location' in hit && hit.location.segment) {
      if (this.editor._hitTarget) {
        this.editor._hitTarget.remove()
        this.editor._hitTarget = undefined
      }

      const segment = new Line(
        hit.location.segment.curve.point1,
        hit.location.segment.curve.point2
      )
      segment.strokeColor = 'red'
      segment.strokeWidth = 5

      this.editor._hitTarget = segment
    }
  }
}

module.exports = {
  InletTool
}

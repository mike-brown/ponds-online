'use strict'

const { Path: { Line } } = require('paper')

const { Tool } = require('./tool')
const { Editor } = require('./editor')

class InletTool extends Tool {
  onMouseDown (ev) {
    if (this.editor._hitTarget) {
      if (this.editor.inlet) {
        this.editor.inlet.remove()
      }

      this.editor.inlet = this.editor._hitTarget
      this.editor.inlet.closed = true
      this.editor._hitTarget = undefined

      this.editor.inlet.strokeColor = Editor.colors.blue

      if (
        this.editor.outlet &&
        this.editor.inlet.intersects(this.editor.outlet)
      ) {
        this.editor.outlet.remove()
        this.editor.outlet = undefined
      }
    }
  }

  onMouseMove (ev) {
    const hit = this.editor.pond.hitTest(ev.point)

    if (hit && 'location' in hit && hit.location.segment) {
      if (this.editor._hitTarget) {
        this.editor._hitTarget.remove()
        this.editor._hitTarget = undefined
      }

      const segment = new Line(
        hit.location.curve.point1,
        hit.location.curve.point2
      )
      segment.strokeCap = 'round'
      segment.strokeColor = Editor.colors.red
      segment.strokeWidth = 5

      this.editor.baseLayer.addChild(segment)
      this.editor._hitTarget = segment
    } else {
      if (this.editor._hitTarget) {
        this.editor._hitTarget.remove()
        this.editor._hitTarget = undefined
      }
    }
  }
}

module.exports = {
  InletTool
}

'use strict'

const { Tool: PaperTool } = require('paper')
const { directionalSnap, snapToGrid } = require('./snap')

class Tool {
  constructor (editor, button) {
    this.editor = editor
    this.button = button

    this.tool = new PaperTool()
    this.tool.onMouseDown = this.onMouseDown.bind(this)
    this.tool.onMouseMove = this.onMouseMove.bind(this)
    this.tool.onMouseDrag = this.onMouseDrag.bind(this)
    this.tool.onKeyDown = this.onKeyDown.bind(this)
    this.tool.onKeyUp = this.onKeyUp.bind(this)
  }

  activate () {
    this.tool.activate()

    if (this.button) {
      this.button.classList.add('active')
      this.button.blur()
    }
  }

  deactivate () {
    if (this.button) {
      this.button.classList.remove('active')
    }
  }

  lineSnap (point, lastPoint) {
    return this.editor.gridSnap
      ? snapToGrid(
        point,
        this.editor.zoomLevel *
            this.editor.GRID_SCALE /
            this.editor.GRID_SUBDIVISIONS,
        this.editor.viewport.add(this.editor.view.center)
      )
      : this.editor.angleSnap && lastPoint
        ? directionalSnap(lastPoint, point, this.editor.ANGLE_SNAP)
        : point
  }

  onMouseDown (ev) {}

  onMouseMove (ev) {}

  onMouseDrag (ev) {}

  onKeyDown (ev) {}

  onKeyUp (ev) {}
}

module.exports = {
  Tool
}

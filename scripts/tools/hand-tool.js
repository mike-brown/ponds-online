'use strict'

const { Tool } = require('./tool')

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
    const layers = [
      this.editor.viewport,
      this.editor.gridLayer.position,
      this.editor.subGridLayer.position,
      this.editor.baseLayer.position
    ]

    layers.forEach(point => {
      point.x += ev.delta.x
      point.y += ev.delta.y
    })
  }
}

module.exports = {
  HandTool
}

'use strict'

const { Tool: PaperTool } = require('paper')

class Tool {
  constructor (editor, button) {
    this.editor = editor
    this.button = button

    this.tool = new PaperTool()
    this.tool.onMouseDown = this.onMouseDown.bind(this)
    this.tool.onMouseMove = this.onMouseMove.bind(this)
    this.tool.onKeyDown = this.onKeyDown.bind(this)
  }

  activate () {
    this.tool.activate()

    this.button.classList.add('active')
    this.button.blur()
  }

  deactivate () {
    this.button.classList.remove('active')
  }

  onMouseDown (ev) {}

  onMouseMove (ev) {}

  onKeyDown (ev) {}
}

module.exports = {
  Tool
}

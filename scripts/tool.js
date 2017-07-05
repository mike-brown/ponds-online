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

    this.button.textContent = `> ${this.button.textContent}`
    this.button.blur()
  }

  deactivate () {
    this.button.textContent = this.button.textContent.slice(2)
  }

  onMouseDown (ev) {}

  onMouseMove (ev) {}

  onKeyDown (ev) {}
}

module.exports = {
  Tool
}

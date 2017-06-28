'use strict'

const { Tool: PaperTool } = require('paper')

class Tool {
  constructor (editor) {
    this.editor = editor

    this.tool = new PaperTool()
    this.tool.onMouseDown = this.onMouseDown.bind(this)
    this.tool.onMouseMove = this.onMouseMove.bind(this)
    this.tool.onKeyDown = this.onKeyDown.bind(this)
  }

  activate () {
    this.tool.activate()
  }

  onMouseDown (ev) {}

  onMouseMove (ev) {}

  onKeyDown (ev) {}
}

module.exports = {
  Tool
}

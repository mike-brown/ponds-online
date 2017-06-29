'use strict'

const { paper, Path } = require('paper')

class Editor {
  constructor ($canvas) {
    paper.setup($canvas)

    this._activeTool = undefined
    this._drawing = false
    this._tools = {}

    this.pond = Editor.createPond()
    this.mask = Editor.createMask()
  }

  get drawing () {
    return this._drawing
  }

  set drawing (value) {
    this._drawing = value
  }

  registerTool (name, tool) {
    this._tools[name] = tool
  }

  deregisterTool (name) {
    delete this._tools[name]
  }

  activateTool (name) {
    this._tools[name].activate()
  }

  reset () {
    this._activeTool = undefined
    this._drawing = false

    this.pond = Editor.createPond()
    this.mask = Editor.createMask()
  }

  fillPond () {
    this.pond.fillColor = this.pond.intersects(this.pond) ? 'red' : 'lightblue'
  }

  static removeLastSegment (path) {
    path.removeSegment(path.segments.length - 1)
  }

  static createPond () {
    const pond = new Path()
    pond.strokeColor = 'white'
    pond.fillColor = 'lightblue'
    pond.closed = true

    return pond
  }

  static createMask () {
    const mask = new Path()
    mask.strokeColor = 'white'
    mask.fillColor = 'black'
    mask.closed = true

    return mask
  }
}

module.exports = {
  Editor
}

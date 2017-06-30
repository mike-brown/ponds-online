'use strict'

const { paper, Path } = require('paper')

class Editor {
  constructor ($canvas) {
    paper.setup($canvas)
    paper.settings.hitTolerance = 5

    this._activeTool = undefined
    this._drawing = false
    this._tools = {}
    this._veg = []
    this._hitTarget = undefined

    this.pond = Editor.createPond()
    this.mask = Editor.createMask()
    this.vegmask = Editor.createVegMask()
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
    console.log(`activating ${name} tool`)
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

  static createVegMask () {
    const mask = new Path()
    mask.strokeColor = 'white'
    mask.fillColor = 'lightgreen'
    mask.closed = true

    return mask
  }
}

module.exports = {
  Editor
}

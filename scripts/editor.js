'use strict'

const { paper, Path } = require('paper')

class Editor {
  constructor ($canvas) {
    paper.setup($canvas)
    paper.settings.hitTolerance = 5

    this._activeTool = undefined
    this._drawing = false
    this._tools = {}
    this._hitTarget = undefined
    this.inlet = undefined

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
    pond.strokeColor = Editor.colors.white
    pond.fillColor = Editor.colors.aqua
    pond.closed = true

    return pond
  }

  static createMask () {
    const mask = new Path()
    mask.strokeColor = Editor.colors.white
    mask.fillColor = Editor.colors.black
    mask.closed = true

    return mask
  }

  static createVegMask () {
    const mask = new Path()
    mask.strokeColor = Editor.colors.white
    mask.fillColor = Editor.colors.green
    mask.closed = true

    return mask
  }

  static get colors () {
    return {
      white: '#ffffff',
      black: '#000000',
      red: '#ff4136',
      blue: '#0074d9',
      green: '#2ecc40',
      aqua: '#7fdbff'
    }
  }
}

module.exports = {
  Editor
}
